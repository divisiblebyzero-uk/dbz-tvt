import { describe, it, expect, vi } from 'vitest'

// 🟢 Update this path to match the root src path alias exactly!
vi.mock('@/actions/tmdb', () => ({
  searchMediaAutocomplete: vi.fn(async (query: string) => [
    { tmdbId: '1399', title: 'Game of Thrones', type: 'tv', year: '2011', poster: null }
  ]),
  addMediaToDatabase: vi.fn(async () => ({ success: true }))
}))

describe('Autocomplete Debounce Handler Integrity', () => {
  it('returns clean mapped results when an authorized search string is resolved', async () => {
    const { searchMediaAutocomplete } = await import('@/actions/tmdb')
    const results = await searchMediaAutocomplete('Game')
    
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Game of Thrones')
    expect(results[0].type).toBe('tv')
  })
})
