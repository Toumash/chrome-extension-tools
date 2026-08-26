;(
  globalThis as typeof globalThis & { __contentScriptLoaded?: boolean }
).__contentScriptLoaded = true

export {}
