### PlaylistGo Lite

YouTube music player built on the [django-react](https://github.com/jasurlive/django-react) `front/` template (React 19 + Vite + React Compiler, same themes, menu and hooks layout). Frontend only, deployed on Vercel.

```bash
npm i
cp .env.example .env
npm run dev          # http://localhost:1212
```

- **Songs**: `public/songs/songs.csv` (`title,url`; `Artist - Title` is split into two lines) + songs you save from YouTube
- **Search**: one box, two sources: *My songs* (instant) or *YouTube* (press Enter; pasted links work without a key). Swipe sideways to flip.
- **YouTube API**: put `YOUTUBE_API_KEY` in `.env` (dev) and in the Vercel env (prod). The browser only talks to `/api/search` (`api/search.ts`), so the key is never public. 10 searches/min per IP, results cached for an hour.
- **Mood playlists = library tabs**: name + mood emoji, saved in `localStorage`. Manage them in *Moods*.
- **Touch**
  - library: swipe sideways between playlist tabs; hold a song (or tap ⋮) for play next / add to queue / add to playlist / save
  - mini player: tap or swipe up to open, sideways to skip
  - full player: swipe down to close, sideways to skip, up for the play queue
  - sheets: drag down to close
- **Keys**: `K`/`5` play-pause, `6`/`N` next, `4`/`P` prev, `S` shuffle, `R` repeat, `/` search, `Esc` close, `Ctrl+J` theme

```
api/search.ts            vercel function: youtube search (key stays server side)
src/
├── app/                 main.tsx, App.tsx (routes), env.d.ts
└── tools/
    ├── pages/           Library (tabs), Moods, Search, Queue, Settings, NotFound
    ├── components/      Layout, PlayerProvider, MiniPlayer, FullPlayer, SongList/SongRow, QueueList,
    │                    Sheet, SongActions, PlaylistSheet, ErrorBoundary
    ├── shared/          Menu (sidebar / mobile tab bar), ThemeIcons
    ├── hooks/GET/       useGetSongs (csv), useYouTubeSearch (/api/search)
    ├── hooks/LOCAL/     usePlaylists, useSavedSongs, useLibrary, usePlayer, useProgress,
    │                    useSwipe, useDragDismiss, useLongPress, useShortcuts, useTheme
    ├── lib/             youtube, moods, sources, format, themes, types, playerContext
    └── css/
```
