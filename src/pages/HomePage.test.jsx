import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'
import { AppProvider } from '../context/AppContext'
import { RECENT_SEARCHES_KEY } from '../utils/recentSearches'

vi.mock('../services/cache', () => ({
  loadAnalysis: vi.fn().mockResolvedValue(null),
  saveAnalysis: vi.fn().mockResolvedValue(true),
}))

vi.mock('../services/github', () => ({
  fetchOrg: vi.fn(),
  fetchRepos: vi.fn(),
  fetchContributors: vi.fn(),
  fetchIssues: vi.fn(),
  fetchRateLimit: vi.fn(),
  fetchPulls: vi.fn(),
}))

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppProvider>
        <HomePage />
      </AppProvider>
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders HomePage search bar and quick explore buttons', () => {
    renderHomePage()

    expect(screen.getByPlaceholderText(/AOSSIE-Org, StabilityNexus/i)).toBeInTheDocument()
    expect(screen.getByText('Quick explore')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'AOSSIE-Org' })).toBeInTheDocument()
    expect(screen.queryByText('Recent searches')).not.toBeInTheDocument()
  })

  it('renders recent searches when valid data exists in localStorage', () => {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['AOSSIE-Org', 'DjedAlliance']))
    renderHomePage()

    expect(screen.getByText('Recent searches')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'AOSSIE-Org' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'DjedAlliance' }).length).toBeGreaterThan(0)
  })

  it('does not crash when localStorage contains malformed JSON (Issue #350)', () => {
    localStorage.setItem(RECENT_SEARCHES_KEY, '{bad json}')

    renderHomePage()

    expect(screen.getByPlaceholderText(/AOSSIE-Org, StabilityNexus/i)).toBeInTheDocument()
    expect(screen.getByText('Quick explore')).toBeInTheDocument()
    expect(screen.queryByText('Recent searches')).not.toBeInTheDocument()
  })

  it('does not crash when localStorage contains a JSON object instead of an array', () => {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify({ org: 'AOSSIE-Org' }))

    renderHomePage()

    expect(screen.getByPlaceholderText(/AOSSIE-Org, StabilityNexus/i)).toBeInTheDocument()
    expect(screen.queryByText('Recent searches')).not.toBeInTheDocument()
  })

  it('does not crash when localStorage contains primitive non-array JSON', () => {
    localStorage.setItem(RECENT_SEARCHES_KEY, '123')

    renderHomePage()

    expect(screen.getByPlaceholderText(/AOSSIE-Org, StabilityNexus/i)).toBeInTheDocument()
    expect(screen.queryByText('Recent searches')).not.toBeInTheDocument()
  })
})
