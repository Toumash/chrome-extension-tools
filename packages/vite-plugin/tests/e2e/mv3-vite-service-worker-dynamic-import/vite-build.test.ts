import fs from 'fs-extra'
import path from 'pathe'
import type { OutputChunk } from 'rollup'
import { test } from 'vitest'
import { version } from 'vite'
import { getServiceWorker } from '../helpers'
import { build } from '../runners'

interface WorkerState {
  importCaught?: boolean
  listeners: boolean
  nestedValue?: string
  staticSeed?: string
  voices?: string[]
}

async function buildFixture(source: string) {
  const src = path.join(__dirname, 'src')
  await fs.emptyDir(src)
  await fs.copy(path.join(__dirname, source), src, { overwrite: true })

  const { browser, output } = await build(__dirname)
  if (!('output' in output)) throw new TypeError('Expected Rollup output')

  const background = output.output.find(
    (item): item is OutputChunk =>
      item.type === 'chunk' &&
      item.facadeModuleId?.endsWith('/src/background.ts') === true,
  )
  const worker = await getServiceWorker(browser, { timeout: 15_000 })

  let state: WorkerState = { listeners: false }
  if (worker) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    state = await worker.evaluate(() => {
      const fixtureGlobal = globalThis as typeof globalThis & {
        __importCaught?: boolean
        __nestedValue?: string
        __staticSeed?: string
        __voices?: string[]
      }

      return {
        importCaught: fixtureGlobal.__importCaught,
        listeners: chrome.runtime.onMessage.hasListeners(),
        nestedValue: fixtureGlobal.__nestedValue,
        staticSeed: fixtureGlobal.__staticSeed,
        voices: fixtureGlobal.__voices,
      }
    })
  }

  return {
    output: {
      dynamicImports: background?.dynamicImports,
      hasRawImport: /\bimport\s*\(/.test(background?.code ?? ''),
    },
    state,
  }
}

const viteMajor = Number.parseInt(version.split('.')[0], 10)

// TODO(#1235): use `test` unconditionally after preventing Vite's preload
// helper from aborting service workers when dynamic data is shared by entries.
const testVite8Regression = viteMajor >= 8 ? test.fails : test

testVite8Regression(
  'keeps listeners when dynamic data is shared with a content script',
  async ({ expect }) => {
    expect(await buildFixture('src2')).toEqual({
      output: {
        dynamicImports: [],
        hasRawImport: false,
      },
      state: {
        importCaught: undefined,
        listeners: true,
        nestedValue: undefined,
        staticSeed: 'statically-seeded',
        voices: ['Alice', 'Bob'],
      },
    })
  },
)

// TODO(#1235): replace `test.fails` with `test` after recursively inlining
// service worker dynamic imports and their preload dependencies.
test.fails(
  'inlines recursive service worker dynamic imports with shared dependencies',
  async ({ expect }) => {
    expect(await buildFixture('src1')).toEqual({
      output: {
        dynamicImports: [],
        hasRawImport: false,
      },
      state: {
        importCaught: undefined,
        listeners: true,
        nestedValue: 'fixture-nested-import-ran',
        staticSeed: undefined,
        voices: ['fixture-Alice', 'fixture-Bob'],
      },
    })
  },
)
