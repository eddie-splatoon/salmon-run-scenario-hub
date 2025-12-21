import { describe, it, expect } from 'vitest'
import { calculateScenarioTags } from '../scenario-tags'
import type { ScenarioTags } from '../scenario-tags'

describe('calculateScenarioTags', () => {
  it('should add クマフェス tag when all weapons are yellow random', () => {
    const scenario = {
      danger_rate: 200,
      total_golden_eggs: 150,
      waves: [
        { wave_number: 1, event: null, cleared: true },
        { wave_number: 2, event: 'ラッシュ', cleared: true },
        { wave_number: 3, event: null, cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: '黄ランダム' },
        { weapon_id: 2, weapon_name: '黄ランダム' },
        { weapon_id: 3, weapon_name: '黄ランダム' },
        { weapon_id: 4, weapon_name: '黄ランダム' },
      ],
    }

    const result: ScenarioTags = calculateScenarioTags(scenario)

    expect(result.tags).toContain('クマフェス')
    expect(result.tagColors['クマフェス']).toBe('bg-yellow-500/20 text-yellow-300 border-yellow-500/50')
  })

  it('should add オルラン tag when all weapons are green random', () => {
    const scenario = {
      danger_rate: 200,
      total_golden_eggs: 150,
      waves: [
        { wave_number: 1, event: null, cleared: true },
        { wave_number: 2, event: 'ラッシュ', cleared: true },
        { wave_number: 3, event: null, cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: '緑ランダム' },
        { weapon_id: 2, weapon_name: '緑ランダム' },
        { weapon_id: 3, weapon_name: '緑ランダム' },
        { weapon_id: 4, weapon_name: '緑ランダム' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('オルラン')
    expect(result.tagColors['オルラン']).toBe('bg-green-500/20 text-green-300 border-green-500/50')
  })

  it('should add 初心者向け tag when danger rate is below 160', () => {
    const scenario = {
      danger_rate: 150,
      total_golden_eggs: 150,
      waves: [
        { wave_number: 1, event: null, cleared: true },
        { wave_number: 2, event: 'ラッシュ', cleared: true },
        { wave_number: 3, event: null, cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: 'スプラシューター' },
        { weapon_id: 2, weapon_name: 'スプラチャージャー' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('初心者向け')
    expect(result.tagColors['初心者向け']).toBe('bg-green-500/20 text-green-300 border-green-500/50')
  })

  it('should add 未クリア tag when all normal waves are not cleared', () => {
    const scenario = {
      danger_rate: 200,
      total_golden_eggs: 150,
      waves: [
        { wave_number: 1, event: null, cleared: false },
        { wave_number: 2, event: 'ラッシュ', cleared: false },
        { wave_number: 3, event: null, cleared: false },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: 'スプラシューター' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('未クリア')
    expect(result.tagColors['未クリア']).toBe('bg-gray-500/20 text-gray-300 border-gray-500/50')
  })

  it('should add 高難易度 tag when danger rate is 333 and has failed wave', () => {
    const scenario = {
      danger_rate: 333,
      total_golden_eggs: 150,
      waves: [
        { wave_number: 1, event: null, cleared: true },
        { wave_number: 2, event: 'ラッシュ', cleared: false },
        { wave_number: 3, event: null, cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: 'スプラシューター' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('高難易度')
    expect(result.tagColors['高難易度']).toBe('bg-red-500/20 text-red-300 border-red-500/50')
  })

  it('should add 乱獲向け tag when total golden eggs exceeds 200', () => {
    const scenario = {
      danger_rate: 200,
      total_golden_eggs: 250,
      waves: [
        { wave_number: 1, event: null, cleared: true },
        { wave_number: 2, event: 'ラッシュ', cleared: true },
        { wave_number: 3, event: null, cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: 'スプラシューター' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('乱獲向け')
    expect(result.tagColors['乱獲向け']).toBe('bg-yellow-500/20 text-yellow-300 border-yellow-500/50')
  })

  it('should add 昼のみ tag when no events in normal waves', () => {
    const scenario = {
      danger_rate: 200,
      total_golden_eggs: 150,
      waves: [
        { wave_number: 1, event: null, cleared: true },
        { wave_number: 2, event: null, cleared: true },
        { wave_number: 3, event: null, cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: 'スプラシューター' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('昼のみ')
    expect(result.tagColors['昼のみ']).toBe('bg-blue-500/20 text-blue-300 border-blue-500/50')
  })

  it('should add 夜1 tag when one event in normal waves', () => {
    const scenario = {
      danger_rate: 200,
      total_golden_eggs: 150,
      waves: [
        { wave_number: 1, event: null, cleared: true },
        { wave_number: 2, event: 'ラッシュ', cleared: true },
        { wave_number: 3, event: null, cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: 'スプラシューター' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('夜1')
    expect(result.tagColors['夜1']).toBe('bg-purple-500/20 text-purple-300 border-purple-500/50')
  })

  it('should add 夜2 tag when two events in normal waves', () => {
    const scenario = {
      danger_rate: 200,
      total_golden_eggs: 150,
      waves: [
        { wave_number: 1, event: 'ラッシュ', cleared: true },
        { wave_number: 2, event: 'ラッシュ', cleared: true },
        { wave_number: 3, event: null, cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: 'スプラシューター' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('夜2')
    expect(result.tagColors['夜2']).toBe('bg-indigo-500/20 text-indigo-300 border-indigo-500/50')
  })

  it('should add 夜のみ tag when three events in normal waves', () => {
    const scenario = {
      danger_rate: 200,
      total_golden_eggs: 150,
      waves: [
        { wave_number: 1, event: 'ラッシュ', cleared: true },
        { wave_number: 2, event: 'ラッシュ', cleared: true },
        { wave_number: 3, event: 'ラッシュ', cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: 'スプラシューター' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('夜のみ')
    expect(result.tagColors['夜のみ']).toBe('bg-pink-500/20 text-pink-300 border-pink-500/50')
  })

  it('should add オカシラあり tag when EX wave exists', () => {
    const scenario = {
      danger_rate: 200,
      total_golden_eggs: 150,
      waves: [
        { wave_number: 1, event: null, cleared: true },
        { wave_number: 2, event: 'ラッシュ', cleared: true },
        { wave_number: 3, event: null, cleared: true },
        { wave_number: 4, event: 'ヨコヅナ', cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: 'スプラシューター' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('オカシラあり')
    expect(result.tagColors['オカシラあり']).toBe('bg-orange-500/20 text-orange-300 border-orange-500/50')
  })

  it('should calculate multiple tags correctly', () => {
    const scenario = {
      danger_rate: 333,
      total_golden_eggs: 250,
      waves: [
        { wave_number: 1, event: 'ラッシュ', cleared: false },
        { wave_number: 2, event: 'ラッシュ', cleared: false },
        { wave_number: 3, event: null, cleared: false },
        { wave_number: 4, event: 'ヨコヅナ', cleared: true },
      ],
      weapons: [
        { weapon_id: 1, weapon_name: '黄ランダム' },
        { weapon_id: 2, weapon_name: '黄ランダム' },
        { weapon_id: 3, weapon_name: '黄ランダム' },
        { weapon_id: 4, weapon_name: '黄ランダム' },
      ],
    }

    const result = calculateScenarioTags(scenario)

    expect(result.tags).toContain('クマフェス')
    expect(result.tags).toContain('未クリア')
    expect(result.tags).toContain('高難易度')
    expect(result.tags).toContain('乱獲向け')
    expect(result.tags).toContain('夜2')
    expect(result.tags).toContain('オカシラあり')
  })
})

