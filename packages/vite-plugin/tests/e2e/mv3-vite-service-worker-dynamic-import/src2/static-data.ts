import { voices } from './voices'
;(
  globalThis as typeof globalThis & { __staticVoices?: string[] }
).__staticVoices = voices
