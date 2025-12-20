import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import GuidePage from '../page'

// Next.jsのLinkコンポーネントをモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// lucide-reactのアイコンをモック
vi.mock('lucide-react', () => ({
  Camera: () => <span data-testid="camera-icon">Camera</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  Code: () => <span data-testid="code-icon">Code</span>,
  HelpCircle: () => <span data-testid="help-circle-icon">HelpCircle</span>,
  Smartphone: () => <span data-testid="smartphone-icon">Smartphone</span>,
  Shield: () => <span data-testid="shield-icon">Shield</span>,
  AlertCircle: () => <span data-testid="alert-circle-icon">AlertCircle</span>,
  CheckCircle2: () => <span data-testid="check-circle-icon">CheckCircle2</span>,
  ArrowRight: () => <span data-testid="arrow-right-icon">ArrowRight</span>,
  Image: () => <span data-testid="image-icon">Image</span>,
}))

describe('GuidePage', () => {
  it('renders the main heading', () => {
    render(<GuidePage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('ユーザーガイド')
  })

  it('renders quick start section', () => {
    render(<GuidePage />)
    const quickStartHeading = screen.getByText('クイックスタート')
    expect(quickStartHeading).toBeInTheDocument()
  })

  it('renders code usage section', () => {
    render(<GuidePage />)
    const codeUsageHeading = screen.getByText('コードの使い方')
    expect(codeUsageHeading).toBeInTheDocument()
  })

  it('renders FAQ section', () => {
    render(<GuidePage />)
    const faqHeading = screen.getByText('よくある質問（FAQ）')
    expect(faqHeading).toBeInTheDocument()
  })

  it('renders all FAQ items', () => {
    render(<GuidePage />)
    const faqItems = [
      'AI解析でエラーが出る場合はどうすればいいですか？',
      'どのデバイスから利用できますか？',
      'どのような画像をアップロードすればいいですか？',
      'プライバシーについて教えてください',
      '解析結果が正しくない場合はどうすればいいですか？',
    ]
    faqItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })

  it('renders link to analyze page', () => {
    render(<GuidePage />)
    const analyzeLink = screen.getByRole('link', { name: /AI解析を試す/i })
    expect(analyzeLink).toHaveAttribute('href', '/analyze')
  })

  it('renders link to home page', () => {
    render(<GuidePage />)
    const homeLink = screen.getByRole('link', { name: /トップページに戻る/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders all step numbers in quick start', () => {
    render(<GuidePage />)
    const step1 = screen.getByText('1')
    const step2 = screen.getByText('2')
    const step3 = screen.getByText('3')
    expect(step1).toBeInTheDocument()
    expect(step2).toBeInTheDocument()
    expect(step3).toBeInTheDocument()
  })

  it('renders step titles in quick start', () => {
    render(<GuidePage />)
    expect(screen.getByText('スクリーンショットを撮る')).toBeInTheDocument()
    expect(screen.getByText('画像をアップロード')).toBeInTheDocument()
    expect(screen.getByText('AIが自動解析')).toBeInTheDocument()
  })
})

