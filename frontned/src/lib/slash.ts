import { UI_COMMANDS, UI_COMMAND_NAMES } from '../data/uiCommands'
import type { SlashCommand } from '../types'

export interface Suggestion extends SlashCommand {
  source: 'ui' | 'claude' | 'plugin'
}

/** Merge UI-handled commands with the ones Claude Code reports. */
export function allCommands(claudeCommands: SlashCommand[]): Suggestion[] {
  return [
    ...UI_COMMANDS.map((c) => ({ ...c, source: 'ui' as const })),
    ...claudeCommands
      .filter((c) => !UI_COMMAND_NAMES.has(c.name))
      .map((c) => ({ ...c, source: c.name.includes(':') ? ('plugin' as const) : ('claude' as const) })),
  ]
}

/** Autocomplete list while the user is typing the command name (e.g. "/mo"). */
export function slashSuggestions(input: string, claudeCommands: SlashCommand[], limit = 60): Suggestion[] {
  const match = /^\/(\S*)$/.exec(input)
  if (!match) return []
  const q = match[1].toLowerCase()

  const rank = (c: Suggestion) => {
    const name = c.name.toLowerCase()
    if (name.startsWith(q)) return 0
    if (name.split(':').pop()!.startsWith(q)) return 1
    if (name.includes(q)) return 2
    if (c.description.toLowerCase().includes(q)) return 3
    return -1
  }

  return allCommands(claudeCommands)
    .map((c) => ({ c, r: rank(c) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.c.name.length - b.c.name.length)
    .slice(0, limit)
    .map((x) => x.c)
}

/** "/model sonnet" → { name: "model", args: "sonnet" } */
export function parseSlash(text: string): { name: string; args: string } | null {
  const match = /^\/(\S+)\s*([\s\S]*)$/.exec(text.trim())
  return match ? { name: match[1], args: match[2].trim() } : null
}
