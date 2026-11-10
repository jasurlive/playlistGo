import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import type { Song } from "../lib/types";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import SongRow from "./SongRow";
import SongActions from "./SongActions";
import "../css/list.css";

// what plays next; tap jumps, x removes
export default function QueueList({ scrollToCurrent = true }: { scrollToCurrent?: boolean }) {
  const player = usePlayer();
  const [menuSong, setMenuSong] = useState<Song | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!scrollToCurrent) return;
    // scroll only the list's own box (scrollIntoView would also shift the player around it)
    const list = listRef.current;
    const row = list?.querySelector(".song.is-active");
    const box = list?.closest(".fp-queue-list, .app-main");
    if (!row || !box) return;
    const r = row.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    box.scrollTop += r.top - b.top - box.clientHeight / 2 + r.height / 2;
  }, [scrollToCurrent, player.index]);

  if (player.queue.length === 0) return <p className="list-empty">The queue is empty. Play something!</p>;

  return (
    <>
      <ol className="songs" ref={listRef}>
        {player.queue.map((song, i) => (
          <SongRow
            key={`${i}-${song.id}`}
            song={song}
            active={i === player.index}
            playing={player.playing}
            onPlay={() => player.playAt(i)}
            onMore={() => setMenuSong(song)}
            trailing={
              i === player.index ? (
                <span className="song-pos">{i + 1}</span>
              ) : (
                <button
                  type="button"
                  className="icon-btn song-more"
                  onClick={() => player.removeFromQueue(i)}
                  aria-label={`Remove ${song.title} from queue`}
                >
                  <FiX />
                </button>
              )
            }
          />
        ))}
      </ol>
      {menuSong && <SongActions song={menuSong} onClose={() => setMenuSong(null)} />}
    </>
  );
}
