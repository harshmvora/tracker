import { useEffect, useRef, useState } from 'react'
import type { Project } from '../types'
import { useStore } from '../store'
import { todayLogEntries } from '../lib/ui'

function pickProject(projects: Project[]): Project | null {
  const candidates = projects
    .filter((p) => (p.status === 'active' || p.status === 'stalled') && !p.snoozedUntil)
    .filter((p) => todayLogEntries(p).length === 0)
    .sort((a, b) => new Date(a.lastTouched).getTime() - new Date(b.lastTouched).getTime())
  return candidates[0] ?? null
}

export function useCheckIn(projects: Project[]) {
  const [project, setProject] = useState<Project | null>(null)

  function trigger() {
    const p = pickProject(projects)
    if (p) setProject(p)
  }

  // On mount
  useEffect(() => { trigger() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // On tab focus
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') trigger()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  return { project, dismiss: () => setProject(null) }
}

export function CheckIn({ project, onDone }: { project: Project; onDone: () => void }) {
  const addLogEntry = useStore((s) => s.addLogEntry)
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const remaining = useStore((s) =>
    s.projects.filter(
      (p) =>
        (p.status === 'active' || p.status === 'stalled') &&
        !p.snoozedUntil &&
        todayLogEntries(p).length === 0 &&
        p.id !== project.id,
    ).length,
  )

  useEffect(() => { ref.current?.focus() }, [])

  function submit() {
    const t = text.trim()
    if (!t) return
    addLogEntry(project.id, t)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded bg-paper p-7 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="font-mono text-[11px] text-muted">quick update</div>
        <div className="mt-2 font-serif text-[22px] leading-snug text-ink">{project.name}</div>

        <div className="mt-1 font-mono text-[12px] text-muted">
          {project.nextAction || 'what happened on this today?'}
        </div>

        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          placeholder="what happened…"
          rows={3}
          className="mt-5 w-full resize-none border-b border-rule bg-transparent pb-1 font-serif text-[16px] text-ink outline-none placeholder:text-muted focus:border-ink"
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[11px] text-muted">
            {remaining > 0 ? `${remaining} more project${remaining > 1 ? 's' : ''} need an update today` : 'last one for now'}
          </span>
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="rounded bg-ink px-4 py-2 font-mono text-[13px] text-paper disabled:opacity-30"
          >
            save →
          </button>
        </div>
      </div>
    </div>
  )
}
