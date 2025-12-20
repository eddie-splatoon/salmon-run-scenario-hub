import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://salmon-run-scenario-hub.vercel.app'

  const supabase = await createClient()

  // すべてのシナリオコードを取得
  const { data: scenarios, error } = await supabase
    .from('scenarios')
    .select('code, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Sitemap生成エラー:', error)
    // エラーが発生した場合でも、基本的なページは返す
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/analyze`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/guide`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
    ]
  }

  // 基本ページ
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/analyze`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // シナリオ詳細ページを追加
  if (scenarios && Array.isArray(scenarios)) {
    type ScenarioWithCode = {
      code: string
      updated_at: string | null
    }
    for (const scenario of scenarios) {
      const typedScenario = scenario as ScenarioWithCode
      routes.push({
        url: `${baseUrl}/scenarios/${typedScenario.code}`,
        lastModified: typedScenario.updated_at
          ? new Date(typedScenario.updated_at)
          : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  }

  return routes
}

