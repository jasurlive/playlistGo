interface ImportMetaEnv {
  // "false" hides the extra themes (linen, matte, sage, hygge, spruce, fjord); anything else keeps them
  readonly VITE_ENABLE_EXTRA_THEMES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// raw svg imports (shared/svg/*.svg?raw) are plain strings
declare module '*.svg?raw' {
  const content: string
  export default content
}
