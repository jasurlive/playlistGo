import { useEffect, useState } from "react";
import { FiPause, FiPlay, FiSkipForward } from "react-icons/fi";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import { useProgress } from "../hooks/LOCAL/useProgress";
import { useSwipe } from "../hooks/LOCAL/useSwipe";
import { thumbnail } from "../lib/youtube";
import { isEmbed } from "../lib/embed";

// /myplayer iframed as just the controls: the parent site posts
// { type: "playlistgo:mini", mini: true | false } to switch, and gets { type: "playlistgo:open" } on a tap
function useMiniMode() {
  const [mini, setMini] = useState(false);
  useEffect(() => {
    if (!isEmbed) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent || e.data?.type !== "playlistgo:mini") return;
      setMini(!!e.data.mini);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("pg-mini", mini); // player.css hides the page around us
  }, [mini]);
  return mini;
}

// strip above the bottom navbar: tap or swipe up = full player, swipe sideways = next / prev
export default function MiniPlayer() {
  const player = usePlayer();
  const { current, playing, expanded, setExpanded } = player;
  const mini = useMiniMode();
  // the full player can't fit a strip-sized iframe: close it, and let the parent grow the iframe instead
  useEffect(() => {
    if (mini && expanded) setExpanded(false); // also catches the auto-open on the first play
  }, [mini, expanded, setExpanded]);
  const open = () => (mini ? window.parent.postMessage({ type: "playlistgo:open" }, "*") : setExpanded(true));
  const { time, duration } = useProgress(!!current && !expanded);
  const swipe = useSwipe({
    onLeft: player.next,
    onRight: player.prev,
    onUp: open,
  });

  if (!current) {
    return mini ? <div className="mini mini-placeholder">Nothing playing</div> : <div className="mini mini-empty" />;
  }

  return (
    <div className="mini" {...swipe}>
      <div className="mini-progress" style={{ transform: `scaleX(${duration ? time / duration : 0})` }} />
      <button
        type="button"
        className="mini-open"
        onClick={open}
        aria-label="Open player"
      >
        <img className="mini-thumb" src={thumbnail(current.id)} alt="" draggable={false} />
        <span className="mini-text">
          <span className="mini-title">{current.title}</span>
          <span className="mini-artist">{player.error ?? (current.artist || "YouTube")}</span>
        </span>
      </button>
      <button
        type="button"
        className="ctl"
        onClick={player.toggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <FiPause /> : <FiPlay />}
      </button>
      <button type="button" className="ctl ctl-small mini-next" onClick={player.next} aria-label="Next">
        <FiSkipForward />
      </button>
    </div>
  );
}
