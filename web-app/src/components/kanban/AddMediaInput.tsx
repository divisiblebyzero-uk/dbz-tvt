'use client'

import { useState, useEffect, useRef } from 'react'
import { searchMediaAutocomplete, addMediaToDatabase } from '@/actions/tmdb'
import { useRouter } from 'next/navigation'

export default function AddMediaInput() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [assignTo, setAssignTo] = useState<'both' | 'husband' | 'wife'>('both')
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Clear dropdown if clicking outside the input card component area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced live multi-search query text watcher
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const delayDebounceFn = setTimeout(async () => {
      const liveMatches = await searchMediaAutocomplete(query)
      setResults(liveMatches)
      setLoading(false)
    }, 400) // Wait 400ms after you stop typing before hitting the server action

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  // Triggers the backend data-hydration pipeline on click
  async function handleSelectMedia(tmdbId: string, type: 'movie' | 'tv') {
    setResults([])
    setQuery('')
    
    const res = await addMediaToDatabase({ tmdbId, mediaType: type, assignTo })
    
    if (res.success) {
      router.refresh() // Instantly updates the Server Dashboard with the new item!
    } else {
      alert('Failed to hydrate media data. Check that your TMDB and OMDb API keys are configured.')
    }
  }

  return (
    <div ref={dropdownRef} className="relative w-full max-w-md">
      
      {/* 3-way user target assignment filter panel */}
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400">
        <span>Track For:</span>
        {(['both', 'husband', 'wife'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setAssignTo(opt)}
            className={`capitalize px-2.5 py-0.5 rounded border transition-colors ${
              assignTo === opt 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Main search input entry box field */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Type a movie or TV show name..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all shadow-inner"
        />
        {loading && (
          <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
        )}
      </div>

      {/* Autocomplete Results Panel floating dropdown box overlay */}
      {results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-800/60">
          {results.map((item) => (
            <button
              key={item.tmdbId}
              type="button"
              onClick={() => handleSelectMedia(item.tmdbId, item.type)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/60 transition-colors"
            >
              {item.poster ? (
                <img src={item.poster} alt={item.title} className="w-8 h-11 object-cover rounded bg-slate-950" />
              ) : (
                <div className="w-8 h-11 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-[10px] text-slate-600">🎬</div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-200 truncate">{item.title}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <span className="uppercase text-[10px] font-semibold tracking-wider px-1.5 py-0.2 bg-slate-950 border border-slate-800/80 rounded text-slate-400">
                    {item.type}
                  </span>
                  <span>•</span>
                  <span>{item.year}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
