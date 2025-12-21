import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import MastersAdminPage from '../page'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/admin'
import { redirect } from 'next/navigation'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/utils/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('../MastersAdminClient', () => ({
  default: () => <div data-testid="masters-admin-client">Masters Admin Client</div>,
}))

describe('MastersAdminPage', () => {
  const mockUser = {
    id: 'admin1',
    email: 'admin@example.com',
  }

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(isAdmin).mockResolvedValue(true)
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('renders MastersAdminClient when user is authenticated and is admin', async () => {
    const page = await MastersAdminPage()
    render(page)

    expect(screen.getByTestId('masters-admin-client')).toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    await MastersAdminPage()

    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })

  it('redirects to home when user is not admin', async () => {
    vi.mocked(isAdmin).mockResolvedValue(false)

    await MastersAdminPage()

    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('redirects to login when auth error occurs', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    })

    await MastersAdminPage()

    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })
})

