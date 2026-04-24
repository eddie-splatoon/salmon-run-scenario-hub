/**
 * リファレンス画像 (IMG_5116.JPG) を現在の WEAPON_ROW_RATIO でクロップして
 * 4 アイコン拡大画像と「全体に枠を描画したオーバーレイ画像」を出力する。
 *
 * 使い方: npx tsx scripts/preview-weapon-crops.ts <input-image>
 * デフォルト入力: IMG_5116.JPG
 * 出力先: tmp/weapon-crops/
 */
/* eslint-disable no-console */
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs/promises'
import { computeWeaponCropRects, CROP_OUTPUT_SIZE, WEAPON_ROW_RATIO } from '../lib/utils/weapon-crop'

async function main() {
  const inputPath = process.argv[2] || 'IMG_5116.JPG'
  const outDir = path.resolve('tmp/weapon-crops')
  await fs.mkdir(outDir, { recursive: true })

  const inputAbs = path.resolve(inputPath)
  const meta = await sharp(inputAbs).metadata()
  const w = meta.width!
  const h = meta.height!
  console.log(`[input] ${inputPath}  ${w}×${h}`)
  console.log(
    `[ratio] X ${(WEAPON_ROW_RATIO.xStart * 100).toFixed(1)}%-${(WEAPON_ROW_RATIO.xEnd * 100).toFixed(1)}%  Y ${(WEAPON_ROW_RATIO.yStart * 100).toFixed(1)}%-${(WEAPON_ROW_RATIO.yEnd * 100).toFixed(1)}%`
  )

  const rects = computeWeaponCropRects(w, h)

  // 各クロップを 256×256 に拡大して保存
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i]
    const out = path.join(outDir, `weapon_${i + 1}.jpg`)
    await sharp(inputAbs)
      .extract({ left: r.sx, top: r.sy, width: r.sw, height: r.sh })
      .resize(CROP_OUTPUT_SIZE.width, CROP_OUTPUT_SIZE.height, { fit: 'fill' })
      .jpeg({ quality: 92 })
      .toFile(out)
    console.log(`[crop ${i + 1}] sx=${r.sx} sy=${r.sy} sw=${r.sw} sh=${r.sh} → ${path.relative('.', out)}`)
  }

  // オーバーレイ: 各クロップ領域を赤枠で描画した SVG を合成
  const strokeWidth = Math.max(2, Math.round(w / 480))
  const svgRects = rects
    .map(
      (r, i) =>
        `<rect x="${r.sx}" y="${r.sy}" width="${r.sw}" height="${r.sh}" fill="none" stroke="#ff0000" stroke-width="${strokeWidth}" />` +
        `<text x="${r.sx + 4}" y="${r.sy + 14}" font-family="sans-serif" font-size="12" fill="#ff0000">${i + 1}</text>`
    )
    .join('')
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`
  const overlayOut = path.join(outDir, 'overlay.png')
  await sharp(inputAbs)
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toFile(overlayOut)
  console.log(`[overlay] → ${path.relative('.', overlayOut)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
