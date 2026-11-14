// youtube helpers: video id parsing + the IFrame Player API (loaded once, on demand)
// docs: https://developers.google.com/youtube/iframe_api_reference

export function getVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || null
    const path = u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/)
    if (path) return path[2]
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

export const thumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`

export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 } as const

export type YTPlayer = {
  loadVideoById(id: string): void
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  unloadModule(name: string): void
  destroy(): void
}

// minimal embed: our own ui does play / seek / skip, youtube shows just the video
// docs: https://developers.google.com/youtube/player_parameters
export const MINIMAL_PLAYER_VARS = {
  playsinline: 1, // no forced fullscreen on iphone
  controls: 0, // no youtube control bar
  disablekb: 1, // our own shortcuts, not youtube's
  fs: 0, // no fullscreen button
  rel: 0, // related videos only from the same channel
  iv_load_policy: 3, // no annotations / cards
  cc_load_policy: 0, // subtitles off (not reliable alone, see hideCaptions)
} as const

// youtube turns subtitles back on per video (account / video defaults), so drop the module on every play
export function hideCaptions(player: YTPlayer) {
  try {
    player.unloadModule('captions') // html5 player
    player.unloadModule('cc') // legacy name
  } catch {
    // not loaded yet / not supported: nothing to hide
  }
}

type YTEvent = { target: YTPlayer; data: number }

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      videoId?: string
      width?: string
      height?: string
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: (e: YTEvent) => void
        onStateChange?: (e: YTEvent) => void
        onError?: (e: YTEvent) => void
      }
    },
  ) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTNamespace> | null = null

export function loadYouTubeApi(): Promise<YTNamespace> {
  apiPromise ??= new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT)

    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve(window.YT!)
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      apiPromise = null
      reject(new Error('YouTube player failed to load'))
    }
    document.head.append(script)
  })
  return apiPromise
}

export const bigThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`

// "Artist - Title (Official Video)" -> { artist, title }; channel is the fallback artist
export function splitTitle(raw: string, channel = '') {
  const clean = raw
    .replace(/\s*[([](official|lyrics?|audio|video|music video|hd|4k|visuali[sz]er)[^)\]]*[)\]]/gi, '')
    .trim()
  const dash = clean.search(/\s[-–—]\s/)
  if (dash > 0) {
    return { artist: clean.slice(0, dash).trim(), title: clean.slice(dash + 3).trim() || clean }
  }
  return {
    artist: channel.replace(/\s*-\s*Topic$|VEVO$/i, '').trim(),
    title: clean || raw || 'Untitled',
  }
}
