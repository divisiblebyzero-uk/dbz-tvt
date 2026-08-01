import React from 'react'

interface LaneHeaderProps {
  laneKey: string;
  title: string;
  cardCount: number;
}

export default function LaneHeader({ laneKey, title, cardCount }: LaneHeaderProps) {
  const dotColor = 
    laneKey === 'not_available' ? '#94a3b8' :
    laneKey === 'available' ? '#10b981' :
    laneKey === 'prioritised' ? '#f59e0b' :
    laneKey === 'watching' ? '#0ea5e9' : '#6366f1';

  const cleanTitle = title.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '');

  return (
    <div 
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', paddingBottom: '10px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', userSelect: 'none' }}
      className="justify-between"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: dotColor }} />
        <span style={{ color: '#334155' }}>{cleanTitle}</span>
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '10px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
        {cardCount}
      </span>
    </div>
  )
}
