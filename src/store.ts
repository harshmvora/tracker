import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, ProjectUpdate, Task } from './types'

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function nowISO(): string {
  return new Date().toISOString()
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

// --- recursive task-tree helpers (all immutable) ---

function addUnder(tasks: Task[], parentId: string | null, task: Task): Task[] {
  if (parentId === null) return [...tasks, task]
  return tasks.map((t) =>
    t.id === parentId
      ? { ...t, tasks: [...t.tasks, task] }
      : { ...t, tasks: addUnder(t.tasks, parentId, task) },
  )
}

function toggleDone(tasks: Task[], id: string): Task[] {
  return tasks.map((t) =>
    t.id === id ? { ...t, done: !t.done } : { ...t, tasks: toggleDone(t.tasks, id) },
  )
}

function setTaskTitle(tasks: Task[], id: string, title: string): Task[] {
  return tasks.map((t) =>
    t.id === id ? { ...t, title } : { ...t, tasks: setTaskTitle(t.tasks, id, title) },
  )
}

function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((t) => t.id !== id).map((t) => ({ ...t, tasks: removeTask(t.tasks, id) }))
}

const EXAMPLES: Project[] = [
  {
    id: 'ex1',
    name: 'Kitchen renovation',
    status: 'active',
    nextAction: 'Send the revised cabinet quote to Priya for sign-off',
    tasks: [
      {
        id: 'k1',
        title: 'Reroute the plumbing with Marco',
        done: false,
        tasks: [
          { id: 'k1a', title: 'Get the plumber quote', done: true, tasks: [] },
          { id: 'k1b', title: 'Confirm the new layout', done: false, tasks: [] },
        ],
      },
      { id: 'k2', title: 'Send Priya the revised quote', done: false, tasks: [] },
    ],
    people: ['Priya', 'Marco (contractor)'],
    due: '2026-06-24',
    tags: [],
    createdAt: '2026-06-01T09:00:00.000Z',
    lastTouched: '2026-06-16T18:30:00.000Z',
    log: [
      { id: 'ex1a', at: '2026-06-16T18:30:00.000Z', text: 'Marco walked the site — plumbing needs rerouting, cost up ~8%.' },
      { id: 'ex1b', at: '2026-06-10T12:00:00.000Z', text: 'Chose quartz over granite for the counters.' },
    ],
  },
  {
    id: 'ex2',
    name: 'React Summit talk',
    status: 'waiting',
    nextAction: 'Nudge Dana about the slide deadline once the slot is confirmed',
    tasks: [],
    people: ['Dana (organizer)'],
    waitingOn: 'Dana to confirm 20 vs 40 min slot',
    tags: [],
    createdAt: '2026-05-28T09:00:00.000Z',
    lastTouched: '2026-06-14T15:00:00.000Z',
    log: [
      { id: 'ex2a', at: '2026-06-14T15:00:00.000Z', text: 'Abstract submitted. Holding on the outline until slot length is set.' },
    ],
  },
  {
    id: 'ex3',
    name: 'Backend hire',
    status: 'active',
    nextAction: 'Schedule the system-design round for Aisha',
    tasks: [
      { id: 'b1', title: 'Confirm panel availability', done: true, tasks: [] },
      { id: 'b2', title: 'Schedule the system-design round', done: false, tasks: [] },
    ],
    people: ['Aisha (candidate)', 'Tom'],
    tags: [],
    createdAt: '2026-06-05T09:00:00.000Z',
    lastTouched: '2026-06-17T08:00:00.000Z',
    log: [
      { id: 'ex3a', at: '2026-06-17T08:00:00.000Z', text: 'Aisha passed the screen — strong on distributed systems. Tom runs the next round.' },
    ],
  },
  {
    id: 'ex4',
    name: 'Q2 taxes',
    status: 'stalled',
    nextAction: 'Pull the Q2 expense export and send it to Lena',
    tasks: [],
    people: ['Lena (accountant)'],
    due: '2026-07-15',
    tags: [],
    createdAt: '2026-05-12T09:00:00.000Z',
    lastTouched: '2026-05-20T11:00:00.000Z',
    log: [
      { id: 'ex4a', at: '2026-05-20T11:00:00.000Z', text: "Lena asked for the expense export. Haven't pulled it yet." },
    ],
  },
]

