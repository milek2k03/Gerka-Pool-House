/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let loaded = false

function parseEnvLine(line: string) {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith('#')) return null

  const separatorIndex = trimmed.indexOf('=')
  if (separatorIndex === -1) return null

  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return { key, value }
}

export function loadLocalEnv() {
  if (loaded || process.env.VERCEL === '1') return

  loaded = true
  const envPath = resolve(process.cwd(), '.env.local')

  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const parsed = parseEnvLine(line)

    if (parsed && process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value
    }
  }
}
