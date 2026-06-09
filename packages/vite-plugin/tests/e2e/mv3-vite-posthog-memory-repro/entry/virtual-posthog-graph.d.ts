declare module 'virtual:posthog-graph' {
  export function runPosthogGraph(): { count: number; checksum: number }
}
