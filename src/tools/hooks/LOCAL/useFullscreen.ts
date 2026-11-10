import { useCallback, useEffect, useState } from "react";

// whole-page fullscreen (the app itself, not the YouTube player)
export function useFullscreen() {
  const supported = typeof document !== "undefined" && !!document.fullscreenEnabled;
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen({ navigationUI: "hide" });
    request.catch(() => {}); // denied / not allowed: nothing to do
  }, []);

  return { supported, isFullscreen, toggleFullscreen };
}
