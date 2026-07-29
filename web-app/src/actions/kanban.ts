'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'

type KanbanState = Database['public']['Enums']['kanban_state']

export async function updateCardState({
  profileId,
  mediaItemId,
  newState
}: {
  profileId: string
  mediaItemId: string
  newState: KanbanState
}) {
  const supabase = await createClient()

  try {
    // 1. Fetch the media metadata along with the user's current progress tracking metrics
    const { data: currentProgress } = await supabase
      .from('user_media_states')
      .select('current_season, media_items(type, total_seasons)')
      .eq('profile_id', profileId)
      .eq('media_item_id', mediaItemId)
      .single()

    if (!currentProgress) throw new Error('Progress record tracking node missing')

    const mediaItem = currentProgress.media_items as any
    let targetState = newState
    let targetSeason = currentProgress.current_season

    // 2. Execute Smart TV Season Progression Validation Trigger Logic
    if (newState === 'watched' && mediaItem?.type === 'tv') {
      const currentSeason = currentProgress.current_season
      const totalSeasonsAvailable = mediaItem.total_seasons

      // If a newer season exists upstream, intercept the watched state and advance them
      if (currentSeason < totalSeasonsAvailable) {
        targetState = 'prioritised' // Bounce the card back to Next Up/Prioritised lane
        targetSeason = currentSeason + 1 // Advance tracked progress by 1 season
      }
    }

    // 3. Save the final processed transition updates back to PostgreSQL
    await supabase
      .from('user_media_states')
      .update({
        state: targetState,
        current_season: targetSeason,
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', profileId)
      .eq('media_item_id', mediaItemId)

    return { success: true, stateShiftedTo: targetState, advancedToSeason: targetSeason }
  } catch (error) {
    console.error('Failed to process card state transition updates:', error)
    return { success: false }
  }
}
