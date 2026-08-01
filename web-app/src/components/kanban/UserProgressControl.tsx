import React from 'react'

interface UserProgressControlProps {
  profileId: string;
  displayName: string;
  currentState: string;
  currentSeason: number;
  mediaType: 'movie' | 'tv';
  mediaItemId: string;
  laneOrder: string[];
  onShiftAction: (formData: FormData) => void;
}

export default function UserProgressControl({
  profileId,
  displayName,
  currentState,
  currentSeason,
  mediaType,
  mediaItemId,
  laneOrder,
  onShiftAction
}: UserProgressControlProps) {
  const displayState = currentState === 'prioritised' ? 'Shortlist' : currentState.replace('_', ' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#ffffff', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', fontSize: '9px', fontWeight: 'bold' }} className="justify-between">
        <span style={{ color: '#94a3b8' }}>{displayName}:</span>
        <span style={{ color: '#334155', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
          {displayState} {mediaType === 'tv' && `(S${currentSeason})`}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {laneOrder.map((stepState) => {
          if (stepState === currentState) return null;
          const label = stepState === 'prioritised' ? 'Shortlist' : stepState.replace('_', ' ');
          
          return (
            <form key={stepState} action={onShiftAction} style={{ flex: '1 1 45%', minWidth: '45%' }}>
              <input type="hidden" name="profileId" value={profileId} />
              <input type="hidden" name="mediaItemId" value={mediaItemId} />
              <input type="hidden" name="targetState" value={stepState} />
              <button
                type="submit"
                style={{ width: '100%', textAlign: 'center', fontSize: '8px', fontWeight: '900', padding: '4px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', borderRadius: '2px', cursor: 'pointer' }}
              >
                ➔ {label}
              </button>
            </form>
          )
        })}
      </div>
    </div>
  )
}