interface State {
  apiKey: string
  projects: Project[]
  setApiKey: (k: string) => void
  applyUpdates: (updates: ProjectUpdate[]) => { created: number; updated: number }
  updateProject: (id: string, patch: Partial<Project>) => void
  renameProject: (id: string, name: string) => void
  deleteProject: (id: string) => void
  addTask: (projectId: string, parentId: string | null, title: string) => void
  toggleTask: (projectId: string, taskId: string) => void
  editTask: (projectId: string, taskId: string, title: string) => void
  deleteTask: (projectId: string, taskId: string) => void
  loadExamples: () => void
  clearAll: () => void
  importProjects: (projects: Project[]) => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      apiKey: '',
      projects: [],

      setApiKey: (k) => set({ apiKey: k.trim() }),

      applyUpdates: (updates) => {
        const projects = [...get().projects]
        let created = 0
        let updated = 0

        for (const u of updates) {
          const target = normalize(u.projectName)
          let idx = projects.findIndex((p) => normalize(p.name) === target)
          if (idx === -1 && !u.isNew) {
            idx = projects.findIndex(
              (p) => normalize(p.name).includes(target) || target.includes(normalize(p.name)),
            )
          }

          const note = u.note?.trim()
          const logEntry = note ? [{ id: uid(), at: nowISO(), text: note }] : []

          if (idx === -1) {
            projects.unshift({
              id: uid(),
              name: u.projectName.trim(),
              status: u.status ?? 'active',
              nextAction: u.nextAction?.trim() ?? '',
              tasks: [],
              people: u.people ?? [],
              waitingOn: u.waitingOn ?? undefined,
              due: u.due ?? undefined,
              tags: [],
              createdAt: nowISO(),
              lastTouched: nowISO(),
              log: logEntry,
            })
            created++
          } else {
            const p = projects[idx]
            projects[idx] = {
              ...p,
              status: u.status ?? p.status,
              nextAction: u.nextAction?.trim() ? u.nextAction.trim() : p.nextAction,
              people:
                u.people && u.people.length
                  ? Array.from(new Set([...p.people, ...u.people]))
                  : p.people,
              waitingOn: u.waitingOn === null ? undefined : u.waitingOn ?? p.waitingOn,
              due: u.due === null ? undefined : u.due ?? p.due,
              lastTouched: nowISO(),
              log: [...logEntry, ...p.log],
            }
            updated++
          }
        }

        set({ projects })
        return { created, updated }
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, lastTouched: nowISO() } : p,
          ),
        })),

      renameProject: (id, name) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, name: name.trim() || p.name, lastTouched: nowISO() } : p,
          ),
        })),

      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      addTask: (projectId, parentId, title) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: addUnder(p.tasks ?? [], parentId, {
                    id: uid(),
                    title: title.trim(),
                    done: false,
                    tasks: [],
                  }),
                  lastTouched: nowISO(),
                }
              : p,
          ),
        })),

      toggleTask: (projectId, taskId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: toggleDone(p.tasks ?? [], taskId), lastTouched: nowISO() }
              : p,
          ),
        })),

      editTask: (projectId, taskId, title) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: setTaskTitle(p.tasks ?? [], taskId, title.trim()) }
              : p,
          ),
        })),

      deleteTask: (projectId, taskId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, tasks: removeTask(p.tasks ?? [], taskId) } : p,
          ),
        })),

      loadExamples: () => set({ projects: EXAMPLES.map((p) => ({ ...p })) }),

      clearAll: () => set({ projects: [] }),

      importProjects: (projects) => set({ projects }),
    }),
    { name: 'tracker-state' },
  ),
)
