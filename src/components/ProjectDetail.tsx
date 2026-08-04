import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Priority, Project, ProjectStatus } from '../types'
import { useStore } from '../store'
import { relativeTime, openLeafCount } from '../lib/ui'
import { TaskTree } from './TaskTree'

const STATUSES: ProjectStatus[] = ['active', 'waiting', 'stalled', 'done']

export function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const updateProject = useStore((s) => s.updateProject)
  const setProjectPriority = useStore((s) => s.setProjectPriority)
  const renameProject = useStore((s) => s.renameProject)
  const deleteProject = useStore((s) => s.deleteProject)
  const [name, setName] = useState(project.name)
  const [next, setNext] = useState(project.nextAction)
  const [waitingOn, setWaitingOn] = useState(project.waitingOn ?? '')

  useEffect(() => {
    setName(project.name)
    setNext(project.nextAction)
    setWaitingOn(project.waitingOn ?? '')
  }, [project.id, project.name, project.nextAction, project.waitingOn])

  function commit() {
    updateProject(project.id, {
      nextAction: next.trim(),
      waitingOn: waitingOn.trim() || undefined,
    })
  }

  const tasks = project.tasks ?? []
  const remaining = openLeafCount(tasks)

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="scroll-soft h-full w-full max-w-md overflow-y-auto bg-paper p-6 shadow-[-8px_0_30px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => renameProject(project.id, name)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className="-ml-1 w-full rounded bg-transparent px-1 font-serif text-[19px] text-ink outline-none focus:bg-ink/[0.04]"
          />
          <button onClick={onClose} className="mt-1 shrink-0 text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-1 px-1 font-mono text-[11px] text-muted">
          last moved {relativeTime(project.lastTouched)}
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <div className="font-mono text-[11px] text-muted">status</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STATUSES.map((st) => (
                <button
                  key={st}
                  onClick={() => updateProject(project.id, { status: st })}
                  className={`rounded px-2.5 py-1 font-mono text-[12px] ${
                    project.status === st
                      ? 'bg-ink text-paper'
                      : 'border border-rule text-muted hover:text-ink'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-mono text-[11px] text-muted">priority</div>
            <div className="mt-2 flex gap-1.5">
              {(['high', 'medium', 'low'] as Priority[]).map((pr) => (
                <button
                  key={pr}
                  onClick={() => setProjectPriority(project.id, project.priority === pr ? undefined : pr)}
                  className={`rounded px-2.5 py-1 font-mono text-[12px] ${
                    project.priority === pr
                      ? 'bg-ink text-paper'
                      : 'border border-rule text-muted hover:text-ink'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-mono text-[11px] text-muted">
              tasks{remaining > 0 ? ` · ${remaining} left` : ''}
            </div>
            <div className="mt-1.5">
              <TaskTree projectId={project.id} tasks={tasks} />
            </div>
          </div>

          <div>
            <div className="font-mono text-[11px] text-muted">next action (from your dumps)</div>
            <textarea
              value={next}
              onChange={(e) => setNext(e.target.value)}
              onBlur={commit}
              rows={2}
              className="mt-2 w-full resize-none border-b border-rule bg-transparent pb-1 font-serif text-[15px] text-ink outline-none focus:border-ink"
            />
          </div>

          <div>
            <div className="font-mono text-[11px] text-muted">waiting on</div>
            <input
              value={waitingOn}
              onChange={(e) => setWaitingOn(e.target.value)}
              onBlur={commit}
              placeholder="—"
              className="mt-2 w-full border-b border-rule bg-transparent pb-1 font-serif text-[15px] text-ink outline-none placeholder:text-muted focus:border-ink"
            />
          </div>

          {project.people.length > 0 && (
            <div>
              <div className="font-mono text-[11px] text-muted">people</div>
              <div className="mt-2 font-serif text-[15px] text-ink">{project.people.join(', ')}</div>
            </div>
          )}

          <div>
            <div className="font-mono text-[11px] text-muted">log</div>
            <ul className="mt-2 space-y-3">
              {project.log.length === 0 && (
                <li className="font-mono text-[12px] text-muted">no entries yet</li>
              )}
              {project.log.map((l) => (
                <li key={l.id} className="border-l border-rule pl-3">
                  <div className="font-mono text-[11px] text-muted">
                    {new Date(l.at)
                      .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      .toLowerCase()}
                  </div>
                  <div className="font-serif text-[15px] leading-snug text-ink">{l.text}</div>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => {
              if (confirm('Delete this project?')) {
                deleteProject(project.id)
                onClose()
              }
            }}
            className="font-mono text-[12px] text-muted hover:text-[#d98c8c]"
          >
            delete project
          </button>
        </div>
      </div>
    </div>
  )
}
