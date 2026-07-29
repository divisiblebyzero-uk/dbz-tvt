'use server'

import { createClient } from '@/lib/supabase/server'

interface TMDBResult {
  id: number
  title?: string
  name?: string
  media_type: 'movie' | 'tv'
  release_date?: string
  first_air_date?: string
  poster_path: string | null
}

export async function searchMediaAutocomplete(query: string) {
  if (!query || query.trim().length < 2) return []

  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    console.error('TMDB_API_KEY environment variable missing')
    return []
  }

  try {
    const url = `https://themoviedb.org{apiKey}&query=${encodeURIComponent(query)}&include_adult=false`
    const res = await fetch(url)
    
    if (!res.ok) throw new Error('Upstream API error')
    
    const data = await res.json()
    const rawResults: TMDBResult[] = data.results || []

    return rawResults
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item) => ({
        tmdbId: item.id.toString(),
        title: item.title || item.name || 'Unknown Title',
        type: item.media_type,
        year: (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A',
        poster: item.poster_path ? `https://tmdb.org{item.poster_path}` : null,
      }))
      .slice(0, 5)
  } catch (error) {
    console.error('Failed to resolve TMDB autocomplete search:', error)
    return []
  }
}

export async function addMediaToDatabase({
  tmdbId,
  mediaType,
  assignTo
}: {
  tmdbId: string
  mediaType: 'movie' | 'tv'
  assignTo: 'both' | 'husband' | 'wife'
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized operational context.')

  const tmdbKey = process.env.TMDB_API_KEY
  const omdbKey = process.env.OMDB_API_KEY

  try {
    const tmdbUrl = `https://themoviedb.org{mediaType}/${tmdbId}?api_key=${tmdbKey}&append_to_response=watch/providers`
    const tmdbRes = await fetch(tmdbUrl)
    const tmdbData = await tmdbRes.json()

    const ukProviders = tmdbData['watch/providers']?.results?.GB?.flatrate || []
    
    // 🟢 Explicitly type the provider item parameter as 'any' to appease the compiler contract rules
    const mappedProviders = ukProviders.map((p: any) => ({
      name: p.provider_name,
      logo: `https://tmdb.org{p.logo_path}`
    }))

    // 🟢 Explicitly type the genre item parameter as 'any'
    const genres = (tmdbData.genres || []).map((g: any) => g.name)
    const imdbId = tmdbData.imdb_id || null
    const totalSeasons = mediaType === 'tv' ? (tmdbData.number_of_seasons || 1) : 1

    let rtScore: number | null = null
    if (imdbId && omdbKey) {
      const omdbRes = await fetch(`http://omdbapi.com{omdbKey}&i=${imdbId}`)
      const omdbData = await omdbRes.json()
      const ratings = omdbData.Ratings || []
      const rtRating = ratings.find((r: any) => r.Source === 'Rotten Tomatoes')
      if (rtRating) {
        rtScore = parseInt(rtRating.Value.replace('%', ''), 10)
      }
    }

    const { data: savedMedia, error: mediaError } = await supabase
      .from('media_items')
      .upsert({
        tmdb_id: tmdbId,
        imdb_id: imdbId,
        title: tmdbData.title || tmdbData.name || 'Unknown Title',
        type: mediaType,
        description: tmdbData.overview || '',
        rotten_tomatoes_score: rtScore,
        streaming_services: mappedProviders as any,
        genres,
        total_seasons: totalSeasons
      }, { onConflict: 'tmdb_id' })
      .select()
      .single()

    if (mediaError || !savedMedia) throw mediaError

    let targetProfileIds: string[] = []
    const { data: profiles } = await supabase.from('profiles').select('id, display_name')

    if (!profiles) throw new Error('Could not pull active workspace profiles.')

    if (assignTo === 'both') {
      targetProfileIds = profiles.map((p) => p.id)
    } else {
      const matchedProfile = profiles.find(p => 
        p.display_name.toLowerCase().includes(assignTo)
      )
      if (matchedProfile) targetProfileIds.push(matchedProfile.id)
    }

    for (const profileId of targetProfileIds) {
      await supabase
        .from('user_media_states')
        .upsert({
          profile_id: profileId,
          media_item_id: savedMedia.id,
          state: 'available',
          current_season: 1
        }, { onConflict: 'profile_id,media_item_id' })
    }

    return { success: true }
  } catch (error) {
    console.error('Data hydration workflow failed:', error)
    return { success: false }
  }
}
