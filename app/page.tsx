import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ScenarioCard from './components/ScenarioCard'
import LogoIcon from './components/LogoIcon'
import HomeFilterSection from './components/HomeFilterSection'
import ScrollRestorer from './components/ScrollRestorer'
import { Upload, Search, ArrowRight, TrendingUp } from 'lucide-react'

interface Weapon {
  weapon_id: number
  weapon_name: string
  icon_url: string | null
  display_order: number
}

interface ScenarioListItem {
  code: string
  stage_id: number
  stage_name: string
  danger_rate: number
  total_golden_eggs: number
  created_at: string
  author_id: string
  weapons: Weapon[]
}

async function getLatestScenarios(limit: number = 6, tags: string[] = []): Promise<ScenarioListItem[]> {
  try {
    const supabase = await createClient()

    const query = supabase
      .from('scenarios')
      .select(`
        code,
        author_id,
        stage_id,
        danger_rate,
        total_golden_eggs,
        created_at,
        m_stages!inner(name)
      `)
      .order('created_at', { ascending: false })

    const { data: scenarios, error: scenariosError } = await query.limit(limit * 10) // フィルタ後にlimitを適用するため、多めに取得

    if (scenariosError || !scenarios) {
      console.error('シナリオ取得エラー:', scenariosError)
      return []
    }

    // 型アサーション: Supabaseのクエリ結果の型を明示
    type ScenarioWithStage = {
      code: string
      author_id: string
      stage_id: number
      danger_rate: number
      total_golden_eggs: number
      created_at: string
      m_stages: { name: string }
    }

    const typedScenarios = scenarios as ScenarioWithStage[]

    const scenarioCodes = typedScenarios.map((s) => s.code)

    // シナリオが存在しない場合は早期リターン
    if (scenarioCodes.length === 0) {
      return []
    }

    const { data: scenarioWeapons, error: weaponsError } = await supabase
      .from('scenario_weapons')
      .select(`
        scenario_code,
        weapon_id,
        display_order,
        m_weapons!inner(id, name, icon_url)
      `)
      .in('scenario_code', scenarioCodes)
      .order('scenario_code')
      .order('display_order')
      .limit(limit * 4) // 各シナリオに最大4つの武器があるため

    if (weaponsError) {
      console.error('武器情報取得エラー:', weaponsError)
      // 武器情報が取得できなくても、シナリオ情報は返す（武器は空配列になる）
    }

    const typedScenarioWeapons = (scenarioWeapons || []) as Array<{
      scenario_code: string
      weapon_id: number
      display_order: number
      m_weapons: { id: number; name: string; icon_url: string | null }
    }>

    // 武器フィルター適用
    let filteredScenarios = typedScenarios

    // ハッシュタグフィルター適用（OR条件：いずれかのタグが含まれていればOK）
    if (tags.length > 0) {
      // WAVE情報を取得（ハッシュタグ判定に必要）
      const { data: scenarioWaves, error: wavesError } = await supabase
        .from('scenario_waves')
        .select('scenario_code, wave_number, event, cleared')
        .in('scenario_code', filteredScenarios.map((s) => s.code))
        .order('scenario_code')
        .order('wave_number')

      if (!wavesError && scenarioWaves) {
        const typedScenarioWaves = scenarioWaves as Array<{
          scenario_code: string
          wave_number: number
          event: string | null
          cleared: boolean
        }>

        const { hasTag } = await import('@/lib/utils/scenario-tags-server')

        filteredScenarios = filteredScenarios.filter((scenario) => {
          const waves = typedScenarioWaves
            .filter((w) => w.scenario_code === scenario.code)
            .map((w) => ({
              wave_number: w.wave_number,
              event: w.event,
              cleared: w.cleared,
            }))

          const weapons = typedScenarioWeapons
            .filter((sw) => sw.scenario_code === scenario.code)
            .map((sw) => ({
              weapon_name: sw.m_weapons.name,
            }))

          const scenarioInfo = {
            danger_rate: scenario.danger_rate,
            total_golden_eggs: scenario.total_golden_eggs,
            waves,
            weapons,
          }

          // OR条件：いずれかのタグが含まれていればOK
          return tags.some((tag) => hasTag(scenarioInfo, tag))
        })
      }
    }

    return filteredScenarios.slice(0, limit).map((scenario) => {
      const weapons = typedScenarioWeapons
        .filter((sw) => sw.scenario_code === scenario.code)
        .map((sw) => ({
          weapon_id: sw.weapon_id,
          weapon_name: sw.m_weapons.name,
          icon_url: sw.m_weapons.icon_url,
          display_order: sw.display_order,
        }))
        .sort((a, b) => a.display_order - b.display_order)

      return {
        code: scenario.code,
        stage_id: scenario.stage_id,
        stage_name: scenario.m_stages.name,
        danger_rate: scenario.danger_rate,
        total_golden_eggs: scenario.total_golden_eggs,
        created_at: scenario.created_at,
        author_id: scenario.author_id,
        weapons,
      }
    })
  } catch (error) {
    console.error('最新シナリオ取得エラー:', error)
    return []
  }
}

