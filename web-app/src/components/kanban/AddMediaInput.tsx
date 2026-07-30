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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  async function handleSelectMedia(tmdbId: string, type: 'movie' | 'tv') {
    setResults([])
    setQuery('')
    
    const res = await addMediaToDatabase({ tmdbId, mediaType: type, assignTo })
    if (res.success) {
      router.refresh()
    } else {
      alert('Failed to save data. Ensure your API keys are added to .env.local')
    }
  }

  return (
    <div ref={dropdownRef} className="relative w-full max-w-sm">
      
      {/* 3-way user target assignment filter panel */}
      <div className="flex items-center gap-2 mb-2.5 text-[11px] font-bold text-slate-500 tracking-wide uppercase">
        <span>Track For:</span>
        <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          {(['both', 'husband', 'wife'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAssignTo(opt)}
              className={`toggle-option-button ${assignTo === opt ? 'active' : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Main search input entry box field */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Type a movie or TV show name..."
          className="search-input-field"
        />
        {loading && (
          <div className="absolute right-3 top-3.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
        )}
      </div>

      {/* Autocomplete Results Panel floating dropdown box overlay */}
      {results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800/60 max-h-[280px] overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.tmdbId}
              type="button"
              onClick={() => handleSelectMedia(item.tmdbId, item.type)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-800/50 transition-colors outline-none"
            >
              {item.poster ? (
                <img src={item.poster} alt={item.title} className="w-7 h-10 object-cover rounded bg-slate-950 border border-slate-800" />
              ) : (
                <div className="w-7 h-10 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-[10px] text-slate-600">🎬</div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-200 truncate">{item.title}</h4>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-semibold">
                  <span className="uppercase text-[9px] font-black tracking-wider px-1 py-0.2 bg-slate-950 border border-slate-800 rounded text-slate-400">
                    {item.type}
                  </span>
                  <span>•</span>
                  <span>{item.year[0]}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
