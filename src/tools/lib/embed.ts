// /myplayer = the same app without the navbar, made to be iframed on another site (that site has its own nav)
// the router runs under this basename there, so every in-app link stays inside /myplayer/...
export const EMBED_BASE = '/myplayer'

export const isEmbed =
  typeof location !== 'undefined' &&
  (location.pathname === EMBED_BASE || location.pathname.startsWith(`${EMBED_BASE}/`))