interface TrendingScenario extends ScenarioListItem {
  like_count: number
}

async function getTrendingScenarios(limit: number = 6): Promise<TrendingScenario[]> {
  try {
    const supabase = await createClient()

    // 今週の開始日時を計算（月曜日の00:00:00）
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 月曜日を0とする
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - diff)
    weekStart.setHours(0, 0, 0, 0)

    // 今週のいいねを取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: weeklyLikes, error: likesError } = await (supabase as any)
      .from('likes')
      .select('scenario_code')
      .gte('created_at', weekStart.toISOString())

    if (likesError) {
      console.error('いいね取得エラー:', likesError)
      return []
    }

    // シナリオコードごとにいいね数を集計
    const likeCounts = new Map<string, number>()
    weeklyLikes?.forEach((like: { scenario_code: string }) => {
      const count = likeCounts.get(like.scenario_code) || 0
      likeCounts.set(like.scenario_code, count + 1)
    })

    // いいね数でソートして上位を取得
    const sortedCodes = Array.from(likeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([code]) => code)

    if (sortedCodes.length === 0) {
      return []
    }

    // シナリオ情報を取得
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select(`
        code,
        author_id,
        stage_id,
        danger_rate,
        total_golden_eggs,
        created_at,
        m_stages!inner(name)
      `)
      .in('code', sortedCodes)

    if (scenariosError || !scenarios) {
      console.error('シナリオ取得エラー:', scenariosError)
      return []
    }

    // 型アサーション
    type ScenarioWithStage = {
      code: string
      author_id: string
      stage_id: number
      danger_rate: number
      total_golden_eggs: number
      created_at: string
      m_stages: { name: string }
    }

    const typedScenarios = scenarios as ScenarioWithStage[]
    const scenarioCodes = typedScenarios.map((s) => s.code)

    // 武器情報を取得
    const { data: scenarioWeapons, error: weaponsError } = await supabase
      .from('scenario_weapons')
      .select(`
        scenario_code,
        weapon_id,
        display_order,
        m_weapons!inner(id, name, icon_url)
      `)
      .in('scenario_code', scenarioCodes)
      .order('scenario_code')
      .order('display_order')

    if (weaponsError) {
      console.error('武器情報取得エラー:', weaponsError)
    }

    const typedScenarioWeapons = (scenarioWeapons || []) as Array<{
      scenario_code: string
      weapon_id: number
      display_order: number
      m_weapons: { id: number; name: string; icon_url: string | null }
    }>

    // いいね数の順序を保持して結果を整形
    const result: TrendingScenario[] = sortedCodes
      .map((code) => {
        const scenario = typedScenarios.find((s) => s.code === code)
        if (!scenario) return null

        const weapons = typedScenarioWeapons
          .filter((sw) => sw.scenario_code === code)
          .map((sw) => ({
            weapon_id: sw.weapon_id,
            weapon_name: sw.m_weapons.name,
            icon_url: sw.m_weapons.icon_url,
            display_order: sw.display_order,
          }))
          .sort((a, b) => a.display_order - b.display_order)

        return {
          code: scenario.code,
          stage_id: scenario.stage_id,
          stage_name: scenario.m_stages.name,
          danger_rate: scenario.danger_rate,
          total_golden_eggs: scenario.total_golden_eggs,
          created_at: scenario.created_at,
          author_id: scenario.author_id,
          weapons,
          like_count: likeCounts.get(code) || 0,
        }
      })
      .filter((s): s is TrendingScenario => s !== null)

    return result
  } catch (error) {
    console.error('トレンドシナリオ取得エラー:', error)
    return []
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ tags?: string }>
} = {}) {
  const params = searchParams ? await searchParams : { tags: undefined }
  const tags = params.tags?.split(',').filter(Boolean) || []
  
  const latestScenarios = await getLatestScenarios(6, tags)
  const trendingScenarios = await getTrendingScenarios(6)

  return (
    <div className="bg-gray-900">
      <ScrollRestorer />
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500 py-20 md:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTYwIDBIMFY2MEg2MFYwWiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDBIMjBWMjBIMFYwWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <LogoIcon size={80} className="drop-shadow-lg" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              リザルト画像をアップするだけ
              <br />
              <span className="text-yellow-200">シナリオコードを共有</span>
            </h1>
            <p className="text-xl md:text-2xl text-orange-50 mb-8 leading-relaxed">
              AIが自動で解析して、サーモンランのシナリオコードを生成します
              <br />
              みんなで共有して、最強のシナリオを見つけよう
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/analyze"
                className="group inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 font-bold text-lg rounded-lg shadow-lg hover:bg-yellow-50 transition-all transform hover:scale-105 hover:shadow-xl"
              >
                <Upload className="mr-2 h-5 w-5" />
                AI解析を試す
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/#latest"
                className="inline-flex items-center justify-center px-8 py-4 bg-orange-700/80 text-white font-semibold text-lg rounded-lg shadow-lg hover:bg-orange-700 transition-all border-2 border-white/20"
              >
                <Search className="mr-2 h-5 w-5" />
                最新シナリオを見る
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3ステップガイド */}
      <section className="py-16 md:py-24 bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-100 mb-12">
            使い方は簡単、たった3ステップ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* ステップ1 */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4 mx-auto">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3 text-center">
                スクリーンショットを撮る
              </h3>
              <p className="text-gray-400 text-center">
                サーモンランのリザルト画面のスクリーンショットを撮影します
              </p>
            </div>

            {/* ステップ2 */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4 mx-auto">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3 text-center">
                AIが自動解析
              </h3>
              <p className="text-gray-400 text-center">
                アップロードした画像をAIが解析し、シナリオコードを自動生成します
              </p>
            </div>

            {/* ステップ3 */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4 mx-auto">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3 text-center">
                みんなで共有
              </h3>
              <p className="text-gray-400 text-center">
                生成されたシナリオコードを共有して、他のプレイヤーと情報交換できます
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 今週のトレンド */}
      {trendingScenarios.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-100">
                  今週のトレンド
                </h2>
              </div>
            </div>
            <p className="text-gray-400 mb-6">
              今週いいねが多かったシナリオ
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.code}
                  code={scenario.code}
                  stageName={scenario.stage_name}
                  dangerRate={scenario.danger_rate}
                  totalGoldenEggs={scenario.total_golden_eggs}
                  weapons={scenario.weapons}
                  authorId={scenario.author_id}
                  showTrending={true}
                  trendingCount={scenario.like_count}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* クイックフィルタ */}
      <Suspense fallback={<div className="py-8 bg-gray-900 border-t border-gray-700"><div className="container mx-auto px-4">読み込み中...</div></div>}>
        <HomeFilterSection />
      </Suspense>

      {/* 最新シナリオのプレビュー */}
      <section id="latest" className="py-16 md:py-24 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100">
              最新のシナリオ
            </h2>
            <Link
              href="/scenarios"
              className="inline-flex items-center text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              すべて見る
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {latestScenarios.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">まだシナリオがありません</p>
              <p className="text-gray-500 text-sm mt-2">
                最初のシナリオを投稿してみましょう！
              </p>
              <Link
                href="/analyze"
                className="inline-block mt-4 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
              >
                AI解析を試す
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.code}
                  code={scenario.code}
                  stageName={scenario.stage_name}
                  dangerRate={scenario.danger_rate}
                  totalGoldenEggs={scenario.total_golden_eggs}
                  weapons={scenario.weapons}
                  authorId={scenario.author_id}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
