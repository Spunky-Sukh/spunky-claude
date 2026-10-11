/** Human-friendly one-line summary of a tool call, like the CLI shows. */
export function toolSummary(name: string, input: Record<string, unknown>): string {
  const str = (k: string) => (typeof input[k] === 'string' ? (input[k] as string) : '')
  switch (name) {
    case 'Bash':
    case 'PowerShell':
      return str('command')
    case 'Read':
    case 'Write':
    case 'Edit':
    case 'NotebookEdit':
      return str('file_path') || str('notebook_path')
    case 'Glob':
      return str('pattern')
    case 'Grep':
      return `${str('pattern')}${str('path') ? `  in ${str('path')}` : ''}`
    case 'WebFetch':
      return str('url')
    case 'WebSearch':
      return str('query')
    case 'Agent':
    case 'Task':
      return str('description') || str('prompt').slice(0, 80)
    case 'Skill':
      return str('skill')
    case 'TodoWrite':
      return `${Array.isArray(input.todos) ? input.todos.length : 0} todos`
    default:
      if (name.startsWith('mcp__claude-in-chrome__')) return str('url') || str('action') || str('query') || ''
      return Object.values(input).find((v) => typeof v === 'string')?.toString().slice(0, 100) ?? ''
  }
}

/** "mcp__claude-in-chrome__navigate" → "Chrome · navigate" */
export function toolLabel(name: string): string {
  if (name.startsWith('mcp__claude-in-chrome__')) return `Chrome · ${name.slice('mcp__claude-in-chrome__'.length)}`
  if (name.startsWith('mcp__')) {
    const [, server, tool] = name.split('__')
    return `${server} · ${tool}`
  }
  return name
}

export function isBrowserTool(name: string): boolean {
  return name.startsWith('mcp__claude-in-chrome__')
}
