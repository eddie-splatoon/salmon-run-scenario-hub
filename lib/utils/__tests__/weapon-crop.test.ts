import { describe, it, expect } from 'vitest'
import {
  computeWeaponCropRects,
  WEAPON_COUNT,
  WEAPON_ROW_RATIO,
  CROP_OUTPUT_SIZE,
} from '../weapon-crop'

describe('computeWeaponCropRects', () => {
  it('returns exactly 4 rectangles', () => {
    const rects = computeWeaponCropRects(960, 540)
    expect(rects).toHaveLength(WEAPON_COUNT)
  })

  it('rectangles fit within the image bounds', () => {
    const cases: Array<[number, number]> = [
      [960, 540],
      [1280, 720],
      [1920, 1080],
    ]
    for (const [w, h] of cases) {
      const rects = computeWeaponCropRects(w, h)
      for (const r of rects) {
        expect(r.sx).toBeGreaterThanOrEqual(0)
        expect(r.sy).toBeGreaterThanOrEqual(0)
        expect(r.sx + r.sw).toBeLessThanOrEqual(w)
        expect(r.sy + r.sh).toBeLessThanOrEqual(h)
      }
    }
  })

  it('rectangles are arranged left-to-right (sx is non-decreasing)', () => {
    const rects = computeWeaponCropRects(1920, 1080)
    for (let i = 1; i < rects.length; i++) {
      expect(rects[i].sx).toBeGreaterThan(rects[i - 1].sx)
    }
  })

  it('rectangles share the same vertical band', () => {
    const rects = computeWeaponCropRects(1920, 1080)
    const ys = new Set(rects.map((r) => r.sy))
    const hs = new Set(rects.map((r) => r.sh))
    expect(ys.size).toBe(1)
    expect(hs.size).toBe(1)
  })

  it('approximate area matches WEAPON_ROW_RATIO when scaled by image size', () => {
    const w = 960
    const h = 540
    const rects = computeWeaponCropRects(w, h)
    const expectedRowWidth = w * (WEAPON_ROW_RATIO.xEnd - WEAPON_ROW_RATIO.xStart)
    const expectedRowHeight = h * (WEAPON_ROW_RATIO.yEnd - WEAPON_ROW_RATIO.yStart)
    const expectedCellWidth = expectedRowWidth / WEAPON_COUNT

    // 各セルが期待サイズの ±20%（パディング込み）内に収まる
    for (const r of rects) {
      expect(r.sw).toBeGreaterThanOrEqual(expectedCellWidth * 0.9)
      expect(r.sw).toBeLessThanOrEqual(expectedCellWidth * 1.5)
      expect(r.sh).toBeGreaterThanOrEqual(expectedRowHeight * 0.9)
      expect(r.sh).toBeLessThanOrEqual(expectedRowHeight * 1.5)
    }
  })

  it('scales proportionally between image sizes', () => {
    const small = computeWeaponCropRects(960, 540)
    const large = computeWeaponCropRects(1920, 1080)

    // 解像度が 2 倍なら各座標も概ね 2 倍（パディングの整数化で誤差 ±2px）
    for (let i = 0; i < small.length; i++) {
      expect(large[i].sx).toBeGreaterThanOrEqual(small[i].sx * 2 - 2)
      expect(large[i].sx).toBeLessThanOrEqual(small[i].sx * 2 + 2)
    }
  })

  it('throws when given non-positive dimensions', () => {
    expect(() => computeWeaponCropRects(0, 540)).toThrow()
    expect(() => computeWeaponCropRects(960, -1)).toThrow()
  })

  it('CROP_OUTPUT_SIZE provides positive dimensions', () => {
    expect(CROP_OUTPUT_SIZE.width).toBeGreaterThan(0)
    expect(CROP_OUTPUT_SIZE.height).toBeGreaterThan(0)
  })
})
