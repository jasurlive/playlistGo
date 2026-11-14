interface ImportMetaEnv {
  // "false" hides the extra themes (linen, fjord, moss, charcoal, paper); anything else keeps them
  readonly VITE_ENABLE_EXTRA_THEMES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
