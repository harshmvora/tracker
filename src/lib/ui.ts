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
