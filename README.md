### playlistGo - when Spotify meets YouTube

<img width="60%" alt="main player" src="https://github.com/user-attachments/assets/7ca866b9-9341-44e4-958f-5e6fd71fcfd2" />
<img width="30%" alt="image" src="https://github.com/user-attachments/assets/849b961f-7566-47da-9d34-77cb0c4a8622" />

Built on the [django-react](https://github.com/jasurlive/django-react) `front/` template (React 19 + Vite + React Compiler, same themes, menu and hooks layout).

```bash
npm i
cp .env.example .env
npm run dev          # http://localhost:1212
```

- **Songs**: `public/data/songs.csv` (`title,url`; `Artist - Title` is split into two lines) + songs you save from YouTube
- **Search**: one box, two sources: *My songs* (instant) or *YouTube* (press Enter; pasted links work without a key). Swipe sideways to flip.
- **YouTube API**: put `YOUTUBE_API_KEY` in `.env` (dev) and in the Vercel env (prod). The browser only talks to `/api/search` (`api/search.ts`), so the key is never public. 10 searches/min per IP, results cached for an hour.
- **Mood playlists = library tabs**: name + mood emoji, saved in `localStorage`. Manage them in *Moods*.
- **Touch**
  - library: swipe sideways between playlist tabs; hold a song (or tap ⋮) for play next / add to queue / add to playlist / save
  - mini player: tap or swipe up to open, sideways to skip
  - full player: swipe down to close, sideways to skip, up for the play queue
  - sheets: drag down to close
- **Keys**: `K`/`5` play-pause, `6`/`N` next, `4`/`P` prev, `Shift+S` shuffle, `R` repeat, `S`/`/` focus search, `Esc` close the player or go back, `Ctrl+J` theme, `` ` `` sidebar

```
api/                     vercel functions: search.ts (youtube, key stays server side), visit.ts (telegram ping)
src/
├── app/                 entry: main.tsx, App.tsx (routes), env.d.ts
├── pages/               Library (tabs), Moods, Search, Queue, Settings, NotFound
├── components/          Layout, PlayerProvider, MiniPlayer, FullPlayer, SongList/SongRow, QueueList,
│                        Sheet, SongActions, PlaylistSheet, ConfirmDialog, ErrorBoundary
├── shared/              Menu (sidebar / mobile tab bar), ThemeIcons, BackButton
├── hooks/
│   ├── GET/             useGetSongs (csv), useYouTubeSearch (/api/search)
│   └── LOCAL/           usePlaylists, useSavedSongs, useLibrary, usePlayer, useProgress,
│                        useSwipe, useDragDismiss, useLongPress, useShortcuts, useTheme, useFullscreen
├── lib/                 youtube, moods, sources, format, themes, types, playerContext, embed,
│                        trackVisit (one /api/visit ping per session)
└── css/
```

## Managing songs (Python)

`scripts/app.py` edits `public/data/songs.csv` (served at `/data/songs.csv` in production).

```bash
python -m venv scripts/.venv && source scripts/.venv/bin/activate
pip install -r scripts/requirements.txt
python scripts/app.py
```

- Search YouTube (needs `APP_PY_YT_KEY` or `YOUTUBE_API_KEY` in `.env`) → select → **Add selected to top**
- Drag or **Top / Up / Down** to reorder, double-click to edit, `Delete` to remove, `Ctrl+S` to save (asks to confirm)
- Titles with commas are quoted (`"Hello, World",url`), so no need to strip them
