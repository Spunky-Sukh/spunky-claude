import { useNavigate } from 'react-router'
import { PERMISSION_MODES, UI_COMMAND_NAMES } from '../data/uiCommands'
import { parseSlash } from '../lib/slash'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useThemeStore } from '../stores/themeStore'
import type { PermissionMode } from '../types'
import type { ChatActions } from './useChatSession'

interface Options {
  actions: ChatActions
  onOpenModelPicker: () => void
  onNotice: (text: string) => void
  onNewSession: () => void
}

/**
 * Runs whatever the user submits: UI-handled slash commands are executed here,
 * everything else (prompts and Claude Code slash commands) goes to Claude.
 */
export function useCommandRunner({ actions, onOpenModelPicker, onNotice, onNewSession }: Options) {
  const navigate = useNavigate()

  return (text: string) => {
    const cmd = parseSlash(text)
    if (!cmd || !UI_COMMAND_NAMES.has(cmd.name)) {
      actions.sendPrompt(text)
      return
    }

    const cwd = useChatStore.getState().cwd ?? ''
    switch (cmd.name) {
      case 'model': {
        if (!cmd.args) return onOpenModelPicker()
        actions.changeModel(cmd.args)
        return onNotice(`Model set to ${cmd.args}`)
      }
      case 'mode': {
        const mode = PERMISSION_MODES.find((m) => m.value.toLowerCase() === cmd.args.toLowerCase())
        if (!mode) return onNotice(`Use one of: ${PERMISSION_MODES.map((m) => m.value).join(', ')}`)
        actions.changePermissionMode(mode.value as PermissionMode)
        return onNotice(`Permission mode: ${mode.label}`)
      }
      case 'clear':
      case 'new':
        return onNewSession()
      case 'resume':
        return navigate(`/?path=${encodeURIComponent(cwd)}`)
      case 'theme':
        return useThemeStore.getState().toggle()
      case 'chrome': {
        const enabled = !useSettingsStore.getState().chromeEnabled
        useSettingsStore.getState().update({ chromeEnabled: enabled })
        return onNotice(`Claude in Chrome ${enabled ? 'enabled' : 'disabled'} — applies to new sessions`)
      }
      case 'help':
        return navigate('/commands')
      case 'settings':
        return navigate('/settings')
      case 'login':
        return navigate('/login')
      case 'exit':
        return navigate('/')
    }
  }
}
