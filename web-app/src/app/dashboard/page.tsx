import { createClient } from '@/lib/supabase/server'
import AddMediaInput from '@/components/kanban/AddMediaInput'
import KanbanLaneUI from '@/components/kanban/KanbanLaneUI'
import MediaRowCard from '@/components/kanban/MediaRowCard'
import { UIKanbanBoard, UIKanbanCard, KanbanState } from '@/types/kanban'
import { updateCardState } from '@/actions/kanban'
import { revalidatePath } from 'next/cache'

interface PageProps {
  searchParams: { view?: 'both' | 'husband' | 'wife' }
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: 'both' | 'husband' | 'wife' }> }) {
  
  // 🟢 2. Explicitly unwrap and await the parameters before accessing properties
  const resolvedParams = await searchParams
  const currentView = resolvedParams.view || 'both'
  const supabase = await createClient()

  // 1. Fetch live metrics from Supabase database layers
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*')
  const { data: mediaItems, error: mediaItemsError } = await supabase.from('media_items').select('*')
  const { data: userStates, error: userStatesError } = await supabase.from('user_media_states').select('*')

  const board: UIKanbanBoard = {
    not_available: [],
    long_list: [],
    short_list: [],
    watching: [],
    watched: []
  }

  if (!profiles || !mediaItems) return null

  const husbandProfile = profiles.find(p => p.display_name.toLowerCase().includes('husband')) || profiles[0]
  const wifeProfile = profiles.find(p => p.display_name.toLowerCase().includes('wife')) || profiles[1] || profiles[0]

  // 2. 🟢 THE COLLAPSING & SPLITTING TRANSFORMER MATRIX ENGINE
  // 2. 🟢 FIXED RESILIENT COLLAPSING & SPLITTING TRANSFORMER MATRIX ENGINE
  mediaItems.forEach((media) => {
    const providers = (media.streaming_services as any[]) || []
    
    // Rule A: Drive items with no subscription services into "Not Available" instantly
    if (providers.length === 0) {
      board.not_available.push({
        uniqueUiKey: `media-${media.id}-na`,
        media,
        displayTags: ['Both'],
        trackingProfileId: 'collapsed',
        currentSeason: 1
      })
      return
    }

    // Isolate individual row states safely (falling back to undefined gracefully)
    const hState = userStates?.find(s => s.media_item_id === media.id && s.profile_id === husbandProfile?.id)
    const wState = userStates?.find(s => s.media_item_id === media.id && s.profile_id === wifeProfile?.id)

    // Execute sorting actions based on top bar filter choices
    if (currentView === 'husband') {
      if (!hState) return // Skip item if Husband has no logged interest
      board[hState.state as KanbanState].push({
        uniqueUiKey: `media-${media.id}-h`,
        media,
        displayTags: ['Husband'],
        trackingProfileId: hState.profile_id,
        currentSeason: hState.current_season
      })
    } 
    else if (currentView === 'wife') {
      if (!wState) return // Skip item if Wife has no logged interest
      board[wState.state as KanbanState].push({
        uniqueUiKey: `media-${media.id}-w`,
        media,
        displayTags: ['Wife'],
        trackingProfileId: wState.profile_id,
        currentSeason: wState.current_season
      })
    } 
    else {
      // ═► VIEW FILTER = "BOTH" (Stitch's dynamic collaborative fallback logic)
      
      // Check for structural baseline status states explicitly
      const hasHusbandInterest = !!hState;
      const hasWifeInterest = !!wState;

      if (!hasHusbandInterest && !hasWifeInterest) {
        // 🟢 Robust Fallback: Item has providers but NO user tracking states yet.
        // Drops onto the Long List column as an open shared baseline tracking element.
        board.long_list.push({
          uniqueUiKey: `media-${media.id}-unassigned`,
          media,
          displayTags: ['Both'],
          trackingProfileId: 'collapsed',
          currentSeason: 1
        })
      } 
      else if (hasHusbandInterest && hasWifeInterest) {
        if (hState.state === wState.state) {
          // Condition 1: Convergent matching status lanes -> COLLAPSE into single row card
          board[hState.state as KanbanState].push({
            uniqueUiKey: `media-${media.id}-both`,
            media,
            displayTags: ['Both'],
            trackingProfileId: 'collapsed',
            currentSeason: Math.max(hState.current_season, wState.current_season)
          })
        } else {
          // Condition 2: Divergent states -> SPLIT into distinct structural columns concurrently
          board[hState.state as KanbanState].push({
            uniqueUiKey: `media-${media.id}-split-h`,
            media,
            displayTags: ['Husband'],
            trackingProfileId: hState.profile_id,
            currentSeason: hState.current_season
          })
          board[wState.state as KanbanState].push({
            uniqueUiKey: `media-${media.id}-split-w`,
            media,
            displayTags: ['Wife'],
            trackingProfileId: wState.profile_id,
            currentSeason: wState.current_season
          })
        }
      } 
      else if (hasHusbandInterest && !hasWifeInterest) {
        // Single user interest only (Husband)
        board[hState.state as KanbanState].push({
          uniqueUiKey: `media-${media.id}-h-only`,
          media,
          displayTags: ['Husband'],
          trackingProfileId: hState.profile_id,
          currentSeason: hState.current_season
        })
      } 
      else if (!hasHusbandInterest && hasWifeInterest) {
        // Single user interest only (Wife)
        board[wState.state as KanbanState].push({
          uniqueUiKey: `media-${media.id}-w-only`,
          media,
          displayTags: ['Wife'],
          trackingProfileId: wState.profile_id,
          currentSeason: wState.current_season
        })
      }
    }
  })

  // Handle column switcher mutations
  async function handleShiftColumn(formData: FormData) {
    'use server'
    const profileId = formData.get('profileId') as string
    const mediaItemId = formData.get('mediaItemId') as string
    const targetState = formData.get('targetState') as any

    // If an item was unassigned/collapsed, perform updates across default profile IDs safely
    if (profileId === 'collapsed') {
      if (husbandProfile) await updateCardState({ profileId: husbandProfile.id, mediaItemId, newState: targetState })
      if (wifeProfile) await updateCardState({ profileId: wifeProfile.id, mediaItemId, newState: targetState })
    } else {
      await updateCardState({ profileId, mediaItemId, newState: targetState })
    }
    revalidatePath('/dashboard')
  }

  const laneOrder: KanbanState[] = ['not_available', 'long_list', 'short_list', 'watching', 'watched']
  const laneTitles: { [key in KanbanState]: string } = {
    not_available: '🍿 Not Available',
    long_list: '📋 Long List',
    short_list: '🔥 Shortlist',
    watching: '📺 Watching',
    watched: '✅ Watched'
  }
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      
      {/* Sidebar Console Link Rows */}
      <aside style={{ width: '240px', flexShrink: 0, backgroundColor: '#f1f5f9', borderRight: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '0.05em', color: '#046a38', textTransform: 'uppercase', margin: 0 }}>Media Command</h2>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', margin: '4px 0 0 0', fontWeight: 'bold' }}>V2.4.8 HIGH-DENSITY</p>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid rgba(226,232,240,0.5)', color: '#046a38' }}>📁 Library</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>⊞ Collections</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>📊 Analytics</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>📥 Import</span>
          </nav>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button style={{ width: '100%', backgroundColor: '#046a38', color: '#ffffff', fontWeight: '900', fontSize: '11px', padding: '10px 16px', borderRadius: '8px', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
            Add New Media
          </button>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', paddingLeft: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ margin: 0, cursor: 'pointer' }}>📄 Docs</p>
            <p style={{ margin: 0, cursor: 'pointer' }}>🛟 Help</p>
          </div>
        </div>
      </aside>

      {/* Workspace Area Frame Grid */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', padding: '24px', gap: '16px' }}>
        <header style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>

          <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.025em', color: '#0f172a', margin: 0 }}>Media Suite</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '512px', justifyContent: 'end' }}>
            <div style={{ width: '100%', maxWidth: '384px' }}>
              <AddMediaInput />
            </div>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(241,245,249,0.8)', border: '1px solid #e2e8f0', padding: '4px', borderRadius: '8px' }}>
              {profiles.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#ffffff', border: '1px solid rgba(226,232,240,0.5)', padding: '4px 10px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '9999px', backgroundColor: '#10b981' }} />
                  {p.display_name.replace(' Test', '')}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* 3. 5-Column Compact Grid Board Workspace Matrix */}
        <div className="kanban-board-grid">
          {laneOrder.map((laneKey) => (
            <KanbanLaneUI
              key={laneKey}
              laneKey={laneKey}
              title={laneTitles[laneKey]}
              cardCount={board[laneKey].length}
              // 🟢 Safe dynamic Server Action bridge function passed securely to client
              onCardDropped={async (mediaItemId, profileId, targetState) => {
                'use server'
                const mockForm = new FormData()
                mockForm.append('mediaItemId', mediaItemId)
                mockForm.append('profileId', profileId)
                mockForm.append('targetState', targetState)
                await handleShiftColumn(mockForm)
              }}
            >
              {board[laneKey].map((card) => {
                const providers = (card.media.streaming_services as any[]) || []
                const networkLabel = providers.length > 0 ? providers[0].name : 'Cable'
                const genresArr = String(card.media.genres || '').replace(/[{}"\\]/g, '').split(',').map(g => g.trim()).filter(Boolean);

                return (
                  <MediaRowCard
                    key={card.uniqueUiKey}
                    uniqueUiKey={card.uniqueUiKey}
                    mediaItemId={card.media.id}
                    profileId={card.trackingProfileId}
                    title={card.media.title}
                    mediaType={card.media.type}
                    networkLabel={networkLabel}
                    genres={genresArr}
                    displayTags={card.displayTags}
                    description={card.media.description}
                    rottenTomatoesScore={card.media.rotten_tomatoes_score}
                    showWatchNowCTA={laneKey === 'short_list'}
                  >
                    {card.trackingProfileId === 'collapsed' ? (
                      profiles.map((p) => {
                        const stateObj = userStates?.find(s => s.media_item_id === card.media.id && s.profile_id === p.id)
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontWeight: 'bold' }}>{p.display_name.replace(' Test', '')}:</span>
                            <span style={{ textTransform: 'capitalize', color: '#334155', fontWeight: '600' }}>
                              {stateObj?.state.replace('_', ' ') || 'Long List'} {card.media.type === 'tv' && `(S${stateObj?.current_season || 1})`}
                            </span>
                          </div>
                        )
                      })
                    ) : (
                      (() => {
                        const activeProfile = profiles.find(p => p.id === card.trackingProfileId)
                        if (!activeProfile) return null
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontWeight: 'bold' }}>{activeProfile.display_name.replace(' Test', '')}:</span>
                            <span style={{ textTransform: 'capitalize', color: '#334155', fontWeight: '600' }}>
                              {laneKey.replace('_', ' ')} {card.media.type === 'tv' && `(S${card.currentSeason})`}
                            </span>
                          </div>
                        )
                      })()
                    )}
                  </MediaRowCard>
                )
              })}
            </KanbanLaneUI>
          ))}
        </div>
      </main>
    </div>
  )
}
