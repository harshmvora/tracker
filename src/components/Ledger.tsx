import { useRef, useState, type ReactNode } from 'react'
import { Check, ChevronRight, ChevronDown } from 'lucide-react'
import type { Project, Task } from '../types'
import { useStore } from '../store'
import { relativeTime, isStale, initials, nextOpenTask, todayLogEntries } from '../lib/ui'

function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function today(): string {
  return localDateStr()
}

function isSnoozed(p: Project): boolean {
  return !!p.snoozedUntil && p.snoozedUntil > today()
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}

function meta(p: Project): string {
  const rel = relativeTime(p.lastTouched)
  if (p.status === 'done') return 'done'
  if (p.status === 'waiting') return `waiting · ${rel}`
  if (isStale(p)) return `stale · ${rel}`
  if (p.due) return p.due
  return rel
}

function recency(a: Project, b: Project) {
  return new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime()
}

function InlineNode({ projectId, task, depth }: { projectId: string; task: Task; depth: number }) {
  const toggleTask = useStore((s) => s.toggleTask)
  return (
    <div>
      <div className="flex items-start gap-2 py-0.5" style={{ paddingLeft: depth * 16 }}>
        <button
          onClick={() => toggleTask(projectId, task.id)}
          aria-label={task.done ? 'mark not done' : 'mark done'}
          className={`mt-[2px] grid h-[13px] w-[13px] shrink-0 place-items-center rounded-[3px] border transition ${
            task.done
              ? 'border-mark bg-mark/20 text-mark'
              : 'border-rule text-transparent hover:border-muted'
          }`}
        >
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </button>
        <span className={`font-serif text-[14px] leading-snug ${task.done ? 'text-muted line-through' : 'text-ink'}`}>
          {task.title}
        </span>
      </div>
      {task.tasks.map((c) => (
        <InlineNode key={c.id} projectId={projectId} task={c} depth={depth + 1} />
      ))}
    </div>
  )
}

