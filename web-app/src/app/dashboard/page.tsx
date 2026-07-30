import { createClient } from '@/lib/supabase/server'
import AddMediaInput from '@/components/kanban/AddMediaInput'
import { KanbanBoardData, KanbanCard } from '@/types/kanban'
import { Database } from '@/types/supabase'
import { updateCardState } from '@/actions/kanban'
import { revalidatePath } from 'next/cache'

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
  return (
    <main className="h-screen max-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden p-6 space-y-5 select-none">
      
      {/* Header Bar Row */}
      <header className="flex flex-shrink-0 flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-3.5">
        <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1 w-full">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">🎬 Our Watchlist</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">Collaborative Media Matrix</p>
          </div>
          <div className="w-full md:w-auto flex-1 max-w-md">
            <AddMediaInput />
          </div>
        </div>
        
        <div className="flex gap-1.5 bg-slate-900/50 border border-slate-800/60 p-1.5 rounded-xl self-end md:self-center">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-xs font-bold bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-lg shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {p.display_name}
            </div>
          ))}
        </div>
      </header>

      {/* 5-Column Side-by-Side Horizontal Desktop Matrix Grid Layout */}
      <div className="kanban-board-grid">
        {laneOrder.map((laneKey) => (
          <div key={laneKey} className="kanban-lane shadow-xl">
            
            {/* Column Label Header Status Card */}
            <div className={`flex flex-shrink-0 items-center justify-between px-3 py-2 border border-slate-800 rounded-xl mb-3 font-bold text-xs tracking-wide shadow-inner ${laneMeta[laneKey].color}`}>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${laneMeta[laneKey].dot}`} />
                <span>{laneMeta[laneKey].title}</span>
              </div>
              <span className="font-mono text-[10px] bg-slate-950 border border-slate-800/80 px-2 py-0.5 rounded-md text-slate-400">
                {board[laneKey].length}
              </span>
            </div>
            
            {/* Scrollable Lane Column container list */}
            <div className="kanban-scroll-area space-y-2.5">
              {board[laneKey].map((card) => {
                const providers = (card.media.streaming_services as any[]) || []
                const networkLabel = providers.length > 0 ? providers[0].name : 'Cable'

                const genreText = String(card.media.genres || '')
                  .replace(/[{}"\\]/g, '')
                  .split(',')
                  .map(g => g.trim())
                  .filter(Boolean)

                return (
                  // 🟢 Simplified details block to let the inner row handle background parameters cleanly
                  <details key={card.media.id} className="group block mb-2.5 outline-none select-none">
                    
                    {/* 🟢 Premium styled Summary row card featuring background depth definitions */}
                    <summary className="card-summary-row p-3 hover:bg-slate-800/40 transition-colors">
                      
                      {/* Left align grouping elements (Title + Platform network badge) */}
                      <div className="card-header-left">
                        <h3 className="font-extrabold text-xs text-slate-100 tracking-tight group-open:text-white truncate">
                          {laneKey === 'watched' && '✅ '}{card.media.title}
                        </h3>
                        
                        <span className="network-badge-tag">
                          {networkLabel}
                        </span>
                      </div>

                      {/* Right align grouping elements (Clean padded charcoal genre pill capsules) */}
                      {genreText.length > 0 && (
                        <div className="flex gap-1.5 flex-shrink-0 items-center">
                          {genreText.slice(0, 2).map((genreName, i) => (
                            <span key={i} className="genre-pill-capsule">
                              {genreName}
                            </span>
                          ))}
                        </div>
                      )}
                    </summary>

                    {/* 🟢 Expanded Drawer content panel matching our clean card layout bounds */}
                    <div className="mx-1 mt-1.5 px-3.5 pb-3.5 pt-3 border-x border-b border-slate-800 bg-slate-900/20 rounded-b-xl space-y-3 font-normal shadow-md">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="tracking-widest uppercase font-black px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-500">
                          {card.media.type}
                        </span>
                        {card.media.rotten_tomatoes_score && (
                          <span className="font-extrabold text-amber-500 bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded-md">
                            🍅 {card.media.rotten_tomatoes_score}% RT Score
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed font-normal">
                        {card.media.description}
                      </p>

                      {/* Progressive Individual Split User Progress Control Row Banners */}
                      <div className="pt-2.5 border-t border-slate-800/40 space-y-2">
                        {Object.entries(card.userStates).map(([profileId, stateObj]) => (
                          <div key={profileId} className="flex flex-col gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-900/60">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-400">{stateObj.displayName}:</span>
                              <span className="text-slate-300 capitalize">
                                {stateObj.state} {card.media.type === 'tv' && `(S${stateObj.currentSeason})`}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {laneOrder.map((stepState) => {
                                if (stepState === stateObj.state) return null
                                const label = stepState === 'prioritised' ? 'Shortlist' : stepState.replace('_', ' ')
                                return (
                                  <form key={stepState} action={handleShiftColumn} className="flex-1 min-w-[45%]">
                                    <input type="hidden" name="profileId" value={profileId} />
                                    <input type="hidden" name="mediaItemId" value={card.media.id} />
                                    <input type="hidden" name="targetState" value={stepState} />
                                    <button
                                      type="submit"
                                      className="w-full text-center text-[9px] font-extrabold px-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 hover:text-white rounded-md text-slate-400 uppercase tracking-tighter transition-all cursor-pointer"
                                    >
                                      ➔ {label.split(' ')}
                                    </button>
                                  </form>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </details>
                )
              })}
            </div>

          </div>
        ))}
      </div>
    </main>
  )
}
