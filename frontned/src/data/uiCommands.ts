import type { SlashCommand } from '../types'

/**
 * Slash commands the web UI handles itself (instead of sending them to Claude),
 * because in the CLI they open interactive pickers/screens.
 * Every other "/command" is passed straight to Claude Code.
 */
export const UI_COMMANDS: (SlashCommand & { usage: string })[] = [
  { name: 'model', description: 'Switch the model for this session', argumentHint: '[opus|sonnet|haiku|…]', usage: '/model sonnet' },
  { name: 'mode', description: 'Switch permission mode', argumentHint: '[default|acceptEdits|plan|bypassPermissions]', usage: '/mode plan' },
  { name: 'clear', description: 'Start a fresh session in the same folder (old one stays in history)', usage: '/clear' },
  { name: 'new', description: 'Same as /clear — start a new session', usage: '/new' },
  { name: 'resume', description: 'Pick another session of this folder', usage: '/resume' },
  { name: 'theme', description: 'Toggle dark / light theme', usage: '/theme' },
  { name: 'chrome', description: 'Toggle Claude in Chrome for new sessions', usage: '/chrome' },
  { name: 'help', description: 'Open the commands reference page', usage: '/help' },
  { name: 'settings', description: 'Open settings (models, shortcuts, account)', usage: '/settings' },
  { name: 'login', description: 'Open the login screen', usage: '/login' },
  { name: 'exit', description: 'Leave this session and go back home', usage: '/exit' },
]

export const UI_COMMAND_NAMES = new Set(UI_COMMANDS.map((c) => c.name))

export const PERMISSION_MODES = [
  { value: 'default', label: 'Ask', description: 'Ask before edits and commands' },
  { value: 'acceptEdits', label: 'Accept edits', description: 'Auto-approve file edits, ask for commands' },
  { value: 'plan', label: 'Plan', description: 'Read-only: research and propose a plan first' },
  { value: 'bypassPermissions', label: 'Bypass', description: 'Never ask (careful!)' },
] as const
