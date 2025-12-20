import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../Accordion'

// lucide-reactのChevronDownをモック
vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down-icon">ChevronDown</span>,
}))

// Radix UIのAccordionプリミティブをモック
vi.mock('@radix-ui/react-accordion', () => ({
  Root: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="accordion-root" {...props}>
      {children}
    </div>
  ),
  Item: React.forwardRef(
    ({ children, ...props }: { children: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => (
      <div ref={ref} data-testid="accordion-item" {...props}>
        {children}
      </div>
    )
  ),
  Header: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="accordion-header" {...props}>
      {children}
    </div>
  ),
  Trigger: React.forwardRef(
    ({ children, ...props }: { children: React.ReactNode }, ref: React.Ref<HTMLButtonElement>) => (
      <button ref={ref} data-testid="accordion-trigger" {...props}>
        {children}
      </button>
    )
  ),
  Content: React.forwardRef(
    ({ children, ...props }: { children: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => (
      <div ref={ref} data-testid="accordion-content" {...props}>
        {children}
      </div>
    )
  ),
}))

describe('Accordion', () => {
  it('renders Accordion component', () => {
    render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    expect(screen.getByTestId('accordion-root')).toBeInTheDocument()
    expect(screen.getByTestId('accordion-item')).toBeInTheDocument()
    expect(screen.getByTestId('accordion-trigger')).toBeInTheDocument()
    expect(screen.getByTestId('accordion-content')).toBeInTheDocument()
  })

  it('renders AccordionTrigger with ChevronDown icon', () => {
    render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Test Trigger</AccordionTrigger>
          <AccordionContent>Test Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    expect(screen.getByText('Test Trigger')).toBeInTheDocument()
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument()
  })

  it('renders AccordionContent with children', () => {
    render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Test Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})

