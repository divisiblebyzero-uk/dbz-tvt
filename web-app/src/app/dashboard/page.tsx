import { createClient } from '@/lib/supabase/server'
import AddMediaInput from '@/components/kanban/AddMediaInput'
import { KanbanBoardData, KanbanCard } from '@/types/kanban'
import { Database } from '@/types/supabase'
import { updateCardState } from '@/actions/kanban'
import { revalidatePath } from 'next/cache'

type KanbanState = Database['public']['Enums']['kanban_state']

export default async function DashboardPage() {
  const supabase = await createClient()

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
      <main className="min-h-screen bg-slate-950 text-slate-100 p-8 max-w-7xl mx-auto space-y-6">
        <header className="border-b border-slate-800 pb-6 space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">🎬 Our Watchlist</h1>
          <p className="text-sm text-slate-400">No active tracking items discovered inside your local database.</p>
          <AddMediaInput />
        </header>
      </main>
    )
  }

  const cardsMap: { [mediaId: string]: KanbanCard } = {}

  mediaStates.forEach((row) => {
    const rawMedia = row.media_items
    // 🟢 Fixed extraction: Extract rawMedia[0] if it comes back nested as an array!
    const media: any = Array.isArray(rawMedia) ? rawMedia[0] : rawMedia
    
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

  const laneMeta: { [key in KanbanState]: { title: string; color: string; bg: string } } = {
    not_available: { title: 'Not Available', color: 'text-slate-400 bg-slate-900/40 border-slate-800', bg: 'bg-slate-900/10' },
    available: { title: 'Available', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', bg: 'bg-emerald-950/5' },
    prioritised: { title: 'Next Up', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', bg: 'bg-amber-950/5' },
    watching: { title: 'Watching', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', bg: 'bg-sky-950/5' },
    watched: { title: 'Watched', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', bg: 'bg-indigo-950/5' }
  }
  return (
    <main className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans p-4 space-y-4">
      
      <header className="flex flex-shrink-0 items-center justify-between gap-6 border-b border-slate-900 pb-3">
        <div className="flex items-center gap-6 flex-1">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Our Shared Watchlist</h1>
            <p className="text-xs text-slate-500">Real-time media matrix.</p>
          </div>
          <AddMediaInput />
        </div>
        
        <div className="flex gap-1.5 bg-slate-900/40 border border-slate-800/60 p-1 rounded-xl">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-[11px] font-bold bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {p.display_name}
            </div>
          ))}
        </div>
      </header>

      <div className="kanban-board-grid">
        {laneOrder.map((laneKey) => (
          <div key={laneKey} className="kanban-lane">
            
            <h2 className={`text-[11px] font-bold tracking-wider uppercase mb-3 px-2 py-1.5 border border-slate-800 rounded-lg flex items-center justify-between ${laneMeta[laneKey].color}`}>
              <span>{laneMeta[laneKey].title}</span>
              <span className="font-mono text-slate-400 bg-slate-950/80 border border-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                {board[laneKey].length}
              </span>
            </h2>
            
            <div className="kanban-scroll-area space-y-3">
              {board[laneKey].map((card) => (
                <div key={card.media.id} className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl shadow-md hover:border-slate-700 transition-all space-y-3">
                  
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] tracking-widest uppercase font-black px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-500">
                      {card.media.type}
                    </span>
                    {card.media.rotten_tomatoes_score && (
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/5 px-1.5 py-0.2 border border-amber-500/10 rounded">
                        🍅 {card.media.rotten_tomatoes_score}%
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-xs text-slate-200 tracking-tight">{card.media.title}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">{card.media.description}</p>
                  </div>

                  {card.media.streaming_services && (card.media.streaming_services as any[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(card.media.streaming_services as any[]).map((prov, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-medium">
                          {prov.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-slate-950 space-y-2">
                    {Object.entries(card.userStates).map(([profileId, stateObj]) => (
                      <div key={profileId} className="flex flex-col gap-1.5 bg-slate-950/80 p-2 rounded-lg border border-slate-900">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-500">{stateObj.displayName}:</span>
                          <span className="text-slate-300 capitalize">
                            {stateObj.state} {card.media.type === 'tv' && `(S${stateObj.currentSeason})`}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {laneOrder.map((stepState) => {
                            if (stepState === stateObj.state) return null
                            const label = stepState === 'prioritised' ? 'Next' : stepState.replace('_', ' ')
                            return (
                              <form key={stepState} action={handleShiftColumn} className="flex-1">
                                <input type="hidden" name="profileId" value={profileId} />
                                <input type="hidden" name="mediaItemId" value={card.media.id} />
                                <input type="hidden" name="targetState" value={stepState} />
                                <button
                                  type="submit"
                                  className="w-full text-center text-[9px] font-bold px-1 py-1 bg-slate-900 border border-slate-800 hover:border-slate-600 hover:text-white rounded-md text-slate-400 uppercase transition-all shadow-sm active:scale-95"
                                >
                                  ➔ {label}
                                </button>
                              </form>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </main>
  )
}
