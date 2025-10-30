import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
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
})