import { createClient } from '@/lib/supabase/server'
import AddMediaInput from '@/components/kanban/AddMediaInput'
import { KanbanBoardData, KanbanCard } from '@/types/kanban'
import { Database } from '@/types/supabase'
import { updateCardState } from '@/actions/kanban'
import { revalidatePath } from 'next/cache'
import LaneHeader from '@/components/kanban/LaneHeader'
import MediaRowCard from '@/components/kanban/MediaRowCard'
import UserProgressControl from '@/components/kanban/UserProgressControl'

type KanbanState = Database['public']['Enums']['kanban_state']

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Extract database user profiles and progress trackers
  const { data: profiles } = await supabase.from('profiles').select('*')
  const { data: mediaStates } = await supabase
    .from('user_media_states')
    .select(`
      state,
      current_season,
      profile_id,
      media_items (*)
    `)

  const board: KanbanBoardData = {
    not_available: [],
    available: [],
    prioritised: [],
    watching: [],
    watched: []
  }

  if (!mediaStates || !profiles || mediaStates.length === 0) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-2xl font-black text-white">🎬 Our Watchlist</h1>
          <p className="text-xs text-slate-400">No active tracking items discovered inside your local database.</p>
          <AddMediaInput />
        </div>
      </main>
    )
  }

  const cardsMap: { [mediaId: string]: KanbanCard } = {}

  mediaStates.forEach((row) => {
    const rawMedia = row.media_items
    const media: any = Array.isArray(rawMedia) ? rawMedia : rawMedia

    if (!media || !media.id) return

    const profile = profiles.find((p) => p.id === row.profile_id)
    if (!profile) return

    if (!cardsMap[media.id]) {
      cardsMap[media.id] = {
        media: media,
        userStates: {}
      }
    }

    cardsMap[media.id].userStates[profile.id] = {
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      state: row.state as KanbanState,
      currentSeason: row.current_season
    }
  })

  Object.values(cardsMap).forEach((card) => {
    const states = Object.values(card.userStates).map((s) => s.state)

    let targetLane: KanbanState = 'available'
    if (states.includes('watching')) targetLane = 'watching'
    else if (states.includes('prioritised')) targetLane = 'prioritised'
    else if (states.includes('available')) targetLane = 'available'
    else if (states.includes('not_available')) targetLane = 'not_available'
    else if (states.every((s) => s === 'watched')) targetLane = 'watched'

    board[targetLane].push(card)
  })

  async function handleShiftColumn(formData: FormData) {
    'use server'
    const profileId = formData.get('profileId') as string
    const mediaItemId = formData.get('mediaItemId') as string
    const targetState = formData.get('targetState') as KanbanState

    await updateCardState({ profileId, mediaItemId, newState: targetState })
    revalidatePath('/dashboard')
  }

  const laneOrder: KanbanState[] = ['not_available', 'available', 'prioritised', 'watching', 'watched']

  const laneMeta: { [key in KanbanState]: { title: string; color: string; dot: string } } = {
    not_available: { title: '🍿 Not Available', color: 'text-slate-400 bg-slate-900/40 border-slate-800', dot: 'bg-slate-500' },
    available: { title: '🟢 Available', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-950/40', dot: 'bg-emerald-400' },
    prioritised: { title: '🔥 Shortlist', color: 'text-amber-400 bg-amber-950/20 border-amber-950/40', dot: 'bg-amber-400' },
    watching: { title: '📺 Watching', color: 'text-sky-400 bg-sky-950/20 border-sky-950/40', dot: 'bg-sky-400' },
    watched: { title: '✅ Done', color: 'text-indigo-400 bg-indigo-950/20 border-indigo-950/40', dot: 'bg-indigo-400' }
  }




  /* =========================================================
     STITCH COMPACT VIEWPORT WORKSPACE (SELF-CONTAINED ENGINE)
     ========================================================= */
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      
      {/* 1. Left Sidebar Fixed Command Console Panel */}
      <aside style={{ width: '240px', flexShrink: 0, backgroundColor: '#f1f5f9', borderRight: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'between', height: '100%' }} className="justify-between">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '0.05em', color: '#046a38', textTransform: 'uppercase', margin: 0 }}>Media Command</h2>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', margin: '4px 0 0 0', fontWeight: 'bold' }}>V2.4.8 HIGH-DENSITY</p>
          </div>
          
          {/* Sidebar Action Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid rgba(226,232,240,0.5)', color: '#046a38' }}>📁 Library</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>⊞ Collections</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>📊 Analytics</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>📥 Import</span>
          </nav>
        </div>

        {/* Action Button & Docs Footer */}
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

      {/* 2. Right Side Main Layout Workspace Panel */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', padding: '24px', gap: '16px' }}>
        
        {/* Top Navbar Row Header */}
        <header style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }} className="justify-between">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.025em', color: '#0f172a', margin: 0 }}>Media Suite</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '512px', justifyContent: 'end' }} className="justify-end">
            {/* Integrated Command Search Bar Layout Box Container Anchor */}
            <div style={{ width: '100%', maxWidth: '384px' }}>
              <AddMediaInput />
            </div>
            
            {/* Split Profile Tracker Active Status Badges */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(241,245,249,0.8)', border: '1px solid #e2e8f0', padding: '4px', borderRadius: '8px' }}>
              {profiles.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#ffffff', border: '1px solid rgba(226,232,240,0.5)', padding: '4px 10px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '9999px', backgroundColor: '#10b981' }} />
                  {p.display_name}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* 3. 5-Column Compact Grid Board Workspace Matrix */}
        <div className="kanban-board-grid">
          {laneOrder.map((laneKey) => (
            <div key={laneKey} className="kanban-lane">
              
              <LaneHeader 
                laneKey={laneKey} 
                title={laneMeta[laneKey].title} 
                cardCount={board[laneKey].length} 
              />
              
              <div className="kanban-scroll-area">
                {board[laneKey].map((card) => {
                  const providers = (card.media.streaming_services as any[]) || []
                  const networkLabel = providers.length > 0 ? providers[0].name : 'Cable'
                  const genresArr = String(card.media.genres || '').replace(/[{}"\\]/g, '').split(',').map(g => g.trim()).filter(Boolean);

                  return (
                    <MediaRowCard
                      key={card.media.id}
                      title={card.media.title}
                      mediaType={card.media.type}
                      networkLabel={networkLabel}
                      genres={genresArr}
                      description={card.media.description}
                      rottenTomatoesScore={card.media.rotten_tomatoes_score}
                      showWatchNowCTA={laneKey === 'prioritised'}
                    >
                      {Object.entries(card.userStates).map(([profileId, stateObj]) => (
                        <UserProgressControl
                          key={profileId}
                          profileId={profileId}
                          displayName={stateObj.displayName}
                          currentState={stateObj.state}
                          currentSeason={stateObj.currentSeason}
                          mediaType={card.media.type}
                          mediaItemId={card.media.id}
                          laneOrder={laneOrder}
                          onShiftAction={handleShiftColumn}
                        />
                      ))}
                    </MediaRowCard>
                  )
                })}
              </div>

            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
