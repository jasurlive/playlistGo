import { useState } from "react";
import { FiSave, FiShuffle } from "react-icons/fi";
import "../css/library.css";
import { usePlayer } from "../hooks/LOCAL/usePlayer";
import { usePlaylists } from "../hooks/LOCAL/usePlaylists";
import { sourceLabel } from "../lib/sources";
import QueueList from "../components/QueueList";
import PlaylistSheet from "../components/PlaylistSheet";
import BackButton from "../shared/BackButton";

export default function Queue() {
  const player = usePlayer();
  const playlists = usePlaylists();
  const [saving, setSaving] = useState(false);

  return (
    <div className="page-pad">
      <div className="page-head">
        <BackButton />
        <h1 className="page-h1">Queue</h1>
      </div>
      <p className="page-text">
        {player.queue.length
          ? `${player.index + 1}/${player.queue.length} · from ${sourceLabel(player.source, playlists)}`
          : "Nothing queued"}
      </p>
      <div className="queue-actions">
        <button type="button" className={`btn ${player.shuffle ? "btn-on" : ""}`} onClick={player.toggleShuffle}>
          <FiShuffle /> Shuffle {player.shuffle ? "on" : "off"}
        </button>
        <button type="button" className="btn" onClick={() => setSaving(true)} disabled={!player.queue.length}>
          <FiSave /> Save as playlist
        </button>
      </div>
      <QueueList />
      {saving && <PlaylistSheet songs={player.queue} onClose={() => setSaving(false)} />}
    </div>
  );
}
