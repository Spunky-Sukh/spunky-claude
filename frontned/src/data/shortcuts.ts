export interface Shortcut {
  id: string
  label: string
  /** Text sent to Claude. If it starts with "/", it runs as a slash command. */
  prompt: string
  icon: 'sparkles' | 'file-text' | 'files' | 'book' | 'git' | 'search' | 'bug' | 'zap'
}

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'skill',
    label: 'Create skill of this',
    icon: 'sparkles',
    prompt:
      'Turn what we just worked on in this conversation into a reusable Claude Code skill. ' +
      'Create it at .claude/skills/<skill-name>/SKILL.md with YAML frontmatter (name, description that says when to use it) ' +
      'and clear step-by-step instructions. Ask me before choosing between project-level and user-level (~/.claude/skills) if unclear.',
  },
  {
    id: 'md-file',
    label: 'Create .md file of this',
    icon: 'file-text',
    prompt:
      'Write a well-structured Markdown document capturing this (the current topic of our conversation): ' +
      'overview, key details, decisions and next steps. Save it as a .md file in the project and tell me the path.',
  },
  {
    id: 'update-md',
    label: 'Update .md files',
    icon: 'files',
    prompt:
      "Review the project's Markdown files (README.md, CLAUDE.md, docs/*.md and any other .md files) and update them so they " +
      'accurately reflect the current code and the changes we made in this session. Summarize what you changed.',
  },
  { id: 'init', label: 'Generate CLAUDE.md', icon: 'book', prompt: '/init' },
  {
    id: 'commit',
    label: 'Commit changes',
    icon: 'git',
    prompt: 'Look at the current git changes and create a commit with a clear, conventional commit message.',
  },
  {
    id: 'explain',
    label: 'Explain this project',
    icon: 'search',
    prompt: 'Give me a concise tour of this project: what it does, how it is structured, and the key files to know.',
  },
]
