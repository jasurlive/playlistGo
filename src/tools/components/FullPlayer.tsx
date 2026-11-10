import { useRef, useState, type CSSProperties } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiMoreVertical,
  FiPause,
  FiPlay,
  FiRepeat,
  FiShuffle,
  FiSkipBack,
  FiSkipForward,
} from "react-icons/fi";
import { useNavigate } from "react-router";
import "../css/player.css";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import { usePlaylists } from "../hooks/LOCAL/usePlaylists";
import { useProgress } from "../hooks/LOCAL/useProgress";
import { useShortcuts } from "../hooks/LOCAL/useShortcuts";
import { useDragDismiss } from "../hooks/LOCAL/useDragDismiss";
import { bigThumbnail } from "../lib/youtube";
import { formatTime } from "../lib/format";
import { sourceLabel } from "../lib/sources";
import QueueList from "./QueueList";
import SongActions from "./SongActions";
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
  const [menu, setMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = () => {
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
    escape: () => expanded && (queueOpen ? setQueueOpen(false) : close()),
  });

  const upNext = queue[index + 1];

  return (
    <div
      ref={panelRef}
      className={`fp ${expanded ? "is-open" : ""}`}
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
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMenu(true)}
          disabled={!current}
          aria-label="Song actions"
        >
          <FiMoreVertical />
        </button>
      </header>

      <div className="fp-video">
        <div className="fp-host" ref={setHost} />
      </div>

      <div className="fp-main" {...panelDrag}>
        <Progress live={expanded} />

        <div className="fp-info">
          <p className="fp-title">{current?.title ?? "Nothing playing"}</p>
          <p className="fp-artist">{player.error ?? (current?.artist || "YouTube")}</p>
        </div>

        <div className="fp-controls">
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
        </div>

        <p className="fp-count">{queue.length ? `${index + 1}/${queue.length}` : ""}</p>

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

      {menu && current && <SongActions song={current} onClose={() => setMenu(false)} />}
      {saving && <PlaylistSheet songs={queue} onClose={() => setSaving(false)} />}
    </div>
  );
}
