import type { ReactNode } from "react";
import { FiMoreVertical } from "react-icons/fi";
import type { Song } from "../lib/types";
import { thumbnail } from "../lib/youtube";
import { useLongPress } from "../hooks/LOCAL/useLongPress";

type Props = {
  song: Song;
  active: boolean;
  playing: boolean;
  onPlay: () => void;
  onMore: () => void; // ⋮, long press, right click
  trailing?: ReactNode; // replaces the ⋮ button
};

export default function SongRow({ song, active, playing, onPlay, onMore, trailing }: Props) {
  const press = useLongPress(onMore);

  return (
    <li className={`song ${active ? "is-active" : ""}`}>
      <button type="button" className="song-main" onClick={onPlay} {...press}>
        <span className="song-thumb">
          <img src={thumbnail(song.id)} alt="" loading="lazy" decoding="async" draggable={false} />
          {active && (
            <span className={`eq ${playing ? "is-playing" : ""}`} aria-hidden>
              <i />
              <i />
              <i />
            </span>
          )}
        </span>
        <span className="song-text">
          <span className="song-title">{song.title}</span>
          <span className="song-artist">{song.artist || "YouTube"}</span>
        </span>
      </button>
      {trailing ?? (
        <button type="button" className="icon-btn song-more" onClick={onMore} aria-label={`More for ${song.title}`}>
          <FiMoreVertical />
        </button>
      )}
    </li>
  );
}
