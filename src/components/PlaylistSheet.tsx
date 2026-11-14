import { useState } from "react";
import { FiCheck, FiPlus } from "react-icons/fi";
import type { Song } from "../lib/types";
import { moodEmoji } from "../lib/moods";
import { playlistActions, usePlaylists } from "../hooks/LOCAL/usePlaylists";
import { savedActions } from "../hooks/LOCAL/useSavedSongs";
import { useLibrary } from "../hooks/LOCAL/useLibrary";
import Sheet from "./Sheet";

// tick the mood playlists a song belongs to (or make a new one)
// `songs` instead of `song`: save a whole queue as a playlist
export default function PlaylistSheet({
  song,
  songs,
  onClose,
}: {
  song?: Song;
  songs?: Song[];
  onClose: () => void;
}) {
  const playlists = usePlaylists();
  const library = useLibrary();
  const [name, setName] = useState("");
  const list = songs ?? (song ? [song] : []);

  // youtube results have to be in the library before a playlist can point at them
  const keep = () => list.forEach((s) => !library.inLibrary(s.id) && savedActions.save(s));
  const ids = list.map((s) => s.id);

  const create = () => {
    keep();
    playlistActions.create(name.trim() || "New playlist", "chill", ids);
    setName("");
    if (songs) onClose();
  };

  return (
    <Sheet
      label="Add to playlist"
      onClose={onClose}
      header={
        <header className="sheet-head">
          <div className="sheet-song">
            <p className="sheet-title">{songs ? "Save queue as playlist" : "Add to playlist"}</p>
            <p className="sheet-sub">
              {songs ? `${songs.length} songs` : song && [song.artist, song.title].filter(Boolean).join(" - ")}
            </p>
          </div>
        </header>
      }
    >
      <ul className="sheet-list">
        {playlists.map((p) => {
          const has = ids.every((id) => p.songIds.includes(id));
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`sheet-row ${has ? "is-on" : ""}`}
                aria-pressed={has}
                onClick={() => {
                  keep();
                  if (songs) {
                    playlistActions.addSongs(p.id, ids);
                    onClose();
                  } else playlistActions.toggleSong(p.id, ids[0]);
                }}
              >
                <span className="sheet-emoji">{moodEmoji(p.mood)}</span>
                <span className="sheet-name">{p.name || "Untitled"}</span>
                <span className="sheet-count">{p.songIds.length}</span>
                <span className="sheet-check">{has && <FiCheck />}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <form
        className="sheet-new"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New playlist name"
          enterKeyHint="done"
          maxLength={40}
        />
        <button type="submit" className="btn btn-accent">
          <FiPlus /> Create
        </button>
      </form>
    </Sheet>
  );
}
