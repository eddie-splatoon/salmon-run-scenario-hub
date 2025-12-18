import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Salmon Run Scenario Hub')
  })

  it('renders welcome message', () => {
    render(<Home />)
    const welcomeText = screen.getByText(/Welcome to the Salmon Run Scenario Hub/i)
    expect(welcomeText).toBeInTheDocument()
  })
})

