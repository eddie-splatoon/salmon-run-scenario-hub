import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Salmon Run Scenario Hub')
  })

  it('renders image analyzer component', () => {
    render(<Home />)
    const analyzerHeading = screen.getByRole('heading', { level: 2 })
    expect(analyzerHeading).toHaveTextContent('画像解析')
  })
})

