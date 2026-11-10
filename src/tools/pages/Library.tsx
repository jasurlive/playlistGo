import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
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

  // title strip follows the pager frame by frame (not after the swipe settles), so both move together:
  // the strip slides between tab positions and each title fades by how close its page is
  const tabCount = tabs.length;
  const syncTabs = useCallback(() => {
    const pager = pagerRef.current;
    const strip = tabsRef.current;
    if (!pager || !strip || !pager.clientWidth) return;
    const progress = Math.min(Math.max(pager.scrollLeft / pager.clientWidth, 0), tabCount - 1);
    const i = Math.floor(progress);
    const f = progress - i;
    const items = strip.children as HTMLCollectionOf<HTMLElement>;
    const from = items[i];
    const to = items[Math.min(i + 1, tabCount - 1)];
    if (!from || !to) return;
    // active tab sits near the left edge, the previous one peeks in (tap it to go back)
    strip.scrollLeft = from.offsetLeft + (to.offsetLeft - from.offsetLeft) * f - 56;
    for (let j = 0; j < tabCount; j++) {
      items[j]?.style.setProperty("--on", String(Math.max(0, 1 - Math.abs(progress - j))));
    }
  }, [tabCount]);

  // route -> pager position (instant on first paint, smooth after); the strip follows via onScroll
  useLayoutEffect(() => {
    const el = pagerRef.current;
    if (!el || active < 0) return;
    const left = active * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) > 2) {
      el.scrollTo({ left, behavior: firstScroll.current ? "instant" : "smooth" });
    }
    firstScroll.current = false;
    syncTabs();
  }, [active, syncTabs]);

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
    syncTabs();
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
              // --on (0..1) is updated live while swiping, see syncTabs
              style={{ "--on": i === active ? 1 : 0 } as CSSProperties}
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
