import { X } from 'lucide-react'
import type { Project } from '../types'
import { todayLogEntries, todayCompletedTasks } from '../lib/ui'

function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function EodReport({ projects, onClose }: { projects: Project[]; onClose: () => void }) {
  const active = projects.filter((p) => p.status === 'active' || p.status === 'stalled')

  const updated = active.filter((p) => todayLogEntries(p).length > 0)
  const untouched = active.filter((p) => todayLogEntries(p).length === 0)

  const allCompleted = projects.flatMap((p) =>
    todayCompletedTasks(p.tasks).map((t) => ({ task: t, project: p })),
  )

  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  }).toLowerCase()

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/55 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded bg-paper shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-baseline justify-between border-b border-rule px-6 py-5">
          <div>
            <div className="font-mono text-[11px] text-muted">end of day</div>
            <div className="mt-0.5 font-serif text-[18px] text-ink">{date}</div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* updated projects */}
          {updated.length > 0 && (
            <section>
              <div className="font-mono text-[11px] text-muted">
                updated today · {updated.length}
              </div>
              <div className="mt-3 space-y-4">
                {updated.map((p) => (
                  <div key={p.id}>
                    <div className="font-serif text-[15px] text-ink">{p.name}</div>
                    <div className="mt-1 space-y-1">
                      {todayLogEntries(p).map((e) => (
                        <div key={e.id} className="flex gap-3">
                          <span className="shrink-0 font-mono text-[11px] text-muted pt-[2px]">
                            {fmt(e.at)}
                          </span>
                          <span className="font-serif text-[14px] text-ink leading-snug">
                            {e.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* tasks completed today */}
          {allCompleted.length > 0 && (
            <section>
              <div className="font-mono text-[11px] text-muted">
                tasks done today · {allCompleted.length}
              </div>
              <div className="mt-3 space-y-1">
                {allCompleted.map(({ task, project }) => (
                  <div key={task.id} className="flex gap-3">
                    <span className="shrink-0 font-mono text-[11px] text-muted pt-[2px]">
                      {fmt(task.completedAt!)}
                    </span>
                    <span className="font-serif text-[14px] text-ink leading-snug line-through decoration-muted">
                      {task.title}
                    </span>
                    <span className="font-mono text-[11px] text-muted pt-[2px] shrink-0">
                      {project.name}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* untouched */}
          {untouched.length > 0 && (
            <section>
              <div className="font-mono text-[11px] text-muted">
                no update today · {untouched.length}
              </div>
              <div className="mt-2 space-y-0.5">
                {untouched.map((p) => (
                  <div key={p.id} className="font-serif text-[14px] text-muted">
                    {p.name}
                  </div>
                ))}
              </div>
            </section>
          )}

          {updated.length === 0 && allCompleted.length === 0 && (
            <p className="font-serif text-[15px] text-muted">
              Nothing logged today yet. Add updates to your projects as you go.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
