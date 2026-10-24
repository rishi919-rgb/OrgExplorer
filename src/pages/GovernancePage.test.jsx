import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GovernancePage from './GovernancePage'

let mockAppContext = {}

vi.mock('../context/AppContext', () => ({
  useApp: () => mockAppContext,
}))

describe('GovernancePage - Issue Resolution Rate', () => {
  it('excludes pull requests from the issue resolution rate calculation', () => {
    mockAppContext = {
      orgs: [{ login: 'test-org' }],
      model: {
        allRepos: [
          {
            id: 1,
            name: 'test-repo',
            orgLogin: 'test-org',
            stargazers_count: 50,
            forks_count: 10,
            pushed_at: new Date().toISOString(),
          },
        ],
      },
      // In this repository:
      // - 0 closed genuine issues, 2 open genuine issues (resolution rate should be 0%)
      // - 5 closed PRs (with pull_request key)
      // If PRs are mistakenly counted as issues, closed = 5, total = 7 (rate = 71%)
      issuesData: {
        'test-org/test-repo': [
          { id: 101, state: 'open', created_at: new Date().toISOString() },
          { id: 102, state: 'open', created_at: new Date().toISOString() },
          { id: 201, state: 'closed', pull_request: { merged_at: new Date().toISOString() }, created_at: new Date().toISOString() },
          { id: 202, state: 'closed', pull_request: {}, created_at: new Date().toISOString() },
          { id: 203, state: 'closed', pull_request: {}, created_at: new Date().toISOString() },
          { id: 204, state: 'closed', pull_request: {}, created_at: new Date().toISOString() },
          { id: 205, state: 'closed', pull_request: {}, created_at: new Date().toISOString() },
        ],
      },
      runAudit: vi.fn(),
      govLoading: false,
      auditComplete: true,
      loading: false,
      runGovernanceAnalysis: vi.fn(),
      staleRepoStats: [],
    }

    render(<GovernancePage />)

    // The Issue Resolution Rate card should display 0% for test-repo, not 71%
    expect(screen.getByText('Issue Resolution Rate')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.queryByText('71%')).not.toBeInTheDocument()
  })

  it('correctly calculates resolution rate when genuine closed and open issues exist', () => {
    mockAppContext = {
      orgs: [{ login: 'test-org' }],
      model: {
        allRepos: [
          {
            id: 1,
            name: 'test-repo',
            orgLogin: 'test-org',
            stargazers_count: 50,
            forks_count: 10,
            pushed_at: new Date().toISOString(),
          },
        ],
      },
      // 3 closed issues, 1 open issue, and 4 pull requests (which must be ignored)
      // Genuine issue resolution rate = 3 / 4 = 75%
      issuesData: {
        'test-org/test-repo': [
          { id: 101, state: 'closed', created_at: new Date().toISOString() },
          { id: 102, state: 'closed', created_at: new Date().toISOString() },
          { id: 103, state: 'closed', created_at: new Date().toISOString() },
          { id: 104, state: 'open', created_at: new Date().toISOString() },
          { id: 201, state: 'closed', pull_request: {}, created_at: new Date().toISOString() },
          { id: 202, state: 'open', pull_request: {}, created_at: new Date().toISOString() },
        ],
      },
      runAudit: vi.fn(),
      govLoading: false,
      auditComplete: true,
      loading: false,
      runGovernanceAnalysis: vi.fn(),
      staleRepoStats: [],
    }

    render(<GovernancePage />)

    expect(screen.getByText('75%')).toBeInTheDocument()
  })
})
