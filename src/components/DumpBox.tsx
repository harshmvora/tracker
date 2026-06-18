import { useState } from 'react'
import { useStore } from '../store'
import { structureDump } from '../lib/claude'

export function DumpBox({ onNeedKey }: { onNeedKey: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const apiKey = useStore((s) => s.apiKey)
  const projects = useStore((s) => s.projects)
  const applyUpdates = useStore((s) => s.applyUpdates)

  async function fileIt() {
    const dump = text.trim()
    if (!dump || busy) return
    if (!apiKey) {
      onNeedKey()
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const updates = await structureDump(apiKey, projects, dump)
      const { created, updated } = applyUpdates(updates)
      const parts: string[] = []
      if (updated) parts.push(`${updated} updated`)
      if (created) parts.push(`${created} new`)
      setResult(parts.length ? `filed — ${parts.join(', ')}` : 'nothing to file from that')
      setText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const hint = busy ? 'sorting…' : (error ?? result ?? '⌘/ctrl + enter')
  const hintClass = error ? 'text-[#d98c8c]' : result ? 'text-ink' : 'text-muted'
  const ready = !!text.trim() && !busy

  return (
    <div>
      <div className="font-mono text-[12px] text-muted">tonight</div>
      <h2 className="mt-1.5 font-serif text-[22px] italic leading-snug text-ink">
        What happened today?
      </h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void fileIt()
        }}
        rows={3}
        placeholder="Marco walked the kitchen site — plumbing needs rerouting. Heard back from Aisha, she's in for the design round…"
        className="mt-2.5 w-full resize-none bg-transparent font-serif text-[16px] leading-relaxed text-ink outline-none placeholder:text-ink/30"
      />
      <div className="mt-1 flex items-center justify-between">
        <span className={`font-mono text-[12px] ${hintClass}`}>{hint}</span>
        <button
          onClick={() => void fileIt()}
          disabled={!ready}
          className="font-mono text-[13px] text-ink disabled:cursor-default disabled:text-muted"
        >
          <span className={ready ? 'border-b-2 border-mark pb-0.5' : ''}>file it →</span>
        </button>
      </div>
    </div>
  )
}
