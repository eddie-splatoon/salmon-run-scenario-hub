import { GoogleGenAI, MediaResolution } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { buildAnalysisPrompt } from '@/lib/ai/prompt'
import { createClient } from '@/lib/supabase/server'
import { fetchMasterNames } from '@/lib/utils/master-names'
import { lookupStageId, lookupWeaponIds } from '@/lib/utils/master-lookup'
import type { AnalyzedScenario, AnalyzeResponse } from '@/app/types/analyze'

// 利用可能なモデル: gemini-3-flash-preview, gemini-2.5-flash, gemini-2.5-pro など
const DEFAULT_MODEL_NAME = 'gemini-3-flash-preview'

async function imageToBase64(image: File | Blob): Promise<string> {
  const arrayBuffer = await image.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return buffer.toString('base64')
}

function buildResponseSchema(stages: string[]) {
  // ステージ名のみ enum 制約（7 件と少なく、制約による視覚認識への影響が限定的）。
  // ブキ名は enum 制約しない（大きな enum の constrained decoding が誤選択を強制するため）。
  const stageNameField: Record<string, unknown> = { type: 'string' }
  if (stages.length > 0) {
    stageNameField.enum = stages
  }

  return {
    type: 'object',
    properties: {
      scenario_code: { type: 'string' },
      stage_name: stageNameField,
      danger_rate: { type: 'integer', minimum: 0, maximum: 333 },
      score: { type: 'integer' },
      weapons: {
        type: 'array',
        items: { type: 'string' },
        minItems: 4,
        maxItems: 4,
      },
      waves: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            wave_number: {
              oneOf: [
                { type: 'integer', minimum: 1, maximum: 3 },
                { type: 'string', enum: ['EX'] },
              ],
            },
            tide: { type: 'string', enum: ['low', 'normal', 'high'] },
            event: { type: ['string', 'null'] },
            delivered_count: { type: 'integer' },
            quota: { type: 'integer' },
            cleared: { type: 'boolean' },
          },
          required: ['wave_number', 'tide', 'delivered_count'],
        },
      },
    },
    required: ['scenario_code', 'stage_name', 'danger_rate', 'weapons', 'waves'],
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    // 認証チェック: 未ログインでの AI 解析利用を禁止（Gemini API 課金スパム対策）
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      )
    }

    const base64Image = await imageToBase64(imageFile)
    const mimeType = imageFile.type || 'image/jpeg'

    // マスタ名称を取得:
    // - stages: responseSchema の enum に注入（選択肢が少ないため制約の悪影響が小さい）
    // - weapons: プロンプトにヒントとして列挙（enum 制約は constrained decoding で誤選択を誘発するため回避）
    const { stages, weapons } = await fetchMasterNames()
    const responseSchema = buildResponseSchema(stages)
    const prompt = buildAnalysisPrompt(weapons)

    const modelName = process.env.GEMINI_MODEL_NAME || DEFAULT_MODEL_NAME
    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { text: prompt },
        { inlineData: { data: base64Image, mimeType } },
      ],
      config: {
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseJsonSchema: responseSchema,
      },
    })

    const text = response.text
    if (!text) {
      console.error('Gemini returned empty text response')
      return NextResponse.json(
        { success: false, error: 'AI からの応答が空でした。' },
        { status: 500 }
      )
    }

    let analyzedData: AnalyzedScenario
    try {
      analyzedData = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse JSON:', text, parseError)
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      )
    }

    const stageId = await lookupStageId(analyzedData.stage_name)
    if (!stageId) {
      console.warn(`Stage not found: ${analyzedData.stage_name}`)
    }

    const weaponIds = await lookupWeaponIds(analyzedData.weapons)

    return NextResponse.json({
      success: true,
      data: {
        ...analyzedData,
        stage_id: stageId ?? undefined,
        weapon_ids: weaponIds.filter((id): id is number => id !== null),
      },
    })
  } catch (error) {
    console.error('Error analyzing image:', error)

    let errorMessage = '画像の解析中にエラーが発生しました。しばらく時間をおいてから再度お試しください。'
    let statusCode = 500

    if (error instanceof Error) {
      const errorMsg = error.message

      if (
        errorMsg.includes('429') ||
        errorMsg.includes('Too Many Requests') ||
        errorMsg.includes('quota') ||
        errorMsg.includes('Quota exceeded') ||
        errorMsg.includes('You exceeded your current quota')
      ) {
        errorMessage = 'リクエスト数の上限に達しました。しばらく時間をおいてから再度お試しください。'
        statusCode = 429
      } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        errorMessage = 'モデルが見つかりません。環境変数GEMINI_MODEL_NAMEで正しいモデル名を指定してください。'
        statusCode = 404
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('API key')) {
        errorMessage = 'APIキーの認証に失敗しました。設定を確認してください。'
        statusCode = 401
      } else {
        console.error('Technical error details:', errorMsg)
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}
