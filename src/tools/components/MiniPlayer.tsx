import { FiPause, FiPlay, FiSkipForward } from "react-icons/fi";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import { useProgress } from "../hooks/LOCAL/useProgress";
import { useSwipe } from "../hooks/LOCAL/useSwipe";
import { thumbnail } from "../lib/youtube";

// strip above the bottom navbar: tap or swipe up = full player, swipe sideways = next / prev
export default function MiniPlayer() {
  const player = usePlayer();
  const { current, playing, expanded } = player;
  const { time, duration } = useProgress(!!current && !expanded);
  const swipe = useSwipe({
    onLeft: player.next,
    onRight: player.prev,
    onUp: () => player.setExpanded(true),
  });

  if (!current) return <div className="mini mini-empty" />;

  return (
    <div className="mini" {...swipe}>
      <div className="mini-progress" style={{ transform: `scaleX(${duration ? time / duration : 0})` }} />
      <button
        type="button"
        className="mini-open"
        onClick={() => player.setExpanded(true)}
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
