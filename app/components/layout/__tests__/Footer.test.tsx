import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import Footer from '../Footer'

// Next.jsのLinkコンポーネントをモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('Footer', () => {
  it('renders current year in copyright', () => {
    const currentYear = new Date().getFullYear()
    render(<Footer />)
    
    expect(screen.getByText(new RegExp(`© ${currentYear} Salmon Run Scenario Hub`))).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: 'ガイド' })).toHaveAttribute('href', '/guide')
    expect(screen.getByRole('link', { name: '利用規約' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'プライバシーポリシー' })).toHaveAttribute('href', '/privacy')
  })

  it('renders feedback link with correct attributes', () => {
    render(<Footer />)

    const feedbackLink = screen.getByRole('link', { name: 'フィードバック' })
    expect(feedbackLink).toHaveAttribute('href', 'https://github.com/eddie-splatoon/salmon-run-scenario-hub/issues')
    expect(feedbackLink).toHaveAttribute('target', '_blank')
    expect(feedbackLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('has correct CSS classes for styling', () => {
    const { container } = render(<Footer />)
    const footer = container.querySelector('footer')

    expect(footer).toHaveClass('mt-auto', 'border-t', 'border-gray-700', 'bg-gray-900', 'py-8')
  })
})

