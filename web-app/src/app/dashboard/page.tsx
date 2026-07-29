import { createClient } from '@/lib/supabase/server'
import { KanbanBoardData, KanbanCard } from '@/types/kanban'
import { Database } from '@/types/supabase'
import AddMediaInput from '@/components/kanban/AddMediaInput'

type KanbanState = Database['public']['Enums']['kanban_state']

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Fetch all profiles (You and your wife)
  const { data: profiles } = await supabase.from('profiles').select('*')
  
  // 2. Fetch all media items along with their respective tracking progress rows
  const { data: mediaStates } = await supabase
    .from('user_media_states')
    .select(`
      state,
      current_season,
      profile_id,
      media_items (*)
    `)

  // 3. Initialize clean, empty Kanban lanes matching your custom board flow
  const board: KanbanBoardData = {
    not_available: [],
    available: [],
    prioritised: [],
    watching: [],
    watched: []
  }

  if (!mediaStates || !profiles) {
    return <div className="p-8">Loading infrastructure states...</div>
  }

  // 4. Transform relational rows into consolidated visual cards
  const cardsMap: { [mediaId: string]: KanbanCard } = {}

  mediaStates.forEach((row) => {
    const media = row.media_items as any
    if (!media) return

    const profile = profiles.find((p) => p.id === row.profile_id)
    if (!profile) return

    if (!cardsMap[media.id]) {
      cardsMap[media.id] = {
        media,
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

  // 5. Distribute consolidated items into their primary visual Kanban tracking column.
  // Note: If you and your wife are split on states, the item displays inside the lowest matching priority lane.
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

  const laneTitles: { [key in KanbanState]: string } = {
    not_available: '🍿 Not Available Yet',
    available: '🟢 Available',
    prioritised: '🔥 Next Up / Prioritised',
    watching: '📺 Watching',
    watched: '✅ Watched'
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-6">
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Our Shared Watchlist</h1>
          <p className="text-sm text-slate-400">Tracked collaboratively with real-time sync.</p>
        </div>
        <div className="flex gap-2">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {p.display_name}
            </div>
          ))}
        </div>
      </header>
      <div>
  <h1 className="text-2xl font-bold tracking-tight">Our Shared Watchlist</h1>
  <p className="text-sm text-slate-400 mb-4">Tracked collaboratively with real-time sync.</p>
  
  {/* 🟢 Render the predictive input element right inside your header layout */}
  <AddMediaInput />
</div>

      {/* Grid container spanning all 5 custom media lanes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {(Object.keys(board) as KanbanState[]).map((laneKey) => (
          <div key={laneKey} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col min-h-[500px]">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 mb-3 border-b border-slate-800 pb-2">
              {laneTitles[laneKey]} <span className="text-xs text-slate-500 font-mono ml-1">({board[laneKey].length})</span>
            </h2>
            
            <div className="space-y-3 flex-1">
              {board[laneKey].map((card) => (
                <div key={card.media.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm hover:border-slate-700 transition-all space-y-3">
                  <div>
                    <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 font-medium text-slate-400 border border-slate-700/50 mr-1.5">
                      {card.media.type}
                    </span>
                    <h3 className="font-semibold text-slate-200 mt-1 inline-block">{card.media.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{card.media.description}</p>
                  
                  {card.media.rotten_tomatoes_score && (
                    <div className="text-[11px] font-medium text-amber-400/90 flex items-center gap-1">
                      🍅 {card.media.rotten_tomatoes_score}% RT Score
                    </div>
                  )}

                  {/* Render your unit-tested custom individual split user tracking states */}
                  <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                    {Object.entries(card.userStates).map(([profileId, stateObj]) => (
                      <div key={profileId} className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2 py-1 rounded border border-slate-800/40">
                        <span className="text-slate-400 font-medium">{stateObj.displayName}:</span>
                        <span className="text-slate-300 capitalize">
                          {stateObj.state} {card.media.type === 'tv' && `(S${stateObj.currentSeason})`}
                        </span>
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
