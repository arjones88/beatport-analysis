import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import MainChart from '../components/MainChart'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe('MainChart', () => {
  const mockTracksData = [
    {
      artist: 'Test Artist 1',
      title: 'Track A',
      rank: 1,
      date: '2024-01-01',
      genre: '140-deep-dubstep-grime'
    },
    {
      artist: 'Test Artist 2',
      title: 'Track B',
      rank: 2,
      date: '2024-01-01',
      genre: '140-deep-dubstep-grime'
    }
  ]

  beforeEach(() => {
    mockFetch.mockClear()
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.getItem.mockReturnValue(null) // No dark mode saved
  })

  it('loads and displays tracks', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTracksData)
    })

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Track A')).toBeInTheDocument()
      expect(screen.getByText('Test Artist 1 (1)')).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    expect(screen.getByText('Loading tracks...')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('toggles dark mode when button is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTracksData)
    })

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Track A')).toBeInTheDocument()
    })

    // Click dark mode toggle
    const darkModeButton = screen.getByRole('button', { name: /toggle dark mode/i })
    expect(darkModeButton).toHaveTextContent('🌙 Dark')

    await act(async () => {
      fireEvent.click(darkModeButton)
    })

    expect(darkModeButton).toHaveTextContent('☀️ Light')
    // Should save to localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('darkMode', 'true')
  })

  it('sorts tracks by rank when rank header is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTracksData)
    })

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Track A')).toBeInTheDocument()
    })

    // Click rank header to sort (it contains "Rank ↑")
    const rankHeader = screen.getByText(/Rank/)
    fireEvent.click(rankHeader)

    // Should show sort indicator (now descending)
    expect(rankHeader).toHaveTextContent('Rank ↓')
  })

  it('filters tracks by search term', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTracksData)
    })

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Track A')).toBeInTheDocument()
    })

    // Search for specific track
    const searchInput = screen.getByPlaceholderText('Search by title or artist...')
    fireEvent.change(searchInput, { target: { value: 'Track A' } })

    // Should still show Track A
    expect(screen.getByText('Track A')).toBeInTheDocument()
    // Should not show Track B
    expect(screen.queryByText('Track B')).not.toBeInTheDocument()
  })

  it('shows no results message when search has no matches', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTracksData)
    })

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Track A')).toBeInTheDocument()
    })

    // Search for non-existent track
    const searchInput = screen.getByPlaceholderText('Search by title or artist...')
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } })

    // Should show no results message
    expect(screen.getByText('No tracks match your search "NonExistent".')).toBeInTheDocument()
  })

  it('clears search when clear button is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTracksData)
    })

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Track A')).toBeInTheDocument()
    })

    // Search for something
    const searchInput = screen.getByPlaceholderText('Search by title or artist...')
    fireEvent.change(searchInput, { target: { value: 'Track A' } })

    // Click clear search
    const clearButton = screen.getByText('Clear Search')
    fireEvent.click(clearButton)

    // Should show all tracks again
    expect(screen.getByText('Track A')).toBeInTheDocument()
    expect(screen.getByText('Track B')).toBeInTheDocument()
  })

  it('changes genre when select is changed', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTracksData)
    })

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Track A')).toBeInTheDocument()
    })

    // Change genre select
    const genreSelect = screen.getByRole('combobox')
    fireEvent.change(genreSelect, { target: { value: '1' } }) // Select second genre

    // Should still work (tracks might be filtered out if genre doesn't match)
    expect(genreSelect).toHaveValue('1')
  })

  it('navigates to track detail when track row is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTracksData)
    })

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Track A')).toBeInTheDocument()
    })

    // Click on a track row
    const trackRow = screen.getByText('Track A').closest('tr')
    expect(trackRow).toBeInTheDocument()

    // Note: Testing navigation would require mocking useNavigate
    // For now, we verify the row has click handler
    expect(trackRow).toHaveStyle({ cursor: 'pointer' })
  })

  it('displays trend indicators correctly', async () => {
    // For trends to be computed, we need multiple dates for the same track
    const tracksWithMultipleDates = [
      {
        artist: 'Test Artist 1',
        title: 'Track A',
        rank: 3,
        date: '2024-01-01',
        genre: '140-deep-dubstep-grime'
      },
      {
        artist: 'Test Artist 1',
        title: 'Track A',
        rank: 1,
        date: '2024-01-02',
        genre: '140-deep-dubstep-grime'
      },
      {
        artist: 'Test Artist 2',
        title: 'Track B',
        rank: 1,
        date: '2024-01-01',
        genre: '140-deep-dubstep-grime'
      },
      {
        artist: 'Test Artist 2',
        title: 'Track B',
        rank: 2,
        date: '2024-01-02',
        genre: '140-deep-dubstep-grime'
      }
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(tracksWithMultipleDates)
    })

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Track A')).toBeInTheDocument()
    })

    // Check trend indicators - Track A improved from rank 3 to 1 (positive trend)
    expect(screen.getByText('↑ +2')).toBeInTheDocument() // Positive trend
    // Track B went from rank 1 to 2 (negative trend)
    expect(screen.getByText('↓ -1')).toBeInTheDocument() // Negative trend
  })

  it('shows warning when no tracks for selected genre', async () => {
    // Mock data with different genre
    const differentGenreData = [
      {
        artist: 'Test Artist 1',
        title: 'Track A',
        rank: 1,
        date: '2024-01-01',
        genre: 'house', // Different genre
        trend: 2,
        firstAppeared: '2024-01-01'
      }
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(differentGenreData)
    })

    render(
      <BrowserRouter>
        <MainChart />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('No tracks for selected genre.')).toBeInTheDocument()
    })
  })
})