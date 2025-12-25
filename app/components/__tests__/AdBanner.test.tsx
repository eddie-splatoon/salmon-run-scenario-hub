import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdBanner from '../AdBanner'

describe('AdBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders ad banner with default props', () => {
    render(<AdBanner />)
    expect(screen.getByText('広告スペース')).toBeInTheDocument()
    expect(screen.getByText('Ad Space')).toBeInTheDocument()
  })

  it('renders ad banner with custom adId', () => {
    const { container } = render(<AdBanner adId="custom-ad-id" />)
    const adElement = container.querySelector('#custom-ad-id')
    expect(adElement).toBeInTheDocument()
  })

  it('applies responsive size styles by default', () => {
    const { container } = render(<AdBanner />)
    const adElement = container.querySelector('#ad-banner')
    expect(adElement).toHaveClass('w-full', 'h-[250px]', 'md:h-[90px]')
  })

  it('applies rectangle size styles', () => {
    const { container } = render(<AdBanner size="rectangle" />)
    const adElement = container.querySelector('#ad-banner')
    expect(adElement).toHaveClass('w-[300px]', 'h-[250px]')
  })

  it('applies leaderboard size styles', () => {
    const { container } = render(<AdBanner size="leaderboard" />)
    const adElement = container.querySelector('#ad-banner')
    expect(adElement).toHaveClass('w-full', 'max-w-[728px]', 'h-[90px]')
  })

  it('applies skyscraper size styles', () => {
    const { container } = render(<AdBanner size="skyscraper" />)
    const adElement = container.querySelector('#ad-banner')
    expect(adElement).toHaveClass('w-[160px]', 'h-[600px]')
  })

  it('applies custom className', () => {
    const { container } = render(<AdBanner className="custom-class" />)
    const adElement = container.querySelector('#ad-banner')
    expect(adElement).toHaveClass('custom-class')
  })

  it('has correct base classes', () => {
    const { container } = render(<AdBanner />)
    const adElement = container.querySelector('#ad-banner')
    expect(adElement).toHaveClass(
      'flex',
      'items-center',
      'justify-center',
      'bg-gray-800',
      'border',
      'border-gray-700',
      'rounded-lg'
    )
  })
})

