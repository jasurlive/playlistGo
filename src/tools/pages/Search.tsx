import { useEffect, useRef, useState } from "react";
import { FiSearch, FiX, FiYoutube, FiMusic } from "react-icons/fi";
import "../css/library.css";
import { useLibrary } from "../hooks/LOCAL/useLibrary";
import { useYouTubeSearch } from "../hooks/GET/useYouTubeSearch";
import { useSwipe } from "../hooks/LOCAL/useSwipe";
import { getVideoId } from "../lib/youtube";
import SongList from "../components/SongList";

type Mode = "library" | "youtube";

// one search box, two sources: your songs (instant) or YouTube (on enter, uses api quota)
export default function Search() {
  const library = useLibrary();
  const yt = useYouTubeSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(() => sessionStorage.getItem("search-q") ?? "");
  const [mode, setModeState] = useState<Mode>(() =>
    localStorage.getItem("search-mode") === "youtube" ? "youtube" : "library",
  );

  const setMode = (m: Mode) => {
    setModeState(m);
    localStorage.setItem("search-mode", m);
    if (m === "youtube" && q.trim()) yt.search(q);
  };

  useEffect(() => {
    sessionStorage.setItem("search-q", q);
  }, [q]);

  const onType = (value: string) => {
    setQ(value);
    // a pasted youtube link is always a youtube lookup (free, no quota)
    if (getVideoId(value)) {
      setModeState("youtube");
      yt.search(value);
    }
  };

  // swipe the results sideways to flip between the two sources
  const swipe = useSwipe({
    onLeft: () => mode === "library" && setMode("youtube"),
    onRight: () => mode === "youtube" && setMode("library"),
  });

  const needle = q.trim().toLowerCase();
  const local = needle
    ? library.songs.filter((s) => `${s.artist} ${s.title}`.toLowerCase().includes(needle))
    : [];
  const pending = mode === "youtube" && !!q.trim() && q.trim() !== yt.searched;

  return (
    <div className="search-page">
      <header className="search-head">
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "youtube") yt.search(q);
            inputRef.current?.blur(); // hide the phone keyboard
          }}
        >
          <FiSearch aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => onType(e.target.value)}
            placeholder={mode === "youtube" ? "Search YouTube or paste a link" : `Search ${library.songs.length} songs`}
            enterKeyHint="search"
            autoFocus
            aria-label="Search"
          />
          {q && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
              aria-label="Clear"
            >
              <FiX />
            </button>
          )}
        </form>

        <div className="seg" role="tablist" aria-label="Search in">
          <button type="button" role="tab" aria-selected={mode === "library"} onClick={() => setMode("library")}>
            <FiMusic /> My songs
          </button>
          <button type="button" role="tab" aria-selected={mode === "youtube"} onClick={() => setMode("youtube")}>
            <FiYoutube /> YouTube
          </button>
        </div>
      </header>

      <div className="search-results" {...swipe}>
        {mode === "library" ? (
          needle ? (
            <SongList
              songs={local}
              source="search"
              empty={
                <div className="list-empty">
                  <p>No songs match “{q}”.</p>
                  <button type="button" className="btn btn-accent" onClick={() => setMode("youtube")}>
                    <FiYoutube /> Search YouTube instead
                  </button>
                </div>
              }
            />
          ) : (
            <p className="list-empty">Type to search your {library.songs.length} songs.</p>
          )
        ) : (
          <>
            {pending && (
              <button type="button" className="search-go" onClick={() => yt.search(q)}>
                <FiSearch /> Search YouTube for “{q.trim()}”
              </button>
            )}
            {!q.trim() && (
              <p className="list-empty">
                Find any song on YouTube, play it right away, or tap ⋮ to save it and add it to a mood playlist.
              </p>
            )}
            {yt.loading && <p className="list-empty">Searching…</p>}
            {yt.error && !pending && <p className="list-empty list-error">{yt.error}</p>}
            {!yt.loading && !pending && !yt.error && yt.searched && (
              <SongList songs={yt.results} source="search" empty={<p className="list-empty">No results.</p>} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
