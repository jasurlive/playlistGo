import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { FiChevronRight, FiPlus, FiTrash2 } from "react-icons/fi";
import "../css/library.css";
import type { MoodKey } from "../lib/types";
import { MOODS, moodEmoji } from "../lib/moods";
import { playlistActions, usePlaylists } from "../hooks/LOCAL/usePlaylists";

function MoodPicker({ value, onPick }: { value: MoodKey; onPick: (m: MoodKey) => void }) {
  return (
    <div className="moods" role="radiogroup" aria-label="Mood">
      {MOODS.map((m) => (
        <button
          key={m.key}
          type="button"
          role="radio"
          aria-checked={m.key === value}
          className={`chip ${m.key === value ? "is-on" : ""}`}
          onClick={() => onPick(m.key)}
        >
          <span>{m.emoji}</span> {m.label}
        </button>
      ))}
    </div>
  );
}

// every playlist is a mood tab in the library: rename, change mood, delete, create
export default function Moods() {
  const playlists = usePlaylists();
  const [params] = useSearchParams();
  const fresh = params.get("new"); // just created from the library "+" tab
  const [open, setOpen] = useState<string | null>(fresh);
  const [name, setName] = useState("");
  const [mood, setMood] = useState<MoodKey>("chill");

  const remove = (id: string, label: string) => {
    if (confirm(`Delete “${label}”? The songs stay in your library.`)) playlistActions.remove(id);
  };

  return (
    <div className="page-pad">
      <h1 className="page-h1">Moods</h1>
      <p className="page-text">Each playlist is a tab in your library. Tap the emoji to change its mood.</p>

      <ul className="mood-list">
        {playlists.map((p) => (
          <li key={p.id} className="mood-card">
            <div className="mood-row">
              <button
                type="button"
                className="mood-emoji"
                onClick={() => setOpen(open === p.id ? null : p.id)}
                aria-expanded={open === p.id}
                aria-label="Change mood"
              >
                {moodEmoji(p.mood)}
              </button>
              <div className="mood-text">
                {/* rename in place: saved to localStorage as you type */}
                <input
                  className="mood-name"
                  defaultValue={p.name}
                  autoFocus={p.id === fresh}
                  onFocus={(e) => p.id === fresh && e.target.select()}
                  onChange={(e) => playlistActions.rename(p.id, e.target.value)}
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      e.target.value = "Untitled";
                      playlistActions.rename(p.id, "Untitled");
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  maxLength={40}
                  enterKeyHint="done"
                  aria-label="Playlist name"
                />
                <span className="mood-count">
                  {p.songIds.length} {p.songIds.length === 1 ? "song" : "songs"}
                </span>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => remove(p.id, p.name || "Untitled")}
                aria-label={`Delete ${p.name}`}
              >
                <FiTrash2 />
              </button>
              <Link to={`/p/${p.id}`} className="icon-btn" aria-label={`Open ${p.name}`}>
                <FiChevronRight />
              </Link>
            </div>
            {open === p.id && <MoodPicker value={p.mood} onPick={(m) => playlistActions.setMood(p.id, m)} />}
          </li>
        ))}
      </ul>

      <h2 className="page-subtitle">New mood playlist</h2>
      <form
        className="mood-new"
        onSubmit={(e) => {
          e.preventDefault();
          playlistActions.create(name.trim() || MOODS.find((m) => m.key === mood)!.label, mood);
          setName("");
        }}
      >
        <MoodPicker value={mood} onPick={setMood} />
        <div className="mood-new-row">
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Name (default: ${MOODS.find((m) => m.key === mood)!.label})`}
            maxLength={40}
            enterKeyHint="done"
          />
          <button type="submit" className="btn btn-accent">
            <FiPlus /> Create
          </button>
        </div>
      </form>
    </div>
  );
}
