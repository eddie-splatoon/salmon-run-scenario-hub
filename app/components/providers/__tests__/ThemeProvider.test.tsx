import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ThemeProvider from '../ThemeProvider'

// MUIのThemeProviderをモック
vi.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mui-theme-provider">{children}</div>
  ),
  createTheme: vi.fn(() => ({
    palette: {
      mode: 'dark',
      primary: {
        main: '#f97316',
      },
    },
  })),
}))

describe('ThemeProvider', () => {
  it('renders children correctly', () => {
    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders MUI ThemeProvider', () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('mui-theme-provider')).toBeInTheDocument()
  })

  it('wraps children in theme provider', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})

