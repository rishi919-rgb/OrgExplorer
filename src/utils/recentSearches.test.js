import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  RECENT_SEARCHES_KEY,
} from './recentSearches'

describe('recentSearches utility', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('getRecentSearches', () => {
    it('returns empty array when localStorage has no recent searches', () => {
      expect(getRecentSearches()).toEqual([])
    })

    it('returns parsed list of string searches', () => {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['AOSSIE-Org', 'DjedAlliance']))
      expect(getRecentSearches()).toEqual(['AOSSIE-Org', 'DjedAlliance'])
    })

    it('safely handles malformed JSON without throwing (Issue #350)', () => {
      localStorage.setItem(RECENT_SEARCHES_KEY, '{bad json}')
      expect(getRecentSearches()).toEqual([])
    })

    it('returns empty array if stored data is a JSON object instead of an array', () => {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify({ org: 'AOSSIE-Org' }))
      expect(getRecentSearches()).toEqual([])
    })

    it('returns empty array if stored data is a JSON number or boolean', () => {
      localStorage.setItem(RECENT_SEARCHES_KEY, '123')
      expect(getRecentSearches()).toEqual([])

      localStorage.setItem(RECENT_SEARCHES_KEY, 'true')
      expect(getRecentSearches()).toEqual([])
    })

    it('filters out non-string items and empty strings', () => {
      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(['AOSSIE-Org', 123, null, '', '   ', { name: 'foo' }, 'DjedAlliance'])
      )
      expect(getRecentSearches()).toEqual(['AOSSIE-Org', 'DjedAlliance'])
    })

    it('handles localStorage.getItem throwing an exception', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: Access is denied')
      })
      expect(getRecentSearches()).toEqual([])
    })
  })

  describe('saveRecentSearch', () => {
    it('prepends a new search entry and persists to localStorage', () => {
      const result = saveRecentSearch('AOSSIE-Org')
      expect(result).toEqual(['AOSSIE-Org'])
      expect(JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY))).toEqual(['AOSSIE-Org'])
    })

    it('deduplicates case-insensitively and moves the latest casing to front', () => {
      saveRecentSearch('aossie-org')
      const result = saveRecentSearch('AOSSIE-Org')
      expect(result).toEqual(['AOSSIE-Org'])
    })

    it('caps entries to maximum limit (default 6)', () => {
      for (let i = 1; i <= 8; i++) {
        saveRecentSearch(`org-${i}`)
      }
      const saved = getRecentSearches()
      expect(saved.length).toBe(6)
      expect(saved[0]).toBe('org-8')
      expect(saved).toEqual(['org-8', 'org-7', 'org-6', 'org-5', 'org-4', 'org-3'])
    })

    it('recovers cleanly even if existing localStorage data is malformed JSON', () => {
      localStorage.setItem(RECENT_SEARCHES_KEY, '{corrupted-json}')
      const result = saveRecentSearch('AOSSIE-Org')
      expect(result).toEqual(['AOSSIE-Org'])
      expect(getRecentSearches()).toEqual(['AOSSIE-Org'])
    })

    it('ignores empty or non-string inputs', () => {
      saveRecentSearch('AOSSIE-Org')
      expect(saveRecentSearch('')).toEqual(['AOSSIE-Org'])
      expect(saveRecentSearch('   ')).toEqual(['AOSSIE-Org'])
      expect(saveRecentSearch(null)).toEqual(['AOSSIE-Org'])
      expect(saveRecentSearch(undefined)).toEqual(['AOSSIE-Org'])
    })

    it('handles localStorage.setItem quota errors gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const result = saveRecentSearch('AOSSIE-Org')
      expect(result).toEqual(['AOSSIE-Org'])
      expect(warnSpy).toHaveBeenCalled()
    })
  })

  describe('clearRecentSearches', () => {
    it('removes recent searches from localStorage', () => {
      saveRecentSearch('AOSSIE-Org')
      clearRecentSearches()
      expect(localStorage.getItem(RECENT_SEARCHES_KEY)).toBeNull()
      expect(getRecentSearches()).toEqual([])
    })
  })
})
