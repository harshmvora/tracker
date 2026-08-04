import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { todayLogEntries } from '../lib/ui'

function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}

function isSnoozed(snoozedUntil?: string): boolean {
  return !!snoozedUntil && snoozedUntil > localDateStr()
}

function buildQueue(projects: ReturnType<typeof useStore.getState>['projects']): string[] {
  return projects
    .filter(
      (p) =>
        (p.status === 'active' || p.status === 'stalled') &&
        !isSnoozed(p.snoozedUntil) &&
        todayLogEntries(p).length === 0,
    )
    .sort((a, b) => new Date(a.lastTouched).getTime() - new Date(b.lastTouched).getTime())
    .map((p) => p.id)
}

export function useCheckIn() {
  const projects = useStore((s) => s.projects)
  const [queueIds, setQueueIds] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  function trigger() {
    // Only trigger once projects are loaded
    if (projects.length === 0) return
    const ids = buildQueue(projects)
    if (ids.length > 0) {
      setQueueIds(ids)
      setOpen(true)
    }
  }

  // Trigger on mount (once projects are available)
  useEffect(() => {
    if (projects.length > 0) trigger()
  }, [projects.length > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger on tab becoming visible
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') trigger()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  return { queueIds, open, close: () => setOpen(false) }
}

const SNOOZE_OPTIONS = [
  { label: 'tomorrow', date: () => addDays(1) },
  { label: 'in 3 days', date: () => addDays(3) },
  { label: 'next week', date: () => addDays(7) },
]

export function CheckIn({
  queueIds,
  onClose,
}: {
  queueIds: string[]
  onClose: () => void
}) {
  const projects = useStore((s) => s.projects)
  const addLogEntry = useStore((s) => s.addLogEntry)
  const snoozeProject = useStore((s) => s.snoozeProject)
  const updateProject = useStore((s) => s.updateProject)

  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'update' | 'snooze'>('update')
  const textRef = useRef<HTMLTextAreaElement>(null)

  // Find live project from store (never stale)
  const id = queueIds[index]
  const project = projects.find((p) => p.id === id)

  const total = queueIds.length
  const isLast = index >= total - 1

  useEffect(() => {
    setText('')
    setMode('update')
    if (mode === 'update') setTimeout(() => textRef.current?.focus(), 50)
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === 'update') setTimeout(() => textRef.current?.focus(), 50)
  }, [mode])

  // Skip projects that no longer need check-in (updated mid-session)
  useEffect(() => {
    if (!project) return
    if (todayLogEntries(project).length > 0 || isSnoozed(project.snoozedUntil) || project.status === 'done') {
      advance()
    }
  }, [project]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!project) return null

  function advance() {
    if (isLast) onClose()
    else setIndex((i) => i + 1)
  }

  function saveUpdate() {
    const t = text.trim()
    if (!t) return
    addLogEntry(project!.id, t)
    advance()
  }

  function doSnooze(date: string) {
    snoozeProject(project!.id, date)
    advance()
  }

  function markDone() {
    updateProject(project!.id, { status: 'done' })
    advance()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded bg-paper shadow-[0_20px_60px_rgba(0,0,0,0.5)]">

        {/* progress bar */}
        <div className="h-[2px] w-full rounded-t bg-rule">
          <div
            className="h-full bg-mark transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <div className="p-7">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-[11px] text-muted">check in</div>
            <div className="font-mono text-[11px] text-muted">{index + 1} of {total}</div>
          </div>

          <div className="mt-2 font-serif text-[22px] leading-snug text-ink">{project.name}</div>
          {project.nextAction && (
            <div className="mt-1 font-mono text-[12px] text-muted">{project.nextAction}</div>
          )}

          {/* action tabs */}
          <div className="mt-5 flex gap-4 border-b border-rule pb-3">
            <button
              onClick={() => setMode('update')}
              className={`font-mono text-[12px] transition ${mode === 'update' ? 'text-ink' : 'text-muted hover:text-ink'}`}
            >
              add update
            </button>
            <button
              onClick={() => setMode('snooze')}
              className={`font-mono text-[12px] transition ${mode === 'snooze' ? 'text-ink' : 'text-muted hover:text-ink'}`}
            >
              snooze
            </button>
            <button
              onClick={markDone}
              className="font-mono text-[12px] text-muted transition hover:text-ink"
            >
              mark done
            </button>
          </div>

          {mode === 'update' && (
            <div className="mt-4">
              <textarea
                ref={textRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveUpdate() }
                }}
                placeholder="what happened on this today…"
                rows={3}
                className="w-full resize-none border-b border-rule bg-transparent pb-1 font-serif text-[16px] text-ink outline-none placeholder:text-muted focus:border-ink"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={saveUpdate}
                  disabled={!text.trim()}
                  className="rounded bg-ink px-4 py-2 font-mono text-[13px] text-paper disabled:opacity-30"
                >
                  {isLast ? 'save →' : 'save + next →'}
                </button>
              </div>
            </div>
          )}

          {mode === 'snooze' && (
            <div className="mt-4 space-y-1">
              {SNOOZE_OPTIONS.map(({ label, date }) => (
                <button
                  key={label}
                  onClick={() => doSnooze(date())}
                  className="flex w-full items-center justify-between rounded px-3 py-2 font-mono text-[13px] text-ink hover:bg-ink/[0.06]"
                >
                  <span>{label}</span>
                  <span className="text-muted">{date().slice(5)}</span>
                </button>
              ))}
              <div className="px-3 pt-2">
                <label className="font-mono text-[11px] text-muted">pick a date</label>
                <input
                  type="date"
                  min={addDays(1)}
                  onChange={(e) => { if (e.target.value) doSnooze(e.target.value) }}
                  className="mt-1 block w-full bg-transparent font-mono text-[13px] text-ink outline-none [color-scheme:dark]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
