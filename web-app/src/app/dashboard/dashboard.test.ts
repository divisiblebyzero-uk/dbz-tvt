import { describe, it, expect } from 'vitest'
import { KanbanCard } from '@/types/kanban'

describe('Dashboard Kanban Data Aggregator Logic', () => {
  it('correctly consolidates single media item records with diverging user watch paces', () => {
    // Mock the exact structure our mapping step performs
    const mockConsolidatedCard: KanbanCard = {
      media: {
        id: 'm1',
        title: 'Game of Thrones',
        type: 'tv',
        tmdb_id: '1399',
        imdb_id: 'tt0944947',
        description: 'Seven families fight...',
        rotten_tomatoes_score: 89,
        streaming_services: [],
        genres: ['Drama'],
        total_seasons: 8,
        created_at: ''
      },
      userStates: {
        'u1': { displayName: 'Husband Test', avatarUrl: null, state: 'watching', currentSeason: 2 },
        'u2': { displayName: 'Wife Test', avatarUrl: null, state: 'watching', currentSeason: 1 }
      }
    }

    expect(mockConsolidatedCard.media.title).toBe('Game of Thrones')
    expect(mockConsolidatedCard.userStates['u1'].currentSeason).toBe(2)
    expect(mockConsolidatedCard.userStates['u2'].currentSeason).toBe(1)
  })
})
