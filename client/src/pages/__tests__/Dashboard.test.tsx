import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '../dashboard'

// Mock the PageLayout component
vi.mock('@/components/navigation/PageLayout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>
}))

// Mock React Query hooks
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn()
  }
})

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

describe('Dashboard Page', () => {
  it('should render dashboard with loading state', () => {
    const { useQuery } = require('@tanstack/react-query')
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    })

    const queryClient = createTestQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    )

    expect(screen.getByTestId('page-layout')).toBeInTheDocument()
    // Should show loading skeletons
    expect(screen.getAllByTestId(/skeleton/i)).length.toBeGreaterThan(0)
  })

  it('should render dashboard with metrics data', () => {
    const { useQuery } = require('@tanstack/react-query')
    const mockMetrics = {
      monthlyRevenue: 13702.93,
      activeOrders: 8,
      completedOrders: 15,
      totalReceivables: 7155.49
    }

    useQuery.mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null
    })

    const queryClient = createTestQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    )

    expect(screen.getByText('$13,702.93')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('$7,155.49')).toBeInTheDocument()
  })

  it('should handle error state gracefully', () => {
    const { useQuery } = require('@tanstack/react-query')
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch metrics')
    })

    const queryClient = createTestQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    )

    expect(screen.getByText(/error loading/i)).toBeInTheDocument()
  })
})