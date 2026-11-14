import { useState, type ReactNode } from "react";
import type { Song } from "../lib/types";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import { useDragReorder } from "../hooks/LOCAL/useDragReorder";
import DragHandle from "./DragHandle";
import SongRow from "./SongRow";
import SongActions from "./SongActions";
import "../css/list.css";

type Props = {
  songs: Song[];
  source: string; // 'all', 'search' or a playlist id, so the queue knows where it came from
  playlistId?: string;
  empty?: ReactNode;
  onReorder?: (from: number, to: number) => void; // shows a drag handle on every row
};

// tap = play this list from here, ⋮ / long press = actions, grip (when reorderable) = drag to reorder
export default function SongList({ songs, source, playlistId, empty, onReorder }: Props) {
  const player = usePlayer();
  const [menuSong, setMenuSong] = useState<Song | null>(null);
  const { listRef, handleProps } = useDragReorder({
    count: songs.length,
    onMove: (from, to) => onReorder?.(from, to),
  });

  if (songs.length === 0) return <>{empty}</>;

  return (
    <>
      <ol className="songs" ref={listRef}>
        {songs.map((song, i) => (
          <SongRow
            key={song.id}
            song={song}
            active={player.current?.id === song.id}
            playing={player.playing}
            onPlay={() => player.play(songs, i, source)}
            onMore={() => setMenuSong(song)}
            handle={onReorder && songs.length > 1 ? <DragHandle title={song.title} {...handleProps(i)} /> : undefined}
          />
        ))}
      </ol>
      {menuSong && <SongActions song={menuSong} playlistId={playlistId} onClose={() => setMenuSong(null)} />}
    </>
  );
}
