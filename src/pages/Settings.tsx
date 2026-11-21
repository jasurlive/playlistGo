import { FiMaximize, FiMinimize, FiShuffle } from "react-icons/fi";
import { useTheme } from "../hooks/LOCAL/useTheme";
import { useFullscreen } from "../hooks/LOCAL/useFullscreen";
import { confirmDialog } from "../lib/confirm";
import { playlistActions } from "../hooks/LOCAL/usePlaylists";
import { THEME_LABELS, isDarkTheme } from "../lib/themes";
import { THEME_ICONS } from "../shared/ThemeIcons";
import { useCharacter } from "../hooks/LOCAL/useCharacter";
import { CHARACTERS, CHARACTER_LABELS, characterSvg } from "../lib/characters";
import BackButton from "../shared/BackButton";

// global shortcuts (see Menu.tsx + useShortcuts): keep this in sync when you add one
const SHORTCUTS = [
  { keys: ["K", "5"], action: "Play / pause" },
  { keys: ["6", "N"], action: "Next song" },
  { keys: ["4", "P"], action: "Previous song" },
  { keys: ["Shift", "S"], action: "Shuffle on / off" },
  { keys: ["R"], action: "Repeat: all → one → off" },
  { keys: ["S", "/"], action: "Focus search" },
  { keys: ["Space"], action: "Open / minimize the player" },
  { keys: ["F"], action: "Video full screen (laptop)" },
  { keys: ["Esc"], action: "Close the player, or go back" },
  { keys: ["Ctrl", "J"], action: "Next theme" },
  { keys: ["`"], action: "Collapse / expand the sidebar" },
];

const TIPS = [
  "Your music buddy on the Moods tab vibes along while music plays. Pick a different one under Music buddy.",
  "Swipe the library list sideways to switch between playlist tabs.",
  "Mini player: tap or swipe up to open, swipe left / right for next / previous.",
  "Full player: swipe down to close, sideways to skip, up for the play queue.",
  "Hold a song (or tap ⋮) for play next, add to queue, add to playlist…",
  "Swipe a sheet down to close it.",
  "Your theme is saved in this browser.",
];

export default function Settings() {
  const { theme, setTheme, themes } = useTheme();
  const { supported, isFullscreen, toggleFullscreen } = useFullscreen();
  const { character, choice, setChoice } = useCharacter();

  return (
    <div className="page-pad">
      <div className="page-head">
        <BackButton />
        <h1 className="page-h1">Settings</h1>
      </div>

      <h2 className="page-subtitle">Theme</h2>
      {/* light themes on the left, dark on the right */}
      <div className="theme-columns" role="radiogroup" aria-label="Theme">
        {[
          { label: "Light", list: themes.filter((t) => !isDarkTheme(t)) },
          { label: "Dark", list: themes.filter(isDarkTheme) },
        ].map((col) => (
          <div key={col.label} className="theme-picker">
            <span className="theme-column-label">{col.label}</span>
            {col.list.map((t) => (
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
        ))}
      </div>

      <h2 className="page-subtitle">Music buddy</h2>
      <p className="page-text buddy-note">Lives on the Moods tab in the menu and vibes along while music plays.</p>
      {/* the picked buddy dances (is-playing) so you can see it move */}
      <div className="buddy-picker" role="radiogroup" aria-label="Music buddy">
        {/* shuffle: a different random buddy on each visit (the default) */}
        <button
          type="button"
          role="radio"
          aria-checked={choice === "shuffle"}
          className={`page-button buddy-option ${choice === "shuffle" ? "is-active" : ""}`}
          onClick={() => setChoice("shuffle")}
          title={choice === "shuffle" ? `This visit: ${CHARACTER_LABELS[character]}` : "A random buddy on each visit"}
        >
          <span className="buddy-option-face buddy-option-shuffle" aria-hidden="true">
            <FiShuffle />
          </span>
          Shuffle
        </button>
        {CHARACTERS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === choice}
            className={`page-button buddy-option ${c === choice ? "is-active is-playing" : ""}`}
            onClick={() => setChoice(c)}
          >
            <span className="buddy-option-face" aria-hidden="true" dangerouslySetInnerHTML={{ __html: characterSvg(c, `set-${c}`) }} />
            {CHARACTER_LABELS[c]}
          </button>
        ))}
      </div>

      <h2 className="page-subtitle">Display</h2>
      {supported ? (
        <button
          type="button"
          role="switch"
          aria-checked={isFullscreen}
          className="settings-switch"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          <span>Full screen</span>
          <span className="settings-knob" />
        </button>
      ) : (
        <p className="page-text">Full screen isn't supported in this browser.</p>
      )}

      <h2 className="page-subtitle">Keyboard shortcuts</h2>
      <ul className="info-list">
        {SHORTCUTS.map((s) => (
          <li key={s.action}>
            <span>
              {s.keys.map((k) => (
                <kbd key={k}>{k}</kbd>
              ))}
            </span>
            {s.action}
          </li>
        ))}
      </ul>
      <p className="page-text">On Mac, use ⌘ instead of Ctrl. Shortcuts are ignored while typing in a field.</p>

      <h2 className="page-subtitle">Tips</h2>
      <ul className="info-list">
        {TIPS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

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

      <p className="page-text info-footer">
        © {new Date().getFullYear()} playlistGo by{" "}
        <a href="https://jasurlive.uz" target="_blank" rel="noopener noreferrer">jasurlive.uz</a>
        {" · "}Feedback:{" "}
        <a href="https://t.me/jasurlive_bot" target="_blank" rel="noopener noreferrer">@jasurlive_bot</a>
      </p>
    </div>
  );
}