function SnoozePopover({
  onPick,
  onClose,
}: {
  onPick: (date: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1 w-52 rounded border border-rule bg-paper py-2 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      onClick={(e) => e.stopPropagation()}
    >
      {[
        { label: 'tomorrow', date: addDays(1) },
        { label: 'in 3 days', date: addDays(3) },
        { label: 'next week', date: addDays(7) },
      ].map(({ label, date }) => (
        <button
          key={label}
          onClick={() => { onPick(date); onClose() }}
          className="flex w-full items-center justify-between px-4 py-1.5 font-mono text-[12px] text-ink hover:bg-ink/[0.06]"
        >
          <span>{label}</span>
          <span className="text-muted">{date.slice(5)}</span>
        </button>
      ))}
      <div className="mx-4 mt-2 border-t border-rule pt-2">
        <label className="block font-mono text-[11px] text-muted">pick a date</label>
        <input
          type="date"
          min={addDays(1)}
          onChange={(e) => {
            if (e.target.value) { onPick(e.target.value); onClose() }
          }}
          className="mt-1 w-full bg-transparent font-mono text-[12px] text-ink outline-none [color-scheme:dark]"
        />
      </div>
    </div>
  )
}

function Row({
  project,
  lit,
  draw,
  snoozed,
  onSelect,
}: {
  project: Project
  lit: boolean
  draw: boolean
  snoozed: boolean
  onSelect: (id: string) => void
}) {
  const toggleTask = useStore((s) => s.toggleTask)
  const updateProject = useStore((s) => s.updateProject)
  const snoozeProject = useStore((s) => s.snoozeProject)
  const unsnoozeProject = useStore((s) => s.unsnoozeProject)
  const addLogEntry = useStore((s) => s.addLogEntry)
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const updateRef = useRef<HTMLTextAreaElement>(null)

  const tasks = project.tasks ?? []
  const hasTasks = tasks.length > 0
  const next = lit ? nextOpenTask(tasks) : null

  let lineText: string
  let actionable = false
  if (project.status === 'done') {
    lineText = project.nextAction || 'done'
  } else if (project.status === 'waiting') {
    lineText = project.waitingOn ? `Waiting on ${project.waitingOn}` : project.nextAction || '—'
  } else if (next) {
    lineText = next.title
    actionable = !snoozed
  } else if (tasks.length) {
    lineText = 'all tasks done'
  } else if (project.nextAction) {
    lineText = project.nextAction
    actionable = !snoozed
  } else {
    lineText = '—'
  }

  let action: ReactNode
  if (project.status === 'done') {
    action = <span className="font-serif text-[15px] text-muted line-through">{lineText}</span>
  } else if (actionable) {
    action = (
      <span className={`lit${draw ? ' lit-draw' : ''} font-serif text-[15px] text-ink`}>
        {lineText}
      </span>
    )
  } else {
    action = <span className="font-serif text-[15px] text-muted">{lineText}</span>
  }

  return (
    <div className="relative border-t border-rule">
      <div
        role="button"
        tabIndex={0}
        onClick={() => { if (!pickerOpen) onSelect(project.id) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(project.id) }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setPickerOpen(false) }}
        className="grid w-full cursor-pointer grid-cols-[18px_16px_minmax(80px,132px)_minmax(0,1fr)_auto] items-baseline gap-2.5 py-3 text-left transition-colors hover:bg-ink/[0.03]"
      >
        {lit && !snoozed ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (next) toggleTask(project.id, next.id)
              else updateProject(project.id, { status: 'done' })
            }}
            aria-label="complete your move"
            className="mt-[3px] grid h-[15px] w-[15px] self-start place-items-center rounded-[4px] border border-rule text-transparent transition hover:border-mark hover:text-mark"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </button>
        ) : (
          <span />
        )}

        {hasTasks ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
            aria-label={expanded ? 'collapse tasks' : 'expand tasks'}
            className="mt-[3px] self-start text-muted transition hover:text-ink"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span />
        )}

        <span className={`truncate font-serif text-[15px] ${lit && !snoozed ? 'text-ink' : 'text-muted'}`}>
          {project.name}
        </span>
        <span className="min-w-0">{action}</span>

        <span className="relative flex items-center justify-end gap-2 pl-2">
          {project.people.slice(0, 3).map((p) => (
            <span
              key={p}
              title={p}
              className="inline-grid h-5 w-5 place-items-center rounded-full border-[0.5px] border-rule text-[11px] text-muted"
            >
              {initials(p)}
            </span>
          ))}

          {hovered && !snoozed && project.status !== 'done' && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setUpdateOpen((v) => !v)
                  setPickerOpen(false)
                  setTimeout(() => updateRef.current?.focus(), 50)
                }}
                className="font-mono text-[11px] text-muted hover:text-ink"
              >
                update
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPickerOpen((v) => !v); setUpdateOpen(false) }}
                className="font-mono text-[11px] text-muted hover:text-ink"
              >
                snooze
              </button>
            </div>
          )}
          {hovered && snoozed && (
            <button
              onClick={(e) => { e.stopPropagation(); unsnoozeProject(project.id) }}
              className="font-mono text-[11px] text-muted hover:text-ink"
            >
              tonight
            </button>
          )}
          {!hovered && (
            <span className="min-w-[58px] text-right font-mono text-[12px] text-muted">
              {snoozed && project.snoozedUntil
                ? `until ${project.snoozedUntil.slice(5)}`
                : (() => {
                    const entries = todayLogEntries(project)
                    if (entries.length && !snoozed && project.status !== 'done') {
                      const mins = Math.floor((Date.now() - new Date(entries[0].at).getTime()) / 60000)
                      return mins < 60 ? `updated ${mins}m ago` : `updated ${Math.floor(mins/60)}h ago`
                    }
                    return meta(project)
                  })()}
            </span>
          )}

          {pickerOpen && (
            <SnoozePopover
              onPick={(date) => snoozeProject(project.id, date)}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </span>
      </div>

      {expanded && hasTasks && (
        <div className="pb-3 pl-[46px] pr-2">
          {tasks.map((t) => (
            <InlineNode key={t.id} projectId={project.id} task={t} depth={0} />
          ))}
        </div>
      )}

      {updateOpen && (
        <div className="pb-3 pl-[46px] pr-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={updateRef}
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const text = updateText.trim()
                if (text) { addLogEntry(project.id, text); setUpdateText('') }
                setUpdateOpen(false)
              }
              if (e.key === 'Escape') { setUpdateOpen(false); setUpdateText('') }
            }}
            placeholder="what happened on this today… (enter to save)"
            rows={2}
            className="w-full resize-none border-b border-rule bg-transparent pb-1 font-serif text-[14px] text-ink outline-none placeholder:text-muted focus:border-ink"
          />
        </div>
      )}

      {!snoozed && lit && !updateOpen && todayLogEntries(project).length === 0 && (
        <div className="pb-2 pl-[46px] font-mono text-[11px] text-muted/50">no update today</div>
      )}
    </div>
  )
}

function Group({
  label,
  projects,
  lit = false,
  drawFirst = false,
  snoozed = false,
  onSelect,
}: {
  label: string
  projects: Project[]
  lit?: boolean
  drawFirst?: boolean
  snoozed?: boolean
  onSelect: (id: string) => void
}) {
  if (projects.length === 0) return null
  return (
    <section className="mt-7 first:mt-0">
      <div className="font-mono text-[12px] text-muted">
        {label} · {projects.length}
      </div>
      <div className="mt-1">
        {projects.map((p, i) => (
          <Row
            key={p.id}
            project={p}
            lit={lit}
            draw={drawFirst && i === 0}
            snoozed={snoozed}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}

export function Ledger({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (id: string) => void
}) {
  if (projects.length === 0) {
    return (
      <p className="border-t border-rule pt-4 font-mono text-[13px] text-muted">nothing here.</p>
    )
  }

  const onYou = projects
    .filter((p) => (p.status === 'active' || p.status === 'stalled') && !isSnoozed(p))
    .sort((a, b) => Number(isStale(b)) - Number(isStale(a)) || recency(a, b))

  const notTonight = projects
    .filter((p) => (p.status === 'active' || p.status === 'stalled') && isSnoozed(p))
    .sort((a, b) => (a.snoozedUntil ?? '').localeCompare(b.snoozedUntil ?? ''))

  const resting = projects.filter((p) => p.status === 'waiting').sort(recency)
  const done = projects.filter((p) => p.status === 'done').sort(recency)

  return (
    <div>
      <Group label="on you tonight" projects={onYou} lit drawFirst onSelect={onSelect} />
      <Group label="not tonight" projects={notTonight} snoozed onSelect={onSelect} />
      <Group label="resting" projects={resting} onSelect={onSelect} />
      <Group label="done" projects={done} onSelect={onSelect} />
    </div>
  )
}
