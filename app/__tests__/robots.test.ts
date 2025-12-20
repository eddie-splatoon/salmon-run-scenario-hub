import { describe, it, expect } from 'vitest'
import robots from '../robots'

describe('Robots', () => {
  it('robots.txtの設定を返す', () => {
    const result = robots()

    expect(result.rules).toHaveLength(1)
    expect(result.rules[0].userAgent).toBe('*')
    expect(result.rules[0].allow).toBe('/')
    expect(result.rules[0].disallow).toEqual(['/api/', '/admin/'])
    expect(result.sitemap).toContain('/sitemap.xml')
  })
})

