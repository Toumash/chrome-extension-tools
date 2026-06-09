import { crx } from '../../plugin-testOptionsProvider'
import { defineConfig, Plugin } from 'vite'
import manifest from './manifest.json'

const posthogModule = 'posthog-js/dist/module.full.no-external'
const entryId = 'virtual:posthog-graph'
const resolvedEntryId = '\0posthog-graph'
const leafIdPattern = /^virtual:posthog-leaf-(\d+)$/
const resolvedLeafIdPattern = /^\0posthog-leaf-(\d+)$/

function positiveIntegerFromEnv(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? '', 10)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const leafCount = positiveIntegerFromEnv('CRXJS_POSTHOG_REPRO_LEAVES', 240)
const payloadRepeat = positiveIntegerFromEnv(
  'CRXJS_POSTHOG_REPRO_PAYLOAD_REPEAT',
  16,
)

function createEntryModule(): string {
  const imports = Array.from(
    { length: leafCount },
    (_, index) =>
      `import { run as run${index} } from 'virtual:posthog-leaf-${index}'`,
  ).join('\n')
  const calls = Array.from(
    { length: leafCount },
    (_, index) => `run${index}()`,
  ).join(',\n    ')

  return `${imports}

export function runPosthogGraph() {
  const values = [
    ${calls},
  ]
  return {
    count: values.length,
    checksum: values.reduce((total, value) => total + value, 0),
  }
}
`
}

function createLeafModule(index: number): string {
  const payload = `panelpro-posthog-memory-repro-${index}:`.repeat(
    payloadRepeat,
  )

  return `import posthog from '${posthogModule}'

const payload = ${JSON.stringify(payload)}

export function run() {
  if (!posthog || typeof posthog !== 'object') {
    throw new Error('PostHog import did not resolve')
  }

  return payload.length + ${index}
}
`
}

function posthogMemoryGraph(): Plugin {
  return {
    name: 'test:posthog-memory-graph',
    resolveId(source) {
      if (source === entryId) return resolvedEntryId

      const leafMatch = leafIdPattern.exec(source)
      if (leafMatch) return `\0posthog-leaf-${leafMatch[1]}`
    },
    load(id) {
      if (id === resolvedEntryId) return createEntryModule()

      const leafMatch = resolvedLeafIdPattern.exec(id)
      if (leafMatch) return createLeafModule(Number(leafMatch[1]))
    },
  }
}

export default defineConfig({
  build: { minify: false },
  clearScreen: false,
  logLevel: 'error',
  optimizeDeps: {
    include: [posthogModule],
  },
  plugins: [posthogMemoryGraph(), crx({ manifest })],
})
