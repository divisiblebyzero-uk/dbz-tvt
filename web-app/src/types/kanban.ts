export type KanbanState = 'long_list' | 'short_list' | 'watching' | 'watched' | 'not_available';

export interface UIKanbanCard {
  uniqueUiKey: string; // E.g. "media-123-husband" or "media-123-both" to bypass React key clashes
  media: {
    id: string;
    title: string;
    type: 'movie' | 'tv';
    streaming_services: any[];
    genres: string[];
    rotten_tomatoes_score: number | null;
    description: string | null;
  };
  displayTags: ('Husband' | 'Wife' | 'Both')[];
  trackingProfileId: string | 'collapsed'; // Informs the shift action form exactly which row to mutate
  currentSeason: number;
}

export type UIKanbanBoard = {
  [key in KanbanState]: UIKanbanCard[];
};
