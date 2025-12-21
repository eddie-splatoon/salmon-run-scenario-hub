import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import TermsPage from '../page'

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

describe('TermsPage', () => {
  it('renders terms heading', () => {
    render(<TermsPage />)
    expect(screen.getByText('利用規約')).toBeInTheDocument()
  })

  it('renders link to home page', () => {
    render(<TermsPage />)
    const link = screen.getByRole('link', { name: /トップに戻る/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders all terms sections', () => {
    render(<TermsPage />)
    
    expect(screen.getByText('1. はじめに')).toBeInTheDocument()
    expect(screen.getByText('2. サービスの内容')).toBeInTheDocument()
    expect(screen.getByText('3. 利用者の義務')).toBeInTheDocument()
    expect(screen.getByText('4. 知的財産権')).toBeInTheDocument()
    expect(screen.getByText('5. 免責事項')).toBeInTheDocument()
    expect(screen.getByText('6. 規約の変更')).toBeInTheDocument()
    expect(screen.getByText('7. お問い合わせ')).toBeInTheDocument()
  })

  it('renders GitHub Issues link', () => {
    render(<TermsPage />)
    const link = screen.getByRole('link', { name: /GitHubのIssues/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://github.com/eddie-splatoon/salmon-run-scenario-hub/issues')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders establishment date', () => {
    render(<TermsPage />)
    expect(screen.getByText(/制定日: 2025年12月20日/)).toBeInTheDocument()
  })

  it('has correct layout structure', () => {
    const { container } = render(<TermsPage />)
    const mainDiv = container.querySelector('div.bg-gray-900')
    expect(mainDiv).toBeInTheDocument()
  })
})

