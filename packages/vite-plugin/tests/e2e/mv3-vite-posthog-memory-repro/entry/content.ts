import { runPosthogGraph } from 'virtual:posthog-graph'

const result = runPosthogGraph()
const root = document.createElement('div')
root.id = 'posthog-memory-repro'
root.textContent = `posthog modules: ${result.count}; checksum: ${result.checksum}`
document.documentElement.appendChild(root)
