import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'pathe'
import { expect, test } from 'vitest'
import { serve } from '../runners'

const runMemoryRepro = process.env.CRXJS_RUN_POSTHOG_MEMORY_REPRO === '1'
const memoryTest = runMemoryRepro ? test : test.skip

function countFiles(dir: string): number {
  if (!existsSync(dir)) return 0

  return readdirSync(dir).reduce((total, name) => {
    const path = join(dir, name)
    const stat = statSync(path)
    return total + (stat.isDirectory() ? countFiles(path) : 1)
  }, 0)
}

function toMb(bytes: number): number {
  return Math.round(bytes / 1024 / 1024)
}

memoryTest('serves a PostHog fan-out graph for memory profiling', async () => {
  const before = process.memoryUsage()
  const { browser, outDir } = await serve(__dirname)
  const after = process.memoryUsage()
  const files = countFiles(outDir)
  const metrics = {
    heapDeltaMB: toMb(after.heapUsed - before.heapUsed),
    heapUsedMB: toMb(after.heapUsed),
    rssMB: toMb(after.rss),
  }

  console.log(
    `[posthog-memory-repro] files=${files} heapUsedMB=${metrics.heapUsedMB} rssMB=${metrics.rssMB} heapDeltaMB=${metrics.heapDeltaMB}`,
  )

  expect(existsSync(join(outDir, 'manifest.json'))).toBe(true)
  expect(files).toBeGreaterThan(leafCountFloor())
  expectAtLeastFromEnv('CRXJS_POSTHOG_REPRO_MIN_RSS_MB', metrics.rssMB)
  expectAtLeastFromEnv(
    'CRXJS_POSTHOG_REPRO_MIN_HEAP_DELTA_MB',
    metrics.heapDeltaMB,
  )

  const page = await browser.newPage()
  await page.goto('https://example.com')
  const marker = await page.waitForSelector('#posthog-memory-repro', {
    timeout: 10000,
  })

  expect(await marker.textContent()).toContain(
    `posthog modules: ${leafCountFloor()}`,
  )
})

function leafCountFloor(): number {
  const value = Number.parseInt(
    process.env.CRXJS_POSTHOG_REPRO_LEAVES ?? '',
    10,
  )
  return Number.isFinite(value) && value > 0 ? value : 240
}

function expectAtLeastFromEnv(name: string, actual: number): void {
  const floor = Number.parseInt(process.env[name] ?? '', 10)

  if (Number.isFinite(floor) && floor > 0) {
    expect(actual).toBeGreaterThanOrEqual(floor)
  }
}
