import { useEffect, useMemo, useState } from 'react'
import { useStore } from './store'
import { DumpBox } from './components/DumpBox'
import { Ledger } from './components/Ledger'
import { ProjectDetail } from './components/ProjectDetail'
import { SettingsModal } from './components/SettingsModal'
import {
  fireNotification,
  notificationPermission,
  dueForReminder,
  markReminderFired,
} from './lib/notifications'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function App() {
  const projects = useStore((s) => s.projects)
  const loadExamples = useStore((s) => s.loadExamples)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [query, setQuery] = useState('')

  // Fire desktop notifications every 2 hours for snoozed-and-due projects
  useEffect(() => {
    function check() {
      if (notificationPermission() !== 'granted') return
      if (!dueForReminder()) return

      const today = todayStr()
      const due = projects.filter((p) => p.snoozedUntil && p.snoozedUntil <= today)
      if (due.length === 0) return

      markReminderFired()
      if (due.length === 1) {
        fireNotification(due[0].name, due[0].nextAction || 'Back on your list.')
      } else {
        fireNotification(
          `${due.length} projects are back on your list`,
          due.map((p) => p.name).join(', '),
        )
      }
    }

    check() // fire immediately on mount / projects change
    const id = setInterval(check, 2 * 60 * 60 * 1000)

    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [projects])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) =>
      [p.name, p.nextAction, p.waitingOn ?? '', ...p.people].join(' ').toLowerCase().includes(q),
    )
  }, [projects, query])

  const selected = projects.find((p) => p.id === selectedId) ?? null
  const date = new Date()
    .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    .toLowerCase()

  return (
    <div className="mx-auto min-h-full max-w-[760px] px-5 py-8 sm:px-7 sm:py-12">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[15px] font-medium tracking-[0.04em] text-ink">tracker</span>
        <div className="flex items-baseline gap-3 font-mono text-[12px] text-muted">
          <span>{date}</span>
          <span className="text-rule">·</span>
          <button onClick={() => setSettingsOpen(true)} className="hover:text-ink">
            settings
          </button>
        </div>
      </div>

      <div className="mt-8">
        <DumpBox onNeedKey={() => setSettingsOpen(true)} />
      </div>

      {projects.length === 0 ? (
        <div className="mt-10 border-t border-rule pt-6">
          <p className="font-serif text-[17px] text-ink">Nothing tracked yet.</p>
          <p className="mt-1.5 font-mono text-[13px] text-muted">
            Write tonight's dump above, or{' '}
            <button
              onClick={loadExamples}
              className="text-ink underline decoration-mark decoration-2 underline-offset-2"
            >
              load examples
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="mt-10">
          <div className="mb-2 flex justify-end">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search"
              className="w-28 border-b border-rule bg-transparent pb-0.5 font-mono text-[12px] text-ink outline-none placeholder:text-muted focus:border-ink"
            />
          </div>
          <Ledger projects={visible} onSelect={setSelectedId} />
        </div>
      )}

      {selected && <ProjectDetail project={selected} onClose={() => setSelectedId(null)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
