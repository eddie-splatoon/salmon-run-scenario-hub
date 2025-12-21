import { describe, it, expect } from 'vitest'
import { cn } from '../cn'

describe('cn', () => {
  it('should merge class names correctly', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const condition = false
    const result = cn('foo', condition && 'bar', 'baz')
    expect(result).toBe('foo baz')
  })

  it('should merge Tailwind classes and override conflicts', () => {
    const result = cn('p-4', 'p-8')
    // tailwind-merge should override p-4 with p-8
    expect(result).toBe('p-8')
  })

  it('should handle empty strings', () => {
    const result = cn('foo', '', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('should handle objects', () => {
    const result = cn({ foo: true, bar: false, baz: true })
    expect(result).toBe('foo baz')
  })

  it('should handle complex combinations', () => {
    const shouldExclude = false
    const result = cn(
      'base-class',
      { 'conditional-class': true },
      shouldExclude && 'excluded-class',
      ['array-class-1', 'array-class-2'],
      'final-class'
    )
    expect(result).toContain('base-class')
    expect(result).toContain('conditional-class')
    expect(result).not.toContain('excluded-class')
    expect(result).toContain('array-class-1')
    expect(result).toContain('array-class-2')
    expect(result).toContain('final-class')
  })
})

