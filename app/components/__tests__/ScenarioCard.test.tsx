import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScenarioCard from '../ScenarioCard'

describe('ScenarioCard', () => {
  const mockWeapons = [
    {
      weapon_id: 1,
      weapon_name: 'スプラシューター',
      icon_url: 'https://example.com/weapon1.png',
      display_order: 1,
    },
    {
      weapon_id: 2,
      weapon_name: 'スプラローラー',
      icon_url: 'https://example.com/weapon2.png',
      display_order: 2,
    },
    {
      weapon_id: 3,
      weapon_name: 'スプラチャージャー',
      icon_url: null,
      display_order: 3,
    },
    {
      weapon_id: 4,
      weapon_name: 'スプラスロッシャー',
      icon_url: 'https://example.com/weapon4.png',
      display_order: 4,
    },
  ]

  it('should render scenario code and total golden eggs', () => {
    render(
      <ScenarioCard
        code="ABC123"
        stageName="アラマキ砦"
        dangerRate={100}
        totalGoldenEggs={150}
        weapons={mockWeapons}
      />
    )

    expect(screen.getByText('ABC123')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('金イクラ')).toBeInTheDocument()
  })

  it('should render stage name and danger rate', () => {
    render(
      <ScenarioCard
        code="ABC123"
        stageName="アラマキ砦"
        dangerRate={200}
        totalGoldenEggs={150}
        weapons={mockWeapons}
      />
    )

    expect(screen.getByText('アラマキ砦')).toBeInTheDocument()
    expect(screen.getByText('キケン度:')).toBeInTheDocument()
    expect(screen.getByText('200%')).toBeInTheDocument()
  })

  it('should render weapon icons', () => {
    render(
      <ScenarioCard
        code="ABC123"
        stageName="アラマキ砦"
        dangerRate={100}
        totalGoldenEggs={150}
        weapons={mockWeapons}
      />
    )

    // 武器名が表示されているか確認（アイコンがない場合は武器名が表示される）
    expect(screen.getByTitle('スプラチャージャー')).toBeInTheDocument()
  })

  it('should render empty slots when weapons are less than 4', () => {
    const fewerWeapons = mockWeapons.slice(0, 2)

    render(
      <ScenarioCard
        code="ABC123"
        stageName="アラマキ砦"
        dangerRate={100}
        totalGoldenEggs={150}
        weapons={fewerWeapons}
      />
    )

    // 空のスロットが表示される（ダッシュ記号）
    const emptySlots = screen.getAllByText('-')
    expect(emptySlots.length).toBeGreaterThan(0)
  })

  it('should display weapon name when icon_url is null', () => {
    const weaponsWithoutIcon = [
      {
        weapon_id: 1,
        weapon_name: 'テスト武器',
        icon_url: null,
        display_order: 1,
      },
    ]

    render(
      <ScenarioCard
        code="ABC123"
        stageName="アラマキ砦"
        dangerRate={100}
        totalGoldenEggs={150}
        weapons={weaponsWithoutIcon}
      />
    )

    expect(screen.getByText('テスト武器')).toBeInTheDocument()
  })
})

