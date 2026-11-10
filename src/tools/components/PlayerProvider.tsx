import { useEffect, useRef, useState, type ReactNode } from "react";
import { PlayerContext, type Repeat } from "../lib/playerContext";
import type { Song } from "../lib/types";
import { loadYouTubeApi, YT_STATE, type YTPlayer } from "../lib/youtube";

// last queue survives a reload (it's restored paused)
const QUEUE_KEY = "queue";

function readQueue(): { queue: Song[]; index: number; source: string | null } {
  try {
    const data = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "null");
    if (Array.isArray(data?.queue) && typeof data.index === "number") {
      const queue = data.queue.filter((s: Song) => typeof s?.id === "string");
      return { queue, index: Math.min(data.index, queue.length - 1), source: data.source ?? null };
    }
  } catch {}
  return { queue: [], index: -1, source: null };
}

// owns the queue + the single youtube player, so playback survives page changes
export default function PlayerProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readQueue);
  const [queue, setQueue] = useState<Song[]>(initial.queue);
  const [index, setIndex] = useState(initial.index);
  const [source, setSource] = useState<string | null>(initial.source);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(() => localStorage.getItem("shuffle") === "true");
  const [repeat, setRepeat] = useState<Repeat>(() => {
    const saved = localStorage.getItem("repeat");
    return saved === "one" || saved === "off" ? saved : "all";
  });
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);

  const yt = useRef<YTPlayer | null>(null);
  const ready = useRef(false);
  const loadedId = useRef<string | null>(null); // what youtube has
  const wantedId = useRef<string | null>(null); // what the user picked
  const autoplay = useRef(false); // false while showing a restored queue
  const everPlayed = useRef(false);
  const history = useRef<number[]>([]); // for "prev" while shuffling

  const current = queue[index] ?? null;

  function nextIndex(auto: boolean) {
    if (queue.length === 0) return -1;
    if (shuffle && queue.length > 1) {
      let i = index;
      while (i === index) i = Math.floor(Math.random() * queue.length);
      return i;
    }
    if (index + 1 < queue.length) return index + 1;
    return auto && repeat === "off" ? -1 : 0;
  }

  function goTo(i: number) {
    if (i < 0 || i >= queue.length) return;
    autoplay.current = true;
    if (i === index) {
      yt.current?.seekTo(0, true);
      yt.current?.playVideo();
      return;
    }
    history.current.push(index);
    setIndex(i);
  }

  function next(auto = false) {
    if (auto && repeat === "one") return goTo(index);
    goTo(nextIndex(auto));
  }

  function prev() {
    // a few seconds in: restart the song, like every music app
    if ((yt.current?.getCurrentTime() ?? 0) > 3) return goTo(index);
    const back = history.current.pop();
    if (back !== undefined && back >= 0 && back < queue.length) {
      autoplay.current = true;
      return setIndex(back);
    }
    goTo(index > 0 ? index - 1 : queue.length - 1);
  }

  // edits to the queue change positions, so the shuffle history is no longer valid
  function editQueue(nextQueue: Song[], nextIndex = index) {
    history.current = [];
    setQueue(nextQueue);
    setIndex(nextIndex);
  }

  function start(list: Song[], i: number, from: string) {
    autoplay.current = true;
    history.current = [];
    setQueue(list);
    setIndex(i);
    setSource(from);
    // first song of the visit: show the video (ios only allows sound after a tap on it)
    if (!everPlayed.current) setExpanded(true);
  }

  // the youtube callbacks are bound once, so they read the latest handlers via a ref
  const onEnded = useRef(() => {});
  useEffect(() => {
    onEnded.current = () => next(true);
  });

  // create the player lazily on the first song, then just swap videos
  useEffect(() => {
    if (!host || !current) return;
    wantedId.current = current.id;

    if (yt.current) {
      if (ready.current && loadedId.current !== current.id) {
        loadedId.current = current.id;
        yt.current.loadVideoById(current.id);
      }
      return;
    }

    let cancelled = false;
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || yt.current) return;
        const el = document.createElement("div"); // youtube replaces this node, keep it out of react
        host.replaceChildren(el);
        loadedId.current = current.id;
        yt.current = new YT.Player(el, {
          videoId: current.id,
          width: "100%",
          height: "100%",
          playerVars: { autoplay: autoplay.current ? 1 : 0, playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: (e) => {
              ready.current = true;
              // user picked another song while the player was booting
              if (wantedId.current && wantedId.current !== loadedId.current) {
                loadedId.current = wantedId.current;
                e.target.loadVideoById(wantedId.current);
              } else if (autoplay.current) e.target.playVideo();
            },
            onStateChange: (e) => {
              if (e.data === YT_STATE.PLAYING) {
                everPlayed.current = true;
                autoplay.current = true;
                setPlaying(true);
                setError(null);
              } else if (e.data === YT_STATE.PAUSED) setPlaying(false);
              else if (e.data === YT_STATE.ENDED) {
                setPlaying(false);
                onEnded.current();
              }
            },
            // 100/101/150: removed or not embeddable -> skip ahead
            onError: () => {
              setError("This video can't be played here, skipping…");
              setTimeout(() => onEnded.current(), 1200);
            },
          },
        });
      })
      .catch((err: Error) => setError(err.message));

    return () => {
      cancelled = true;
    };
  }, [host, current]);

  useEffect(() => {
    if (current) document.title = `${current.title} · playlistGo`;
  }, [current]);

  useEffect(() => {
    try {
      localStorage.setItem("shuffle", String(shuffle));
      localStorage.setItem("repeat", repeat);
      localStorage.setItem(QUEUE_KEY, JSON.stringify({ queue, index, source }));
    } catch {}
  }, [shuffle, repeat, queue, index, source]);

  return (
    <PlayerContext.Provider
      value={{
        queue,
        index,
        current,
        source,
        playing,
        shuffle,
        repeat,
        error,
        expanded,
        setExpanded,
        setHost,
        play(list, i, from) {
          if (current && list[i]?.id === current.id && from === source) return goTo(index);
          start(list, i, from);
        },
        playAt: goTo,
        playNext(song) {
          if (!current) return start([song], 0, "queue");
          if (song.id === current.id) return;
          const rest = queue.filter((s, i) => s.id !== song.id || i === index);
          const at = rest.indexOf(current);
          editQueue([...rest.slice(0, at + 1), song, ...rest.slice(at + 1)], at);
        },
        addToQueue(song) {
          if (!current) return start([song], 0, "queue");
          if (queue.some((s) => s.id === song.id)) return;
          editQueue([...queue, song]);
        },
        removeFromQueue(i) {
          if (i === index) return; // remove the playing song by skipping it instead
          editQueue(queue.filter((_, j) => j !== i), i < index ? index - 1 : index);
        },
        toggle() {
          if (!yt.current) return;
          // never played yet: on phones the first play must be a tap on the video itself
          if (!everPlayed.current) setExpanded(true);
          if (yt.current.getPlayerState() === YT_STATE.PLAYING) yt.current.pauseVideo();
          else yt.current.playVideo();
        },
        next: () => next(false),
        prev,
        seek(seconds) {
          yt.current?.seekTo(seconds, true);
        },
        getTime: () => (ready.current ? (yt.current?.getCurrentTime() ?? 0) : 0),
        getDuration: () => (ready.current ? (yt.current?.getDuration() ?? 0) : 0),
        toggleShuffle: () => setShuffle((s) => !s),
        cycleRepeat: () => setRepeat((r) => (r === "all" ? "one" : r === "one" ? "off" : "all")),
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
