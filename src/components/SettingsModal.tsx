import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../store'
import { MODEL } from '../lib/claude'
import {
  notificationsSupported,
  notificationPermission,
  requestNotificationPermission,
} from '../lib/notifications'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const apiKey = useStore((s) => s.apiKey)
  const setApiKey = useStore((s) => s.setApiKey)
  const clearAll = useStore((s) => s.clearAll)
  const importProjects = useStore((s) => s.importProjects)
  const projects = useStore((s) => s.projects)
  const [key, setKey] = useState(apiKey)
  const [importErr, setImportErr] = useState('')
  const [permission, setPermission] = useState(() => notificationPermission())
  const fileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const blob = new Blob([JSON.stringify({ projects }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(file: File) {
    setImportErr('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        const list = data.projects ?? data
        if (!Array.isArray(list)) throw new Error('expected a projects array')
        importProjects(list)
        onClose()
      } catch (err) {
        setImportErr(err instanceof Error ? err.message : 'invalid file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/55 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded bg-paper p-6 shadow-[0_20px_50px_rgba(27,30,39,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[14px] font-medium text-ink">settings</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">
          <div className="font-mono text-[11px] text-muted">anthropic api key</div>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-…"
            className="mt-2 w-full border-b border-rule bg-transparent pb-1 font-mono text-[13px] text-ink outline-none placeholder:text-muted focus:border-ink"
          />
          <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted">
            Stored only in this browser, sent straight to Anthropic when you file a dump. Get a key
            from{' '}
            <a
              className="text-ink underline decoration-mark decoration-2 underline-offset-2"
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
            >
              the Anthropic console
            </a>
            .
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted">model · {MODEL}</p>
        </div>

        {notificationsSupported() && (
          <div className="mt-6 border-t border-rule pt-5">
            <div className="font-mono text-[11px] text-muted">notifications</div>
            <div className="mt-3">
              {permission === 'granted' ? (
                <p className="font-mono text-[12px] text-ink">
                  enabled —{' '}
                  <span className="text-muted">
                    you'll get a desktop notification when a snoozed project wakes up.
                  </span>
                </p>
              ) : permission === 'denied' ? (
                <p className="font-mono text-[12px] text-muted">
                  blocked by browser — allow notifications for this site in your browser settings to enable.
                </p>
              ) : (
                <button
                  onClick={async () => {
                    const result = await requestNotificationPermission()
                    setPermission(result)
                  }}
                  className="font-mono text-[12px] text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
                >
                  enable desktop notifications
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-rule pt-5">
          <div className="font-mono text-[11px] text-muted">data</div>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleExport}
              disabled={projects.length === 0}
              className="font-mono text-[12px] text-ink underline decoration-rule underline-offset-2 hover:decoration-ink disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
              export backup
            </button>
            <span className="font-mono text-[12px] text-rule">·</span>
            <button
              onClick={() => fileRef.current?.click()}
              className="font-mono text-[12px] text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
            >
              import backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleImport(f)
                e.target.value = ''
              }}
            />
          </div>
          {importErr && (
            <p className="mt-2 font-mono text-[11px] text-[#d98c8c]">{importErr}</p>
          )}
          <p className="mt-2 font-mono text-[11px] text-muted">
            Export saves all projects as JSON. Import on another device or browser to migrate your data.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
          <button
            onClick={() => {
              if (confirm('Delete all projects? This cannot be undone.')) clearAll()
            }}
            className="font-mono text-[12px] text-muted hover:text-[#d98c8c]"
          >
            clear all
          </button>
          <button
            onClick={() => {
              setApiKey(key)
              onClose()
            }}
            className="rounded bg-ink px-4 py-2 font-mono text-[13px] text-paper"
          >
            save
          </button>
        </div>
      </div>
    </div>
  )
}
