'use client' // 🟢 MARK AS AN INTERACTIVE DROP CONTEXT ZONE

import React from 'react'
import LaneHeader from './LaneHeader'

interface KanbanLaneUIProps {
  laneKey: string;
  title: string;
  cardCount: number;
  onCardDropped: (mediaItemId: string, profileId: string, targetState: string) => Promise<void>;
  children: React.ReactNode;
}

export default function KanbanLaneUI({ laneKey, title, cardCount, onCardDropped, children }: KanbanLaneUIProps) {
  return (
    <div 
      className="kanban-lane"
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(241, 245, 249, 0.9)'}
      onDragLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      onDrop={async (e) => {
        e.preventDefault()
        e.currentTarget.style.backgroundColor = 'transparent'
        
        const mediaItemId = e.dataTransfer.getData('mediaItemId')
        const profileId = e.dataTransfer.getData('profileId')
        
        if (mediaItemId && profileId) {
          await onCardDropped(mediaItemId, profileId, laneKey)
        }
      }}
    >
      <LaneHeader laneKey={laneKey} title={title} cardCount={cardCount} />
      <div className="kanban-scroll-area">
        {children}
      </div>
    </div>
  )
}