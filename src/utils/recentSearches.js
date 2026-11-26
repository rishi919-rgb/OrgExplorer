export const RECENT_SEARCHES_KEY = 'oe_recent'
export const MAX_RECENT_SEARCHES = 6

/**
 * Safely parses and returns stored recent searches.
 * Guarantees a string array output, returning [] if storage is inaccessible,
 * malformed, or holds non-array data.
 *
 * @returns {string[]}
 */
export function getRecentSearches() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(item => typeof item === 'string' && item.trim().length > 0)
  } catch {
    return []
  }
}

/**
 * Safely saves a new search entry to recent searches.
 * Prepends the entry, deduplicates case-insensitively, caps at maxEntries,
 * and handles any storage errors gracefully.
 *
 * @param {string} entry
 * @param {number} [maxEntries=MAX_RECENT_SEARCHES]
 * @returns {string[]}
 */
export function saveRecentSearch(entry, maxEntries = MAX_RECENT_SEARCHES) {
  if (typeof entry !== 'string' || !entry.trim()) {
    return getRecentSearches()
  }

  const trimmed = entry.trim()
  const entryKey = trimmed.toLowerCase()
  const prev = getRecentSearches()
  const next = [trimmed, ...prev.filter(r => r.toLowerCase() !== entryKey)].slice(0, maxEntries)

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
    }
  } catch (err) {
    console.warn('Failed to save recent search to localStorage:', err)
  }

  return next
}

/**
 * Safely clears recent searches from storage.
 */
export function clearRecentSearches() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    }
  } catch {
    // Ignore storage clear errors
  }
}
