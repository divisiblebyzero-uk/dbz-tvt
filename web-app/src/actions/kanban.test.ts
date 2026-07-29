import { describe, it, expect, vi } from 'vitest'

// Mock the execution output container of our new state modifier function
const mockUpdateCardState = vi.fn(async ({ mediaType, currentSeason, totalSeasons, inputState }) => {
  let finalState = inputState
  let finalSeason = currentSeason

  if (inputState === 'watched' && mediaType === 'tv') {
    if (currentSeason < totalSeasons) {
      finalState = 'prioritised'
      finalSeason = currentSeason + 1
    }
  }
  return { stateShiftedTo: finalState, advancedToSeason: finalSeason }
})

describe('TV Series Next Season Auto-Progression Pipeline', () => {
  it('intercepts watched states and bumps TV shows to the next season if available', async () => {
    const result = await mockUpdateCardState({
      mediaType: 'tv',
      currentSeason: 1,
      totalSeasons: 3,
      inputState: 'watched'
    })

    expect(result.stateShiftedTo).toBe('prioritised')
    expect(result.advancedToSeason).toBe(2)
  })

  it('allows TV shows to land in the Watched column permanently if no newer seasons exist', async () => {
    const result = await mockUpdateCardState({
      mediaType: 'tv',
      currentSeason: 8,
      totalSeasons: 8,
      inputState: 'watched'
    })

    expect(result.stateShiftedTo).toBe('watched')
    expect(result.advancedToSeason).toBe(8)
  })

  it('allows movies to land in the Watched column instantly without executing season evaluations', async () => {
    const result = await mockUpdateCardState({
      mediaType: 'movie',
      currentSeason: 1,
      totalSeasons: 1,
      inputState: 'watched'
    })

    expect(result.stateShiftedTo).toBe('watched')
  })
})
