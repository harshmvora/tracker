export type ProjectStatus = 'active' | 'waiting' | 'stalled' | 'done'

export interface LogEntry {
  id: string
  at: string // ISO timestamp
  text: string
}

/** A task can hold subtasks, which can hold their own — a nested project. */
export interface Task {
  id: string
  title: string
  done: boolean
  tasks: Task[]
}

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  nextAction: string
  tasks: Task[]
  people: string[]
  waitingOn?: string
  due?: string // YYYY-MM-DD
  tags: string[]
  createdAt: string
  lastTouched: string
  log: LogEntry[]
}

/** One structured update extracted from a brain-dump by Claude. */
export interface ProjectUpdate {
  projectName: string
  isNew: boolean
  status?: ProjectStatus
  nextAction?: string
  people?: string[]
  waitingOn?: string | null
  due?: string | null
  note: string
}
