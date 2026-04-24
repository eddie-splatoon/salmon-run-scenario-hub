/**
 * クライアント側で「保存したバイトシナリオ」詳細ペインから
 * ブキアイコン4枚を切り出して拡大するユーティリティ。
 *
 * Gemini に画像全体だけを渡すとアイコンが小さすぎて誤認するため、
 * 拡大した4アイコンを multi-part で併送する。
 *
 * 想定レイアウト: アスペクト比 16:9 のキャプチャ画像（IMG_5116.JPG など）。
 * 「キケン度 と ハイスコア の間」に水平配置される 4 アイコン領域を
 * 比率ベースで切り出すため、解像度（960×540 / 1280×720 / 1920×1080 等）に依存しない。
 */

/**
 * 4つのブキアイコン領域全体（行）の入力画像内における比率。
 * IMG_5116.JPG (960×540) を基準に実測した近似値。
 *
 * 切り出し時は左右に余白（PADDING_RATIO）を取り、
 * アイコンの一部が切れないようにする。
 */
export const WEAPON_ROW_RATIO = {
  xStart: 0.57,
  xEnd: 0.93,
  yStart: 0.22,
  yEnd: 0.30,
} as const

/** 各アイコンの周囲に取る安全マージン（領域幅・高さに対する比率） */
const PADDING_RATIO = 0.05

/** 出力サイズ（拡大後）。Gemini が認識しやすい程度に大きく取る。 */
export const CROP_OUTPUT_SIZE = {
  width: 256,
  height: 256,
} as const

/** ブキアイコンの枚数（固定）。 */
export const WEAPON_COUNT = 4

export interface CropRect {
  /** 入力画像の自然座標における切り出し X 開始位置（px） */
  sx: number
  /** 入力画像の自然座標における切り出し Y 開始位置（px） */
  sy: number
  /** 切り出し幅（px） */
  sw: number
  /** 切り出し高さ（px） */
  sh: number
}

/**
 * 入力画像の自然サイズ（naturalWidth / naturalHeight）から、
 * 4 つのブキアイコン領域を計算する。純粋関数。
 *
 * @param naturalWidth - 入力画像の自然幅（px）
 * @param naturalHeight - 入力画像の自然高さ（px）
 * @returns 4 つのアイコン領域（左→右の順）
 */
export function computeWeaponCropRects(
  naturalWidth: number,
  naturalHeight: number
): CropRect[] {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    throw new Error('naturalWidth / naturalHeight must be positive')
  }

  const rowLeft = naturalWidth * WEAPON_ROW_RATIO.xStart
  const rowRight = naturalWidth * WEAPON_ROW_RATIO.xEnd
  const rowTop = naturalHeight * WEAPON_ROW_RATIO.yStart
  const rowBottom = naturalHeight * WEAPON_ROW_RATIO.yEnd

  const rowWidth = rowRight - rowLeft
  const rowHeight = rowBottom - rowTop
  const cellWidth = rowWidth / WEAPON_COUNT

  const padX = cellWidth * PADDING_RATIO
  const padY = rowHeight * PADDING_RATIO

  const rects: CropRect[] = []
  for (let i = 0; i < WEAPON_COUNT; i++) {
    const cellLeft = rowLeft + cellWidth * i
    const sx = Math.max(0, Math.floor(cellLeft - padX))
    const sy = Math.max(0, Math.floor(rowTop - padY))
    const sw = Math.min(
      naturalWidth - sx,
      Math.ceil(cellWidth + padX * 2)
    )
    const sh = Math.min(
      naturalHeight - sy,
      Math.ceil(rowHeight + padY * 2)
    )
    rects.push({ sx, sy, sw, sh })
  }
  return rects
}

/**
 * File からブラウザ側で HTMLImageElement をロードする。
 * 失敗時は reject。
 */
export function loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

/**
 * Canvas API で領域を切り出して指定サイズに拡大し、Blob として返す。
 *
 * @param img - 既にロード済みの HTMLImageElement
 * @param rect - 切り出し領域（自然座標）
 * @param mimeType - 出力 MIME タイプ
 * @param quality - JPEG 品質（0-1）
 */
export function cropAndScaleToBlob(
  img: HTMLImageElement,
  rect: CropRect,
  mimeType: string = 'image/jpeg',
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = CROP_OUTPUT_SIZE.width
    canvas.height = CROP_OUTPUT_SIZE.height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Failed to get 2D context'))
      return
    }

    // 補間品質を上げて拡大時のジャギを抑える
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      img,
      rect.sx,
      rect.sy,
      rect.sw,
      rect.sh,
      0,
      0,
      CROP_OUTPUT_SIZE.width,
      CROP_OUTPUT_SIZE.height
    )

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('canvas.toBlob returned null'))
        }
      },
      mimeType,
      quality
    )
  })
}

/**
 * File から 4 つのブキアイコンクロップ Blob を生成する。
 *
 * @param file - 元の画像ファイル
 * @param mimeType - 出力 MIME タイプ
 */
export async function extractWeaponCrops(
  file: File,
  mimeType: string = 'image/jpeg'
): Promise<Blob[]> {
  const img = await loadImageElement(file)
  const rects = computeWeaponCropRects(img.naturalWidth, img.naturalHeight)
  return Promise.all(rects.map((rect) => cropAndScaleToBlob(img, rect, mimeType)))
}
