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

// Accordionコンポーネントをモック
vi.mock('../components/ui/Accordion', () => ({
  Accordion: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="accordion" {...props}>
      {children}
    </div>
  ),
  AccordionItem: ({ children, value, ...props }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`accordion-item-${value}`} {...props}>
      {children}
    </div>
  ),
  AccordionTrigger: ({ children, ...props }: { children: React.ReactNode }) => (
    <button data-testid="accordion-trigger" {...props}>
      {children}
    </button>
  ),
  AccordionContent: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="accordion-content" {...props}>
      {children}
    </div>
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
  ChevronDown: () => <span data-testid="chevron-down-icon">ChevronDown</span>,
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
    // ステップ番号は複数箇所に存在する可能性があるため、getAllByTextを使用
    const step1s = screen.getAllByText('1')
    const step2s = screen.getAllByText('2')
    const step3s = screen.getAllByText('3')
    expect(step1s.length).toBeGreaterThan(0)
    expect(step2s.length).toBeGreaterThan(0)
    expect(step3s.length).toBeGreaterThan(0)
  })

  it('renders step titles in quick start', () => {
    render(<GuidePage />)
    expect(screen.getByText('スクリーンショットを撮る')).toBeInTheDocument()
    expect(screen.getByText('画像をアップロード')).toBeInTheDocument()
    expect(screen.getByText('AIが自動解析')).toBeInTheDocument()
  })
})

