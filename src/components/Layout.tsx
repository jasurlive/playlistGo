import { Outlet, useLocation } from "react-router";
import Menu from "../shared/Menu";
import ErrorBoundary from "./ErrorBoundary";
import PlayerProvider from "./PlayerProvider";
import MiniPlayer from "./MiniPlayer";
import FullPlayer from "./FullPlayer";
import { isEmbed } from "../lib/embed";
import ConfirmHost from "./ConfirmDialog";

// app shell: page / mini player / bottom navbar (sidebar on desktop) + the full player overlay
// the player lives here, not in a page, so switching pages never stops the music
export default function Layout() {
  const { pathname } = useLocation();

  return (
    <PlayerProvider>
      <div className={`app ${isEmbed ? "app-embed" : ""}`}>
        <main className="app-main">
          {/* key resets the error when you navigate to another page */}
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <MiniPlayer />
        {/* /myplayer is iframed on a site with its own navbar */}
        {!isEmbed && <Menu />}
        <FullPlayer />
        <ConfirmHost />
      </div>
    </PlayerProvider>
  );
}
