# PostHog Memory Repro

This fixture exercises CRXJS serve-mode file writing with the same PostHog entry used by PanelPro:

```ts
posthog-js/dist/module.full.no-external
```

It is skipped by default so the normal e2e suite does not run a memory stress test. On the unfixed baseline, this fixture can reproduce high memory usage or OOM. On the fixed branch, the same commands should pass with lower RSS/heap usage.

Run the constrained-heap regression check:

```shell
CRXJS_RUN_POSTHOG_MEMORY_REPRO=1 \
CRXJS_POSTHOG_REPRO_LEAVES=240 \
NODE_OPTIONS="--max-old-space-size=512" \
pnpm --dir packages/vite-plugin exec vitest --mode e2e --run tests/e2e/mv3-vite-posthog-memory-repro/vite-serve.test.ts
```

Run the same fixture with Vite 8:

```shell
CRXJS_RUN_POSTHOG_MEMORY_REPRO=1 \
CRXJS_POSTHOG_REPRO_LEAVES=240 \
NODE_OPTIONS="--max-old-space-size=512" \
pnpm --dir packages/vite-plugin test:vite-matrix -- --skip-install --skip-build --mode e2e --vite 8 -- tests/e2e/mv3-vite-posthog-memory-repro/vite-serve.test.ts
```

To inspect memory without constraining heap:

```shell
CRXJS_RUN_POSTHOG_MEMORY_REPRO=1 \
CRXJS_POSTHOG_REPRO_LEAVES=240 \
NODE_OPTIONS="--max-old-space-size=2048" \
pnpm --dir packages/vite-plugin exec vitest --mode e2e --run tests/e2e/mv3-vite-posthog-memory-repro/vite-serve.test.ts
```

Expected fixed output includes a memory line like:

```text
[posthog-memory-repro] files=250 heapUsedMB=76 rssMB=410 heapDeltaMB=22
```

Expected unfixed output under the 512 MB heap cap includes an OOM error like:

```text
ERR_WORKER_OUT_OF_MEMORY
```

Increase `CRXJS_POSTHOG_REPRO_LEAVES` to make the dev file writer traverse a larger module graph. Set `CRXJS_POSTHOG_REPRO_MIN_HEAP_DELTA_MB` or `CRXJS_POSTHOG_REPRO_MIN_RSS_MB` when comparing against an unfixed baseline and the repro should fail unless memory crosses a threshold.
