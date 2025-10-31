import { render, screen, waitFor, act } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from '../App'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('App', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('renders the main heading', async () => {
    await act(async () => {
      render(<BrowserRouter><App /></BrowserRouter>)
    })
    expect(screen.getByRole('heading', { name: /beatport top 100/i })).toBeInTheDocument()
  })

  it('renders the genre select', async () => {
    await act(async () => {
      render(<BrowserRouter><App /></BrowserRouter>)
    })
    expect(screen.getByLabelText(/genre/i)).toBeInTheDocument()
  })

  it('renders the reload button', async () => {
    await act(async () => {
      render(<BrowserRouter><App /></BrowserRouter>)
    })
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
  })

  it('renders track detail page for track routes', async () => {
    // Mock the track detail API
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{
        artist: 'Test Artist',
        title: 'Test Track',
        rank: 1,
        date: '2024-01-01',
        genre: 'house'
      }])
    })

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/track/house/test-track/test-artist']}>
          <App />
        </MemoryRouter>
      )
    })

    // Should render track detail page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Track' })).toBeInTheDocument()
    })
  })
})