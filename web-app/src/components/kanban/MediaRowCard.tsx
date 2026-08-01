import React from 'react'

interface MediaRowCardProps {
  title: string;
  mediaType: 'movie' | 'tv';
  networkLabel: string;
  genres: string[];
  description?: string | null;
  rottenTomatoesScore?: number | null;
  showWatchNowCTA: boolean;
  children: React.ReactNode;
}

export default function MediaRowCard({
  title,
  mediaType,
  networkLabel,
  genres,
  description,
  rottenTomatoesScore,
  showWatchNowCTA,
  children
}: MediaRowCardProps) {
  return (
    <details style={{ display: 'block', outline: 'none', userSelect: 'none', marginBottom: '8px' }}>
      <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', gap: '8px', padding: '8px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }} className="justify-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </h3>
          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', padding: '2px 4px', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', color: '#046a38', borderRadius: '2px' }}>
            {networkLabel}
          </span>
        </div>

        {genres.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', padding: '2px 4px', borderRadius: '2px' }}>
              {genres[0]}
            </span>
          </div>
        )}
      </summary>

      <div style={{ marginLeft: '2px', marginRight: '2px', marginTop: '4px', padding: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', fontSize: '9px' }} className="justify-between">
          <span style={{ textTransform: 'uppercase', fontWeight: '800', padding: '2px 4px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '4px' }}>
            {mediaType}
          </span>
          {rottenTomatoesScore && (
            <span style={{ fontWeight: '800', color: '#d97706', backgroundColor: '#fffbe6', padding: '2px 6px', border: '1px solid #fef3c7', borderRadius: '4px' }}>
              🍅 {rottenTomatoesScore}% RT
            </span>
          )}
        </div>

        {description && (
          <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4', fontWeight: '500', marginTop: '6px', marginBottom: '6px' }}>
            {description}
          </p>
        )}

        {showWatchNowCTA && (
          <div style={{ marginTop: '6px' }}>
            <button style={{ width: '100%', backgroundColor: '#046a38', color: '#ffffff', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', padding: '6px 0', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
              Watch Now
            </button>
          </div>
        )}

        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {children}
        </div>
      </div>
    </details>
  )
}
