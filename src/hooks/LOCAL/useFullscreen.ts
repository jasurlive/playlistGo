import { useCallback, useEffect, useState } from "react";

// whole-page fullscreen (the app itself, never the YouTube iframe's own fullscreen)
export const enterFullscreen = () =>
  document.fullscreenElement
    ? Promise.resolve()
    : document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {}); // denied: nothing to do

export const exitFullscreen = () =>
  document.fullscreenElement ? document.exitFullscreen().catch(() => {}) : Promise.resolve();

export function useFullscreen() {
  const supported = typeof document !== "undefined" && !!document.fullscreenEnabled;
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) exitFullscreen();
    else enterFullscreen();
  }, []);

  return { supported, isFullscreen, toggleFullscreen };
}
