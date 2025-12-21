import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import LogoIcon from '../LogoIcon'

// Next.jsのImageコンポーネントをモック
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, className, priority }: {
    src: string
    alt: string
    width: number
    height: number
    className?: string
    priority?: boolean
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-priority={priority}
    />
  ),
}))

describe('LogoIcon', () => {
  it('renders logo with default size', () => {
    const { container } = render(<LogoIcon />)
    const img = container.querySelector('img')

    expect(img).toHaveAttribute('src', '/logo.png')
    expect(img).toHaveAttribute('alt', 'Salmon Run Scenario Hub')
    expect(img).toHaveAttribute('width', '32')
    expect(img).toHaveAttribute('height', '32')
    expect(img).toHaveAttribute('data-priority', 'true')
  })

  it('renders logo with custom size', () => {
    const { container } = render(<LogoIcon size={64} />)
    const img = container.querySelector('img')

    expect(img).toHaveAttribute('width', '64')
    expect(img).toHaveAttribute('height', '64')
  })

  it('applies custom className', () => {
    const { container } = render(<LogoIcon className="custom-class" />)
    const img = container.querySelector('img')

    expect(img).toHaveClass('custom-class')
  })

  it('always has priority attribute', () => {
    const { container } = render(<LogoIcon />)
    const img = container.querySelector('img')

    expect(img).toHaveAttribute('data-priority', 'true')
  })
})

