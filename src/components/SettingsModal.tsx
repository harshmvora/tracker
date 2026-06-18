import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../store'
import { MODEL } from '../lib/claude'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const apiKey = useStore((s) => s.apiKey)
  const setApiKey = useStore((s) => s.setApiKey)
  const clearAll = useStore((s) => s.clearAll)
  const [key, setKey] = useState(apiKey)

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

        <div className="mt-6 flex items-center justify-between">
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
