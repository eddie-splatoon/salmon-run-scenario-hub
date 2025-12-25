import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import PrivacyPage from '../page'

// Next.jsのLinkコンポーネントをモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// lucide-reactのアイコンをモック
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon">ArrowLeft</span>,
}))

describe('PrivacyPage', () => {
  it('renders privacy policy heading', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument()
  })

  it('renders link to home page', () => {
    render(<PrivacyPage />)
    const link = screen.getByRole('link', { name: /トップに戻る/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders all privacy policy sections', () => {
    render(<PrivacyPage />)
    
    expect(screen.getByText('1. はじめに')).toBeInTheDocument()
    expect(screen.getByText('2. 収集する情報')).toBeInTheDocument()
    expect(screen.getByText('3. 情報の利用目的')).toBeInTheDocument()
    expect(screen.getByText('4. 情報の管理')).toBeInTheDocument()
    expect(screen.getByText('5. 第三者への提供')).toBeInTheDocument()
    expect(screen.getByText('6. 広告配信について')).toBeInTheDocument()
    expect(screen.getByText('7. Cookieの使用')).toBeInTheDocument()
    expect(screen.getByText('8. プライバシーポリシーの変更')).toBeInTheDocument()
    expect(screen.getByText('9. お問い合わせ')).toBeInTheDocument()
  })

  it('renders ad delivery section', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('6. 広告配信について')).toBeInTheDocument()
    // テキストが複数の要素に分割されている可能性があるため、より柔軟な検索を使用
    expect(screen.getByText(/第三者広告配信事業者/)).toBeInTheDocument()
    expect(screen.getByText(/広告を配信する場合があります/)).toBeInTheDocument()
  })

  it('renders detailed cookie section', () => {
    render(<PrivacyPage />)
    expect(screen.getByText('7. Cookieの使用')).toBeInTheDocument()
    // 「認証状態の維持」が複数存在するため、getAllByTextを使用
    const authMaintenanceElements = screen.getAllByText(/認証状態の維持/)
    expect(authMaintenanceElements.length).toBeGreaterThan(0)
    expect(screen.getByText(/必須Cookie/)).toBeInTheDocument()
    expect(screen.getByText(/分析Cookie/)).toBeInTheDocument()
    expect(screen.getByText(/広告Cookie/)).toBeInTheDocument()
  })

  it('renders GitHub Issues link', () => {
    render(<PrivacyPage />)
    const link = screen.getByRole('link', { name: /GitHubのIssues/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://github.com/eddie-splatoon/salmon-run-scenario-hub/issues')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders establishment date and last update date', () => {
    render(<PrivacyPage />)
    expect(screen.getByText(/制定日: 2025年12月20日/)).toBeInTheDocument()
    expect(screen.getByText(/最終更新日: 2025年12月23日/)).toBeInTheDocument()
  })

  it('has correct layout structure', () => {
    const { container } = render(<PrivacyPage />)
    const mainDiv = container.querySelector('div.bg-gray-900')
    expect(mainDiv).toBeInTheDocument()
  })
})

