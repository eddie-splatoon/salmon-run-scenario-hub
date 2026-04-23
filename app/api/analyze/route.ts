import { GoogleGenAI, MediaResolution } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { ANALYSIS_PROMPT } from '@/lib/ai/prompt'
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

function buildResponseSchema(stages: string[], weapons: string[]) {
  const stageNameField: Record<string, unknown> = { type: 'string' }
  if (stages.length > 0) {
    stageNameField.enum = stages
  }
  const weaponItemField: Record<string, unknown> = { type: 'string' }
  if (weapons.length > 0) {
    weaponItemField.enum = weapons
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
        items: weaponItemField,
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

    // マスタから enum に注入する名称を取得（LLM が自由記述で外れないよう制約）
    const { stages, weapons } = await fetchMasterNames()
    const responseSchema = buildResponseSchema(stages, weapons)

    const modelName = process.env.GEMINI_MODEL_NAME || DEFAULT_MODEL_NAME
    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { text: ANALYSIS_PROMPT },
        { inlineData: { data: base64Image, mimeType } },
      ],
      config: {
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
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
