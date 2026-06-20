import { useState, type ReactNode } from 'react'
import { Check, ChevronRight, ChevronDown } from 'lucide-react'
import type { Project, Task } from '../types'
import { useStore } from '../store'
import { relativeTime, isStale, initials, nextOpenTask } from '../lib/ui'

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

function InlineNode({
  projectId,
  task,
  depth,
}: {
  projectId: string
  task: Task
  depth: number
}) {
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
        <span
          className={`font-serif text-[14px] leading-snug ${
            task.done ? 'text-muted line-through' : 'text-ink'
          }`}
        >
          {task.title}
        </span>
      </div>
      {task.tasks.map((c) => (
        <InlineNode key={c.id} projectId={projectId} task={c} depth={depth + 1} />
      ))}
    </div>
  )
}

function Row({
  project,
  lit,
  draw,
  onSelect,
}: {
  project: Project
  lit: boolean
  draw: boolean
  onSelect: (id: string) => void
}) {
  const toggleTask = useStore((s) => s.toggleTask)
  const updateProject = useStore((s) => s.updateProject)
  const [expanded, setExpanded] = useState(false)

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
    actionable = true
  } else if (tasks.length) {
    lineText = 'all tasks done'
  } else if (project.nextAction) {
    lineText = project.nextAction
    actionable = true
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
    <div className="border-t border-rule">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(project.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(project.id)
          }
        }}
        className="grid w-full cursor-pointer grid-cols-[18px_16px_minmax(80px,132px)_minmax(0,1fr)_auto] items-baseline gap-2.5 py-3 text-left transition-colors hover:bg-ink/[0.03]"
      >
        {lit ? (
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
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
            aria-label={expanded ? 'collapse tasks' : 'expand tasks'}
            className="mt-[3px] self-start text-muted transition hover:text-ink"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span />
        )}

        <span className={`truncate font-serif text-[15px] ${lit ? 'text-ink' : 'text-muted'}`}>
          {project.name}
        </span>
        <span className="min-w-0">{action}</span>
        <span className="flex items-center justify-end gap-1.5 pl-2">
          {project.people.slice(0, 3).map((p) => (
            <span
              key={p}
              title={p}
              className="inline-grid h-5 w-5 place-items-center rounded-full border-[0.5px] border-rule text-[11px] text-muted"
            >
              {initials(p)}
            </span>
          ))}
          <span className="ml-0.5 min-w-[58px] text-right font-mono text-[12px] text-muted">
            {meta(project)}
          </span>
        </span>
      </div>

      {expanded && hasTasks && (
        <div className="pb-3 pl-[46px] pr-2">
          {tasks.map((t) => (
            <InlineNode key={t.id} projectId={project.id} task={t} depth={0} />
          ))}
        </div>
      )}
    </div>
  )
}

function Group({
  label,
  projects,
  lit = false,
  drawFirst = false,
  onSelect,
}: {
  label: string
  projects: Project[]
  lit?: boolean
  drawFirst?: boolean
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
    .filter((p) => p.status === 'active' || p.status === 'stalled')
    .sort((a, b) => Number(isStale(b)) - Number(isStale(a)) || recency(a, b))
  const resting = projects.filter((p) => p.status === 'waiting').sort(recency)
  const done = projects.filter((p) => p.status === 'done').sort(recency)

  return (
    <div>
      <Group label="on you tonight" projects={onYou} lit drawFirst onSelect={onSelect} />
      <Group label="resting" projects={resting} onSelect={onSelect} />
      <Group label="done" projects={done} onSelect={onSelect} />
    </div>
  )
}
