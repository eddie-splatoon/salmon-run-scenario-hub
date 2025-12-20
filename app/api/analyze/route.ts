import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { ANALYSIS_PROMPT } from '@/lib/ai/prompt'
import { lookupStageId, lookupWeaponIds } from '@/lib/utils/master-lookup'
import type { AnalyzedScenario, AnalyzeResponse } from '@/app/types/analyze'

// デフォルトモデル名（環境変数で上書き可能）
// 利用可能なモデル: gemini-1.5-pro, gemini-1.5-flash-002, gemini-pro-vision など
// 利用可能なモデルを確認するには:
// curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
const DEFAULT_MODEL_NAME = 'gemini-1.5-pro'

/**
 * 画像をBase64エンコードする
 */
async function imageToBase64(image: File | Blob): Promise<string> {
  const arrayBuffer = await image.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return buffer.toString('base64')
}

/**
 * 画像を解析してシナリオ情報を抽出するAPIエンドポイント
 */
export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    // APIキーの確認
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // リクエストから画像を取得
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      )
    }

    // 画像をBase64に変換
    const base64Image = await imageToBase64(imageFile)
    const mimeType = imageFile.type || 'image/jpeg'

    // Gemini APIを初期化
    const modelName = process.env.GEMINI_MODEL_NAME || DEFAULT_MODEL_NAME
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelName })

    // 画像解析を実行
    const result = await model.generateContent([
      ANALYSIS_PROMPT,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ])

    const response = result.response
    const text = response.text()

    // JSONを抽出（```json と ``` で囲まれている可能性がある）
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // JSONをパース
    let analyzedData: AnalyzedScenario
    try {
      analyzedData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse JSON:', text, parseError)
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      )
    }

    // 名寄せ: ステージ名をIDに変換
    const stageId = await lookupStageId(analyzedData.stage_name)
    if (!stageId) {
      console.warn(`Stage not found: ${analyzedData.stage_name}`)
    }

    // 名寄せ: 武器名をIDに変換（オプション、後で使用する可能性があるため）
    const weaponIds = await lookupWeaponIds(analyzedData.weapons)

    // レスポンスを返す（マスタIDも含める）
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
    
    // より詳細なエラーメッセージを提供
    let errorMessage = '画像の解析中にエラーが発生しました。しばらく時間をおいてから再度お試しください。'
    let statusCode = 500
    
    if (error instanceof Error) {
      const errorMsg = error.message
      
      // レート制限エラー（429 Too Many Requests）
      if (
        errorMsg.includes('429') ||
        errorMsg.includes('Too Many Requests') ||
        errorMsg.includes('quota') ||
        errorMsg.includes('Quota exceeded') ||
        errorMsg.includes('You exceeded your current quota')
      ) {
        errorMessage = 'リクエスト数の上限に達しました。しばらく時間をおいてから再度お試しください。'
        statusCode = 429
      }
      // モデルが見つからない場合
      else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        errorMessage = 'モデルが見つかりません。環境変数GEMINI_MODEL_NAMEで正しいモデル名を指定してください。'
        statusCode = 404
      }
      // 認証エラー
      else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('API key')) {
        errorMessage = 'APIキーの認証に失敗しました。設定を確認してください。'
        statusCode = 401
      }
      // その他のエラー
      else {
        // 技術的なエラーメッセージはログに記録するが、ユーザーには一般的なメッセージを返す
        console.error('Technical error details:', errorMsg)
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    )
  }
}

