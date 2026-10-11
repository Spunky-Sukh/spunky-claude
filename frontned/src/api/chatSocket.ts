import type { ClientEvent, ServerEvent } from '../types'

interface Handlers {
  onOpen: () => void
  onEvent: (event: ServerEvent) => void
  onClose: (reason: string) => void
}

/** Thin wrapper around the /ws/chat WebSocket — transport only, no app logic. */
export class ChatSocket {
  private ws: WebSocket | null = null
  private closedByUs = false
  private handlers: Handlers

  constructor(handlers: Handlers) {
    this.handlers = handlers
  }

  connect(): void {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    this.ws = new WebSocket(`${protocol}://${location.host}/ws/chat`)
    this.ws.onopen = () => this.handlers.onOpen()
    this.ws.onmessage = (e) => this.handlers.onEvent(JSON.parse(e.data) as ServerEvent)
    this.ws.onclose = (e) => {
      if (!this.closedByUs) this.handlers.onClose(e.reason || `Connection closed (${e.code})`)
    }
  }

  send(event: ClientEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(event))
  }

  close(): void {
    this.closedByUs = true
    this.ws?.close()
    this.ws = null
  }
}
