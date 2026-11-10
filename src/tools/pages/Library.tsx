import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { FiPlus, FiSearch, FiShuffle } from "react-icons/fi";
import "../css/library.css";
import type { Song } from "../lib/types";
import { moodEmoji } from "../lib/moods";
import { useLibrary } from "../hooks/LOCAL/useLibrary";
import { playlistActions, usePlaylists } from "../hooks/LOCAL/usePlaylists";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import SongList from "../components/SongList";

type Tab = { id: string; label: string; emoji?: string; songs: Song[]; playlistId?: string };

function TabPage({ tab, loading, error }: { tab: Tab; loading: boolean; error: string | null }) {
  const player = usePlayer();

  const shufflePlay = () => {
    if (!tab.songs.length) return;
    if (!player.shuffle) player.toggleShuffle();
    player.play(tab.songs, Math.floor(Math.random() * tab.songs.length), tab.playlistId ?? "all");
  };

  return (
    <>
      <button type="button" className="shuffle-play" onClick={shufflePlay} disabled={!tab.songs.length}>
        <FiShuffle />
        <span>Shuffle play</span>
        <span className="shuffle-count">{tab.songs.length}</span>
      </button>

      {loading && !tab.playlistId && <p className="list-empty">Loading songs…</p>}
      {error && !tab.playlistId && <p className="list-empty list-error">Couldn't load songs.csv: {error}</p>}

      <SongList
        songs={tab.songs}
        source={tab.playlistId ?? "all"}
        playlistId={tab.playlistId}
        empty={
          tab.playlistId && (
            <div className="list-empty">
              <p className="list-empty-emoji">{tab.emoji}</p>
              <p>No songs in {tab.label} yet.</p>
              <p>
                Tap <b>⋮</b> on a song (or hold it) → <b>Add to playlist</b>.
              </p>
              <p className="list-empty-links">
                <Link to="/" className="btn">All songs</Link>
                <Link to="/search" className="btn btn-accent">
                  <FiSearch /> Search YouTube
                </Link>
              </p>
            </div>
          )
        }
      />
    </>
  );
}

// all songs + one tab per mood playlist; swipe the list sideways to switch tabs
export default function Library() {
  const { id } = useParams();
  const navigate = useNavigate();
  const playlists = usePlaylists();
  const { songs, byId, loading, error } = useLibrary();
  const pagerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);

  const tabs: Tab[] = [
    { id: "all", label: "All songs", songs },
    ...playlists.map((p) => ({
      id: p.id,
      label: p.name || "Untitled",
      emoji: moodEmoji(p.mood),
      playlistId: p.id,
      songs: p.songIds.flatMap((sid) => byId.get(sid) ?? []),
    })),
  ];
  const active = id ? tabs.findIndex((t) => t.id === id) : 0;

  const go = (i: number) => navigate(i === 0 ? "/" : `/p/${tabs[i].id}`, { replace: true });

  // route -> pager position (instant on first paint, smooth after)
  useEffect(() => {
    const el = pagerRef.current;
    if (!el || active < 0) return;
    const left = active * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) > 2) {
      el.scrollTo({ left, behavior: firstScroll.current ? "instant" : "smooth" });
    }
    firstScroll.current = false;
  }, [active]);

  // active tab sits near the left edge, the previous one peeks in (tap it to go back)
  useEffect(() => {
    const strip = tabsRef.current;
    const tab = strip?.children[active] as HTMLElement | undefined;
    if (strip && tab) strip.scrollTo({ left: tab.offsetLeft - 56, behavior: "smooth" });
  }, [active, tabs.length]);

  // window resized / rotated: snap back onto the current page
  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      el.scrollTo({ left: Math.max(0, active) * el.clientWidth, behavior: "instant" });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [active]);

  // pager position -> route, once the swipe has settled
  const settle = useRef(0);
  const onScroll = () => {
    clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = pagerRef.current;
      if (!el) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (i !== active && tabs[i]) go(i);
    }, 90);
  };

  if (active < 0) {
    return (
      <div className="page-container page-center">
        <h1 className="page-title">Playlist not found</h1>
        <p className="page-text">It may have been deleted.</p>
        <Link to="/" className="page-button">All songs</Link>
      </div>
    );
  }

  return (
    <div className="library">
      <header className="lib-head">
        <div className="lib-tabs" ref={tabsRef} role="tablist">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`lib-tab ${i === active ? "is-active" : ""}`}
              onClick={() => go(i)}
            >
              {t.emoji && <span className="lib-tab-emoji">{t.emoji}</span>}
              {t.label}
            </button>
          ))}
          <button
            type="button"
            className="lib-tab lib-tab-new"
            onClick={() => navigate(`/moods?new=${playlistActions.create()}`)}
            aria-label="New playlist"
          >
            <FiPlus />
          </button>
        </div>
        <Link to="/search" className="icon-btn" aria-label="Search">
          <FiSearch />
        </Link>
      </header>

      <div className="pager" ref={pagerRef} onScroll={onScroll}>
        {tabs.map((t, i) => (
          <section key={t.id} className="pager-page" aria-hidden={i !== active} inert={i !== active}>
            {/* only the visible tab and its neighbours are rendered */}
            {Math.abs(i - active) <= 1 && <TabPage tab={t} loading={loading} error={error} />}
          </section>
        ))}
      </div>
    </div>
  );
}
