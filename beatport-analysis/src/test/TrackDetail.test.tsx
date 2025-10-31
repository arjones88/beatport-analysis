import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import TrackDetail from '../components/TrackDetail'

// Mock useParams
const mockUseParams = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => mockUseParams()
  }
})

// Mock ResizeObserver for chart component
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('TrackDetail', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    mockUseParams.mockReturnValue({
      genre: 'house',
      title: 'test-track',
      artist: 'test-artist'
    })
  })

  it('displays loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <TrackDetail />
      </BrowserRouter>
    )

    expect(screen.getByText('Loading track history...')).toBeInTheDocument()
  })

  it('displays track information when data loads successfully', async () => {
    const mockTrackData = [
      {
        artist: 'Test Artist',
        title: 'Test Track',
        rank: 5,
        date: '2024-01-01',
        genre: 'house'
      },
      {
        artist: 'Test Artist',
        title: 'Test Track',
        rank: 3,
        date: '2024-01-02',
        genre: 'house'
      }
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTrackData)
    })

    render(
      <BrowserRouter>
        <TrackDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Test Track')).toHaveLength(2) // Breadcrumb and main heading
    })

    expect(screen.getByText('Test Artist')).toBeInTheDocument()
    expect(screen.getAllByText('House')).toHaveLength(3) // Breadcrumb, genre display, and statistics
    expect(screen.getByText('Total Appearances:')).toBeInTheDocument()
  })

  it('displays error message when API fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <TrackDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Error Loading Track')).toBeInTheDocument()
    })

    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('displays error message when track does not exist (404)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404
    })

    render(
      <BrowserRouter>
        <TrackDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Error Loading Track')).toBeInTheDocument()
      expect(screen.getByText('Failed to load track history: 404')).toBeInTheDocument()
    })
  })
})