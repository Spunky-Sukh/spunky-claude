import { ArrowUp, Check, Folder, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { errorMessage } from '../../api/http'
import { systemApi } from '../../api/systemApi'
import type { FolderListing } from '../../types'
import { Button, Spinner } from '../common/ui'

/** Modal to click through folders on this machine instead of pasting a path. */
export function FolderBrowser({ initial, onPick, onClose }: { initial?: string; onPick: (path: string) => void; onClose: () => void }) {
  const [listing, setListing] = useState<FolderListing | null>(null)
  const [error, setError] = useState<string | null>(null)

  const open = (path?: string) => {
    setError(null)
    systemApi
      .listFolders(path)
      .then(setListing)
      .catch((err) => setError(errorMessage(err)))
  }

  useEffect(() => open(initial || undefined), [initial])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-xl flex-col rounded-xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <button
            disabled={listing?.parent == null}
            onClick={() => open(listing?.parent || undefined)}
            className="cursor-pointer rounded p-1 text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30"
            title="Up"
          >
            <ArrowUp className="size-4" />
          </button>
          <div className="flex-1 truncate font-mono text-sm">{listing?.path || 'This computer'}</div>
          <button onClick={onClose} className="cursor-pointer text-muted hover:text-fg">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {error && <p className="p-3 text-sm text-danger">{error}</p>}
          {!listing && !error && <Spinner className="m-4 size-5" />}
          {listing?.folders.length === 0 && <p className="p-3 text-sm text-muted">No sub-folders</p>}
          {listing?.folders.map((f) => (
            <button
              key={f.path}
              onDoubleClick={() => onPick(f.path)}
              onClick={() => open(f.path)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-surface-2"
            >
              <Folder className="size-4 text-accent" />
              <span className="truncate">{f.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-3">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" disabled={!listing?.path} onClick={() => listing && onPick(listing.path)}>
            <Check className="size-4" /> Use this folder
          </Button>
        </div>
      </div>
    </div>
  )
}
