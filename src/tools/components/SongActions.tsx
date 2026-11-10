import { useState } from "react";
import {
  FiCornerDownRight,
  FiExternalLink,
  FiHeart,
  FiPlusCircle,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import type { Song } from "../lib/types";
import { thumbnail, watchUrl } from "../lib/youtube";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import { useLibrary } from "../hooks/LOCAL/useLibrary";
import { playlistActions, usePlaylists } from "../hooks/LOCAL/usePlaylists";
import { savedActions } from "../hooks/LOCAL/useSavedSongs";
import Sheet from "./Sheet";
import PlaylistSheet from "./PlaylistSheet";

type Props = {
  song: Song;
  playlistId?: string; // opened from inside a playlist -> offer "remove from"
  onClose: () => void;
};

// the ⋮ / long-press menu for one song
export default function SongActions({ song, playlistId, onClose }: Props) {
  const player = usePlayer();
  const library = useLibrary();
  const playlists = usePlaylists();
  const [picking, setPicking] = useState(false);

  if (picking) return <PlaylistSheet song={song} onClose={onClose} />;

  const playlist = playlists.find((p) => p.id === playlistId);
  const run = (action: () => void) => () => {
    action();
    onClose();
  };

  return (
    <Sheet
      label="Song actions"
      onClose={onClose}
      header={
        <header className="sheet-head">
          <img className="sheet-thumb" src={thumbnail(song.id)} alt="" draggable={false} />
          <div className="sheet-song">
            <p className="sheet-title">{song.title}</p>
            <p className="sheet-sub">{song.artist || "YouTube"}</p>
          </div>
        </header>
      }
    >
      <ul className="actions">
        <li>
          <button type="button" className="action" onClick={run(() => player.playNext(song))}>
            <FiCornerDownRight /> Play next
          </button>
        </li>
        <li>
          <button type="button" className="action" onClick={run(() => player.addToQueue(song))}>
            <FiPlusCircle /> Add to queue
          </button>
        </li>
        <li>
          <button type="button" className="action" onClick={() => setPicking(true)}>
            <FiPlus /> Add to playlist…
          </button>
        </li>
        {!library.inLibrary(song.id) && (
          <li>
            <button type="button" className="action" onClick={run(() => savedActions.save(song))}>
              <FiHeart /> Save to library
            </button>
          </li>
        )}
        {playlist && (
          <li>
            <button
              type="button"
              className="action"
              onClick={run(() => playlistActions.toggleSong(playlist.id, song.id))}
            >
              <FiX /> Remove from {playlist.name || "playlist"}
            </button>
          </li>
        )}
        {library.isSaved(song.id) && (
          <li>
            <button
              type="button"
              className="action action-danger"
              onClick={run(() => {
                savedActions.remove(song.id);
                playlistActions.removeSongEverywhere(song.id);
              })}
            >
              <FiTrash2 /> Remove from library
            </button>
          </li>
        )}
        <li>
          <a className="action" href={watchUrl(song.id)} target="_blank" rel="noreferrer" onClick={onClose}>
            <FiExternalLink /> Open on YouTube
          </a>
        </li>
      </ul>
    </Sheet>
  );
}
