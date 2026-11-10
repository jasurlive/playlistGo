import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiMaximize,
  FiMinimize,
  FiMonitor,
  FiPause,
  FiPlay,
  FiRepeat,
  FiShuffle,
  FiSkipBack,
  FiSkipForward,
} from "react-icons/fi";
import { MdFullscreenExit } from "react-icons/md";
import { useNavigate } from "react-router";
import "../css/player.css";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import { usePlaylists } from "../hooks/LOCAL/usePlaylists";
import { useProgress } from "../hooks/LOCAL/useProgress";
import { useShortcuts } from "../hooks/LOCAL/useShortcuts";
import { useDragDismiss } from "../hooks/LOCAL/useDragDismiss";
import { enterFullscreen, exitFullscreen, useFullscreen } from "../hooks/LOCAL/useFullscreen";
import { bigThumbnail } from "../lib/youtube";
import { formatTime } from "../lib/format";
import { sourceLabel } from "../lib/sources";
import QueueList from "./QueueList";
import PlaylistSheet from "./PlaylistSheet";

function Progress({ live }: { live: boolean }) {
  const player = usePlayer();
  const { time, duration } = useProgress(live);
  const [scrub, setScrub] = useState<number | null>(null);
  const dragging = useRef(false);
  const value = scrub ?? time;

  const commit = () => {
    dragging.current = false;
    if (scrub !== null) player.seek(scrub);
    setScrub(null);
  };

  return (
    <div className="fp-progress" data-no-drag>
      <input
        type="range"
        className="seek"
        min={0}
        max={Math.max(1, Math.floor(duration))}
        step={1}
        value={Math.floor(value)}
        style={{ "--pct": `${duration ? (value / duration) * 100 : 0}%` } as CSSProperties}
        onPointerDown={() => (dragging.current = true)}
        onPointerUp={commit}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (dragging.current) setScrub(v);
          else player.seek(v); // keyboard arrows
        }}
        aria-label="Seek"
        disabled={!duration}
      />
      <div className="fp-times">
        <span>{formatTime(value)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

// full screen "now playing": video, seek bar, controls, swipe-up play queue
// always mounted (just slid off screen) because the youtube iframe lives here
export default function FullPlayer() {
  const player = usePlayer();
  const playlists = usePlaylists();
  const navigate = useNavigate();
  const { current, playing, shuffle, repeat, expanded, queue, index } = player;
  const [queueOpen, setQueueOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // laptop: left toggle = whole website fullscreen, right toggle = video fills the screen.
  // video mode is just css on the same box: the iframe is never moved or reloaded,
  // so the next song plays in place and the mode survives song changes
  const page = useFullscreen();
  const [videoFull, setVideoFull] = useState(false);
  const ownFullscreen = useRef(false); // we turned on browser fullscreen for video mode, so we turn it off too
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef(0);

  // video mode: controls + cursor hide after a moment without mouse movement
  const wake = () => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), 2500);
  };
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  const enterVideo = () => {
    setVideoFull(true);
    wake();
    const lockLandscape = () => {
      // phones: turn sideways when the browser allows it (android while fullscreen; iphone can't)
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      if (matchMedia("(pointer: coarse)").matches) orientation.lock?.("landscape").catch(() => {});
    };
    if (!document.fullscreenElement) {
      ownFullscreen.current = true;
      enterFullscreen().then(lockLandscape);
    } else lockLandscape();
  };
  const exitVideo = () => {
    setVideoFull(false);
    try {
      screen.orientation.unlock();
    } catch {
      // never locked / not supported
    }
    if (ownFullscreen.current) {
      ownFullscreen.current = false;
      exitFullscreen();
    }
  };
  const toggleVideo = () => (videoFull ? exitVideo() : enterVideo());

  // browser fullscreen left (Esc / F11) while in video mode: leave video mode too
  useEffect(() => {
    if (!videoFull) return;
    const onChange = () => {
      if (!document.fullscreenElement && ownFullscreen.current) {
        ownFullscreen.current = false;
        setVideoFull(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [videoFull]);

  const close = () => {
    if (videoFull) exitVideo();
    setQueueOpen(false);
    player.setExpanded(false);
  };
  const { ref: panelRef, handlers: panelDrag } = useDragDismiss<HTMLDivElement>({
    onDismiss: close,
    onLeft: player.next,
    onRight: player.prev,
    onUp: () => setQueueOpen(true),
  });
  const { ref: queueRef, handlers: queueDrag } = useDragDismiss<HTMLElement>({
    onDismiss: () => setQueueOpen(false),
  });
  const { setHost } = player;

  useShortcuts({
    k: player.toggle,
    "5": player.toggle,
    "4": player.prev,
    "6": player.next,
    n: player.next,
    p: player.prev,
    s: player.toggleShuffle,
    r: player.cycleRepeat,
    "/": () => navigate("/search"),
    escape: () => {
      if (videoFull) exitVideo();
      else if (expanded && queueOpen) setQueueOpen(false);
      else if (expanded) close();
    },
    f: () => expanded && current && toggleVideo(),
    // space: open the full player / minimize it back to the mini player
    // (skipped while typing, see useShortcuts, and while a sheet / dialog is open)
    " ": () => {
      if (document.querySelector(".sheet")) return;
      if (videoFull) exitVideo(); // first step down: video mode -> full player
      else if (expanded) close();
      else if (current) player.setExpanded(true);
    },
  });

  const upNext = queue[index + 1];

  return (
    <div
      ref={panelRef}
      className={`fp ${expanded ? "is-open" : ""} ${videoFull ? "is-video-full" : ""}`}
      aria-hidden={!expanded}
      inert={!expanded}
      role="dialog"
      aria-label="Now playing"
    >
      {current && (
        <div className="fp-bg" style={{ backgroundImage: `url(${bigThumbnail(current.id)})` }} />
      )}

      <header className="fp-top" {...panelDrag}>
        <button type="button" className="icon-btn" onClick={close} aria-label="Close player">
          <FiChevronDown />
        </button>
        <div className="fp-from">
          <span>Playing from</span>
          <b>{sourceLabel(player.source, playlists)}</b>
        </div>
        {/* song actions live in the lists (hold / right click), this just keeps the title centered */}
        <span className="fp-top-spacer" aria-hidden="true" />
      </header>

      <div
        className={`fp-video ${videoFull && idle ? "is-idle" : ""}`}
        onMouseMove={videoFull ? wake : undefined}
        onPointerDown={videoFull ? wake : undefined}
      >
        <div className="fp-host" ref={setHost} />
        {/* swallows every touch / click on the video: only our own controls drive the player */}
        <div className="fp-video-shield" aria-hidden="true" onDoubleClick={videoFull ? exitVideo : undefined} />
        {videoFull && (
          <div className="fp-video-bar">
            <span className="fp-video-title">{current?.title}</span>
            <button type="button" className="ctl" onClick={player.prev} title="Previous (4)" aria-label="Previous">
              <FiSkipBack />
            </button>
            <button
              type="button"
              className="ctl ctl-main"
              onClick={player.toggle}
              aria-label={playing ? "Pause" : "Play"}
              title="Play / pause (K)"
            >
              {playing ? <FiPause /> : <FiPlay />}
            </button>
            <button type="button" className="ctl" onClick={player.next} title="Next (6)" aria-label="Next">
              <FiSkipForward />
            </button>
            <button
              type="button"
              className="ctl ctl-small"
              onClick={exitVideo}
              title="Exit video full screen (F / Esc)"
              aria-label="Exit video full screen"
            >
              <MdFullscreenExit />
            </button>
          </div>
        )}
      </div>

      <div className="fp-main" {...panelDrag}>
        <Progress live={expanded} />

        <div className="fp-info">
          <p className="fp-title">{current?.title ?? "Nothing playing"}</p>
          <p className="fp-artist">{player.error ?? (current?.artist || "YouTube")}</p>
        </div>

        <div className="fp-controls">
          {page.supported && (
            <button
              type="button"
              className="ctl ctl-small fp-desktop-only"
              onClick={page.toggleFullscreen}
              title={page.isFullscreen ? "Exit full screen" : "Full screen website"}
              aria-label={page.isFullscreen ? "Exit full screen" : "Full screen website"}
            >
              {page.isFullscreen ? <FiMinimize /> : <FiMaximize />}
            </button>
          )}
          <button
            type="button"
            className={`ctl ctl-small ${repeat !== "off" ? "is-on" : ""}`}
            onClick={player.cycleRepeat}
            title={`Repeat: ${repeat} (R)`}
            aria-label={`Repeat ${repeat}`}
          >
            <FiRepeat />
            {repeat === "one" && <span className="ctl-badge">1</span>}
          </button>
          <button type="button" className="ctl" onClick={player.prev} disabled={!current} title="Previous (4)">
            <FiSkipBack />
          </button>
          <button
            type="button"
            className="ctl ctl-main"
            onClick={player.toggle}
            disabled={!current}
            aria-label={playing ? "Pause" : "Play"}
            title="Play / pause (K)"
          >
            {playing ? <FiPause /> : <FiPlay />}
          </button>
          <button type="button" className="ctl" onClick={player.next} disabled={!current} title="Next (6)">
            <FiSkipForward />
          </button>
          <button
            type="button"
            className={`ctl ctl-small ${shuffle ? "is-on" : ""}`}
            onClick={player.toggleShuffle}
            aria-pressed={shuffle}
            title="Shuffle (S)"
          >
            <FiShuffle />
          </button>
          <button
            type="button"
            className="ctl ctl-small fp-desktop-only"
            onClick={toggleVideo}
            disabled={!current}
            title="Full screen video (F)"
            aria-label="Full screen video"
          >
            <FiMonitor />
          </button>
        </div>

        {/* phones: the full screen toggles sit on both sides of the song counter */}
        <div className="fp-count-row">
          {page.supported ? (
            <button
              type="button"
              className="icon-btn fp-mobile-only"
              onClick={page.toggleFullscreen}
              aria-label={page.isFullscreen ? "Exit full screen" : "Full screen app"}
            >
              {page.isFullscreen ? <FiMinimize /> : <FiMaximize />}
            </button>
          ) : (
            <span />
          )}
          <p className="fp-count">{queue.length ? `${index + 1}/${queue.length}` : ""}</p>
          <button
            type="button"
            className="icon-btn fp-mobile-only"
            onClick={toggleVideo}
            disabled={!current}
            aria-label="Full screen video"
          >
            <FiMonitor />
          </button>
        </div>

        <div className="fp-bottom">
          <span />
          <button type="button" className="fp-upnext" onClick={() => setQueueOpen(true)}>
            <FiChevronUp />
            <span>{upNext ? `Up next · ${upNext.title}` : "Play queue"}</span>
          </button>
          <span className="fp-spacer" />
        </div>
      </div>

      <section ref={queueRef} className={`fp-queue ${queueOpen ? "is-open" : ""}`} inert={!queueOpen}>
        <div className="fp-queue-head" {...queueDrag}>
          <div className="sheet-grip">
            <span />
          </div>
          <p className="fp-queue-title">Play queue</p>
          <div className="fp-queue-actions">
            <button type="button" className={`btn btn-ghost ${shuffle ? "is-on" : ""}`} onClick={player.toggleShuffle}>
              <FiShuffle /> Shuffle {shuffle ? "on" : "off"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setSaving(true)} disabled={!queue.length}>
              Save as playlist
            </button>
          </div>
        </div>
        <div className="fp-queue-list">{queueOpen && <QueueList />}</div>
      </section>

      {saving && <PlaylistSheet songs={queue} onClose={() => setSaving(false)} />}
    </div>
  );
}
