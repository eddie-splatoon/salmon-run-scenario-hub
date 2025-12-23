import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import AnalyzePage from '../page'

// ImageAnalyzerコンポーネントをモック
vi.mock('../../components/ImageAnalyzer', () => ({
  default: () => <div data-testid="image-analyzer">ImageAnalyzer</div>,
}))

// Next.jsのLinkコンポーネントをモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('AnalyzePage', () => {
  it('renders page heading', () => {
    render(<AnalyzePage />)
    expect(screen.getByText('Salmon Run Scenario Hub')).toBeInTheDocument()
  })

  it('renders ImageAnalyzer component', () => {
    render(<AnalyzePage />)
    expect(screen.getByTestId('image-analyzer')).toBeInTheDocument()
  })

  it('renders link to scenarios list', () => {
    render(<AnalyzePage />)
    const link = screen.getByRole('link', { name: /一覧へ/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/scenarios')
  })

  it('has correct layout structure', () => {
    const { container } = render(<AnalyzePage />)
    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
    expect(main).toHaveClass('flex', 'min-h-screen', 'flex-col', 'items-center', 'justify-center')
    // レスポンシブパディングクラスを確認
    expect(main).toHaveClass('px-4', 'py-8')
  })
})

