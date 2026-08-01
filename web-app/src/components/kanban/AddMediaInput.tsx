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

  /* =========================================================
     STITCH COMPACT PREMIUM CONTROL PANEL VIEWPORT MARGINS
     ========================================================= */
  return (
    <div ref={dropdownRef} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', position: 'relative' }}>
      
      {/* 1. Tactile Slider Filter Track Button Bar Toggle */}
      <div style={{ display: 'flex', gap: '2px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '3px', borderRadius: '8px', flexShrink: 0 }}>
        {(['both', 'husband', 'wife'] as const).map((mode) => {
          const isActive = assignTo === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setAssignTo(mode)}
              style={{
                textTransform: 'capitalize',
                fontSize: '10px',
                fontWeight: '800',
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#046a38' : '#64748b',
                boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              {mode}
            </button>
          )
        })}
      </div>

      {/* 2. Search Input Container with Absolute Lens Anchor */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: '12px', color: '#94a3b8', fontSize: '11px', pointerEvents: 'none', userSelect: 'none' }}>
          🔍
        </span>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loading ? "Searching Upstream..." : "Search Command Center..."}
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '6px 12px 6px 32px',
            fontSize: '12px',
            color: '#0f172a',
            outline: 'none',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            transition: 'border-color 0.15s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#046a38'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />

        {/* 3. Dropdown Search Matches Flyout Overlay Drawer Panel */}
        {results.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            zIndex: 50,
            maxHeight: '256px',
            overflowY: 'auto',
            padding: '4px 0'
          }}>
            {results.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectMedia(String(item.id), item.media_type)}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.1s ease',
                  borderBottom: '1px solid #f8fafc'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title || item.name}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {item.release_date || item.first_air_date ? String(item.release_date || item.first_air_date).split('-')[0] : 'N/A'}
                  </span>
                </div>
                <span style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  padding: '2px 4px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  borderRadius: '4px',
                  marginLeft: '8px',
                  flexShrink: 0
                }}>
                  {item.media_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
