import { describe, it, expect } from 'vitest'
import { getTopRepositories } from './analytics'

function makeRepo(name, overrides = {}) {
  return {
    name,
    pushed_at: new Date().toISOString(),
    stargazers_count: 0,
    forks_count: 0,
    ...overrides,
  }
}

describe('getTopRepositories', () => {
  it('ranks repositories by stars, forks, and recency without double-counting stars from watchers_count', () => {
    const now = Date.now()
    // repoA: 100 stars, 10 forks, pushed now (activity bonus = 0.5 * 365 = 182.5)
    // score = 100 + (10 * 2) + 182.5 = 302.5
    // watchers_count is 100 (duplicate of stars), but should NOT be weighted
    const repoA = makeRepo('repoA', {
      stargazers_count: 100,
      watchers_count: 100,
      forks_count: 10,
      pushed_at: new Date(now).toISOString(),
    })

    // repoB: 50 stars, 80 forks, pushed now
    // score = 50 + (80 * 2) + 182.5 = 392.5
    // Even if repoA had watchers_count = 100, repoB with more forks should rank higher
    const repoB = makeRepo('repoB', {
      stargazers_count: 50,
      watchers_count: 50,
      forks_count: 80,
      pushed_at: new Date(now).toISOString(),
    })

    const top = getTopRepositories([repoA, repoB], 10)
    expect(top).toHaveLength(2)
    expect(top[0].name).toBe('repoB')
    expect(top[1].name).toBe('repoA')
  })

  it('verifies score does not change when watchers_count varies', () => {
    const pushed = new Date().toISOString()
    const repoWithoutWatchers = makeRepo('no-watchers', {
      stargazers_count: 100,
      forks_count: 20,
      pushed_at: pushed,
    })

    const repoWithWatchers = makeRepo('with-watchers', {
      stargazers_count: 100,
      watchers_count: 100,
      forks_count: 20,
      pushed_at: pushed,
    })

    const res1 = getTopRepositories([repoWithoutWatchers], 1)
    const res2 = getTopRepositories([repoWithWatchers], 1)

    expect(res1[0].score).toBeCloseTo(res2[0].score, 5)
  })

  it('respects the limit argument', () => {
    const repos = Array.from({ length: 15 }, (_, i) =>
      makeRepo(`repo-${i}`, { stargazers_count: i })
    )

    const top5 = getTopRepositories(repos, 5)
    expect(top5).toHaveLength(5)
    expect(top5[0].name).toBe('repo-14')

    const defaultTop = getTopRepositories(repos)
    expect(defaultTop).toHaveLength(10)
    expect(defaultTop[0].name).toBe('repo-14')
  })

  it('handles null, undefined, or missing counts gracefully', () => {
    const repoSparse = {
      name: 'sparse-repo',
    }
    const repoComplete = makeRepo('complete-repo', {
      stargazers_count: 10,
      forks_count: 5,
    })

    const result = getTopRepositories([repoSparse, repoComplete], 10)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('complete-repo')
    expect(result[1].name).toBe('sparse-repo')
    expect(result[1].score).toBe(0)
  })

  it('does not mutate the original repository array', () => {
    const repos = [
      makeRepo('repo1', { stargazers_count: 10 }),
      makeRepo('repo2', { stargazers_count: 20 }),
    ]
    const originalCopy = [...repos]

    getTopRepositories(repos, 1)
    expect(repos).toEqual(originalCopy)
  })
})
