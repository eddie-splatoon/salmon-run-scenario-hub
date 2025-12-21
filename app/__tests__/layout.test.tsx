import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import RootLayout from '../layout'

// Next.jsのLinkコンポーネントをモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// HeaderとFooterコンポーネントをモック
vi.mock('../components/layout/Header', () => ({
  default: () => <header data-testid="header">Header</header>,
}))

vi.mock('../components/layout/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}))

// ThemeProviderをモック
vi.mock('../components/providers/ThemeProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}))

// sonnerのToasterをモック
vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}))

describe('RootLayout', () => {
  it('renders children correctly', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders Header component', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('renders Footer component', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders ThemeProvider', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
  })

  it('renders Toaster component', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('has correct HTML structure with lang="ja"', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    const htmlElement = container.querySelector('html')
    expect(htmlElement).toHaveAttribute('lang', 'ja')
    expect(container).toBeDefined()
  })

  it('applies correct CSS classes to body', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    const bodyElement = container.querySelector('body')
    expect(bodyElement).toHaveClass('flex', 'min-h-screen', 'flex-col', 'bg-gray-900', 'text-gray-100')
  })

  it('wraps children in main element', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="child">Test</div>
      </RootLayout>
    )

    const mainElement = container.querySelector('main')
    expect(mainElement).toBeInTheDocument()
    expect(mainElement).toHaveClass('flex-1')
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})

