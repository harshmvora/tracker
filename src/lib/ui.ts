import type { Project, Task } from '../types'

export function relativeTime(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function isStale(p: Project): boolean {
  return p.status !== 'done' && Date.now() - new Date(p.lastTouched).getTime() > 10 * 86_400_000
}

export function initials(name: string): string {
  const clean = name.replace(/\(.*?\)/g, '').trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** The first open leaf task in pre-order — the project's true next move. */
export function nextOpenTask(tasks: Task[]): Task | null {
  for (const t of tasks) {
    if (t.tasks.length) {
      const child = nextOpenTask(t.tasks)
      if (child) return child
    } else if (!t.done) {
      return t
    }
  }
  return null
}

/** How many leaf tasks are still open. */
export function openLeafCount(tasks: Task[]): number {
  let n = 0
  for (const t of tasks) {
    if (t.tasks.length) n += openLeafCount(t.tasks)
    else if (!t.done) n++
  }
  return n
}

function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Log entries added today for this project. */
export function todayLogEntries(p: Project) {
  const today = localDateStr()
  return p.log.filter((e) => e.at.slice(0, 10) === today)
}

/** All leaf tasks completed today across the tree. */
export function todayCompletedTasks(tasks: Task[]): Task[] {
  const today = localDateStr()
  const result: Task[] = []
  function walk(list: Task[]) {
    for (const t of list) {
      if (!t.tasks.length && t.done && t.completedAt && t.completedAt.slice(0, 10) === today) {
        result.push(t)
      }
      walk(t.tasks)
    }
  }
  walk(tasks)
  return result
}
