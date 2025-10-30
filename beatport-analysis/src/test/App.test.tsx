import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('App', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /beatport top 100/i })).toBeInTheDocument()
  })

  it('renders the genre select', () => {
    render(<App />)
    expect(screen.getByLabelText(/genre/i)).toBeInTheDocument()
  })

  it('renders the reload button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
  })

  describe('Loading State', () => {
    it('shows loading message when fetching data', async () => {
      // Mock fetch to never resolve (simulating loading)
      mockFetch.mockImplementation(() => new Promise(() => {}))

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Loading CSV…')).toBeInTheDocument()
      })
    })

    it('disables reload button while loading', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      render(<App />)

      const reloadButton = screen.getByRole('button', { name: /reload/i })
      expect(reloadButton).toBeDisabled()
    })
  })

  describe('Error State', () => {
    it('displays error message when API fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('displays API error status when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('API error: 500 Internal Server Error')).toBeInTheDocument()
      })
    })

    it('displays error when no tracks found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('No tracks found in database')).toBeInTheDocument()
      })
    })
  })

  describe('Success State', () => {
    const mockTracks = [
      {
        artist: 'Artist 1',
        title: 'Track 1',
        rank: 1,
        date: '2024-01-01',
        genre: '140-deep-dubstep-grime' // Match default genre
      },
      {
        artist: 'Artist 2',
        title: 'Track 2',
        rank: 2,
        date: '2024-01-01',
        genre: '140-deep-dubstep-grime' // Match default genre
      }
    ]

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTracks)
      })
    })

    it('displays tracks in table when data loads successfully', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Track 1')).toBeInTheDocument()
        expect(screen.getByText('Track 2')).toBeInTheDocument()
      })

      expect(screen.getByText('Artist 1')).toBeInTheDocument()
      expect(screen.getByText('Artist 2')).toBeInTheDocument()
    })

    it('displays the latest date from loaded data', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Data loaded from database for date: 2024-01-01')).toBeInTheDocument()
      })
    })

    it('shows "No tracks for selected genre" when no tracks match filter', async () => {
      // Mock tracks with different genre
      const differentGenreTracks = [{
        artist: 'Artist 1',
        title: 'Track 1',
        rank: 1,
        date: '2024-01-01',
        genre: 'techno'
      }]

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(differentGenreTracks)
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('No tracks for selected genre.')).toBeInTheDocument()
      })
    })
  })

  describe('Genre Filtering', () => {
    const mockTracks = [
      {
        artist: 'Dubstep Artist',
        title: 'Dubstep Track',
        rank: 1,
        date: '2024-01-01',
        genre: '140-deep-dubstep-grime' // Default genre
      },
      {
        artist: 'Techno Artist',
        title: 'Techno Track',
        rank: 1,
        date: '2024-01-01',
        genre: 'techno-peak-time-driving' // Index 29
      }
    ]

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTracks)
      })
    })

    it('filters tracks by selected genre', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Dubstep Track')).toBeInTheDocument()
      })

      // Change to Techno genre (index 29 in GENRES array)
      const select = screen.getByLabelText(/genre/i)
      await act(async () => {
        fireEvent.change(select, { target: { value: '29' } })
      })

      await waitFor(() => {
        expect(screen.getByText('Techno Track')).toBeInTheDocument()
        expect(screen.queryByText('Dubstep Track')).not.toBeInTheDocument()
      })
    })

    it('sorts tracks by rank within genre', async () => {
      const unsortedTracks = [
        {
          artist: 'Artist 3',
          title: 'Track 3',
          rank: 3,
          date: '2024-01-01',
          genre: '140-deep-dubstep-grime'
        },
        {
          artist: 'Artist 1',
          title: 'Track 1',
          rank: 1,
          date: '2024-01-01',
          genre: '140-deep-dubstep-grime'
        },
        {
          artist: 'Artist 2',
          title: 'Track 2',
          rank: 2,
          date: '2024-01-01',
          genre: '140-deep-dubstep-grime'
        }
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(unsortedTracks)
      })

      render(<App />)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // Skip header row, check order
        expect(rows[1]).toHaveTextContent('Track 1')
        expect(rows[2]).toHaveTextContent('Track 2')
        expect(rows[3]).toHaveTextContent('Track 3')
      })
    })
  })

  describe('User Interactions', () => {
    it('calls loadTracks when reload button is clicked', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      })

      render(<App />)

      const reloadButton = screen.getByRole('button', { name: /reload/i })

      // Wait for initial load
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      // Click reload
      fireEvent.click(reloadButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })

    it('updates selected genre when dropdown changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      })

      render(<App />)

      const select = screen.getByLabelText(/genre/i)
      expect(select).toHaveValue('0')

      await act(async () => {
        fireEvent.change(select, { target: { value: '5' } })
      })

      expect(select).toHaveValue('5')
    })
  })
})