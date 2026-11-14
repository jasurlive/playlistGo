import { FiMaximize, FiMinimize } from "react-icons/fi";
import { useTheme } from "../hooks/LOCAL/useTheme";
import { useFullscreen } from "../hooks/LOCAL/useFullscreen";
import { confirmDialog } from "../lib/confirm";
import { playlistActions } from "../hooks/LOCAL/usePlaylists";
import { THEME_LABELS } from "../lib/themes";
import { THEME_ICONS } from "../shared/ThemeIcons";
import BackButton from "../shared/BackButton";

const SHORTCUTS: [string, string][] = [
  ["K / 5", "Play / pause"],
  ["6 / N", "Next song"],
  ["4 / P", "Previous song"],
  ["Shift + S", "Shuffle on / off"],
  ["R", "Repeat: all → one → off"],
  ["S or /", "Focus search"],
  ["Space", "Open / minimize the player"],
  ["F", "Video full screen (laptop)"],
  ["Esc", "Close the player, or go back"],
  ["Ctrl + J", "Next theme"],
  ["`", "Collapse / expand the sidebar"],
];

export default function Settings() {
  const { theme, setTheme, themes } = useTheme();
  const { supported, isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <div className="page-pad">
      <div className="page-head">
        <BackButton />
        <h1 className="page-h1">Settings</h1>
      </div>

      <h2 className="page-subtitle">Theme</h2>
      <div className="theme-picker" role="radiogroup" aria-label="Theme">
        {themes.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={t === theme}
            className={`page-button theme-option ${t === theme ? "is-active" : ""}`}
            onClick={() => setTheme(t)}
          >
            {THEME_ICONS[t]}
            {THEME_LABELS[t]}
          </button>
        ))}
      </div>

      {supported && (
        <>
          <h2 className="page-subtitle">Display</h2>
          <div className="theme-picker">
            <button
              type="button"
              aria-pressed={isFullscreen}
              className={`page-button theme-option ${isFullscreen ? "is-active" : ""}`}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <FiMinimize /> : <FiMaximize />}
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </button>
          </div>
        </>
      )}

      <h2 className="page-subtitle">Touch</h2>
      <ul className="page-text touch-list">
        <li>Swipe the library list sideways to switch between playlist tabs.</li>
        <li>Mini player: tap or swipe up to open, swipe left / right for next / previous.</li>
        <li>Full player: swipe down to close, sideways to skip, up for the play queue.</li>
        <li>Hold a song (or tap ⋮) for play next, add to queue, add to playlist…</li>
        <li>Swipe a sheet down to close it.</li>
      </ul>

      <h2 className="page-subtitle">Keyboard</h2>
      <dl className="shortcuts">
        {SHORTCUTS.map(([keys, action]) => (
          <div key={keys}>
            <dt><kbd>{keys}</kbd></dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>

      <h2 className="page-subtitle">Playlists</h2>
      <p className="page-text">Playlists and songs saved from YouTube live in this browser only (localStorage).</p>
      <button
        type="button"
        className="page-button page-button-danger"
        onClick={async () => {
          const ok = await confirmDialog({
            title: "Reset playlists?",
            message: "All playlists go back to the defaults. This can't be undone.",
            confirmLabel: "Reset",
            danger: true,
          });
          if (ok) playlistActions.reset();
        }}
      >
        Reset playlists
      </button>

      <footer className="page-text app-footer">
        © {new Date().getFullYear()} playlistGo by{" "}
        <a href="https://jasurlive.uz" target="_blank" rel="noopener noreferrer">jasurlive.uz</a>
        {" · "}Feedback:{" "}
        <a href="https://t.me/jasurlive_bot" target="_blank" rel="noopener noreferrer">@jasurlive_bot</a>
      </footer>
    </div>
  );
}
