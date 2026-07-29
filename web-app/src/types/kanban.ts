import { Database } from './supabase'

// Pull properties natively from your database-generated types file
type MediaItem = Database['public']['Tables']['media_items']['Row']
type KanbanState = Database['public']['Enums']['kanban_state']

export interface KanbanCard {
  media: MediaItem
  // Tracks progression states indexed by the profile id keys
  userStates: {
    [profileId: string]: {
      displayName: string
      avatarUrl: string | null
      state: KanbanState
      currentSeason: number
    }
  }
}

export type KanbanBoardData = {
  [lane in KanbanState]: KanbanCard[]
}
