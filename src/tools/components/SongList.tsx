import { useState, type ReactNode } from "react";
import type { Song } from "../lib/types";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import SongRow from "./SongRow";
import SongActions from "./SongActions";
import "../css/list.css";

type Props = {
  songs: Song[];
  source: string; // 'all', 'search' or a playlist id, so the queue knows where it came from
  playlistId?: string;
  empty?: ReactNode;
};

// tap = play this list from here, ⋮ / long press = actions
export default function SongList({ songs, source, playlistId, empty }: Props) {
  const player = usePlayer();
  const [menuSong, setMenuSong] = useState<Song | null>(null);

  if (songs.length === 0) return <>{empty}</>;

  return (
    <>
      <ol className="songs">
        {songs.map((song, i) => (
          <SongRow
            key={song.id}
            song={song}
            active={player.current?.id === song.id}
            playing={player.playing}
            onPlay={() => player.play(songs, i, source)}
            onMore={() => setMenuSong(song)}
          />
        ))}
      </ol>
      {menuSong && <SongActions song={menuSong} playlistId={playlistId} onClose={() => setMenuSong(null)} />}
    </>
  );
}
