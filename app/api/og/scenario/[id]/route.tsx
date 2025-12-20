import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scenarioCode } = await params
    const supabase = await createClient()

    // シナリオ情報を取得
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select(`
        code,
        stage_id,
        danger_rate,
        total_golden_eggs,
        total_power_eggs,
        m_stages!inner(name)
      `)
      .eq('code', scenarioCode)
      .single()

    if (scenarioError || !scenario) {
      return new Response('Scenario not found', { status: 404 })
    }

    // 型アサーション
    type ScenarioWithStage = {
      code: string
      stage_id: number
      danger_rate: number
      total_golden_eggs: number
      total_power_eggs: number
      m_stages: { name: string }
    }

    const typedScenario = scenario as ScenarioWithStage

    // 武器情報を取得
    const { data: scenarioWeapons } = await supabase
      .from('scenario_weapons')
      .select(`
        display_order,
        m_weapons!inner(name)
      `)
      .eq('scenario_code', scenarioCode)
      .order('display_order')
      .limit(4)

    type ScenarioWeaponWithWeapon = {
      display_order: number
      m_weapons: { name: string }
    }

    const typedWeapons = (scenarioWeapons || []) as ScenarioWeaponWithWeapon[]
    const weaponNames = typedWeapons.map((sw) => sw.m_weapons.name).join(' / ')

    // OGP画像を生成
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#111827',
            backgroundImage: 'linear-gradient(to bottom, #1f2937, #111827)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* ステージ名 */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#f3f4f6',
              marginBottom: 20,
            }}
          >
            {typedScenario.m_stages.name}
          </div>

          {/* 金イクラ数 */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: '#fbbf24',
              marginBottom: 30,
            }}
          >
            {typedScenario.total_golden_eggs} 金イクラ
          </div>

          {/* 危険度 */}
          <div
            style={{
              fontSize: 32,
              color: '#9ca3af',
              marginBottom: 20,
            }}
          >
            危険度: {typedScenario.danger_rate}%
          </div>

          {/* 武器構成 */}
          {weaponNames && (
            <div
              style={{
                fontSize: 28,
                color: '#d1d5db',
                marginTop: 20,
                padding: '0 40px',
                textAlign: 'center',
              }}
            >
              {weaponNames}
            </div>
          )}

          {/* シナリオコード */}
          <div
            style={{
              fontSize: 24,
              color: '#6b7280',
              marginTop: 40,
            }}
          >
            Code: {typedScenario.code}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OGP画像生成エラー:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

