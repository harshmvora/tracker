import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import type { Task } from '../types'
import { useStore } from '../store'

function Checkbox({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={done ? 'mark not done' : 'mark done'}
      className={`grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[4px] border transition ${
        done
          ? 'border-mark bg-mark/20 text-mark'
          : 'border-rule text-transparent hover:border-muted hover:text-muted'
      }`}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </button>
  )
}

function TaskNode({
  projectId,
  task,
  depth,
}: {
  projectId: string
  task: Task
  depth: number
}) {
  const toggleTask = useStore((s) => s.toggleTask)
  const editTask = useStore((s) => s.editTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const addTask = useStore((s) => s.addTask)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [adding, setAdding] = useState(false)
  const [sub, setSub] = useState('')

  return (
    <div>
      <div className="group flex items-center gap-2 py-1" style={{ paddingLeft: depth * 18 }}>
        <Checkbox done={task.done} onClick={() => toggleTask(projectId, task.id)} />
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setEditing(false)
              const t = title.trim()
              if (t && t !== task.title) editTask(projectId, task.id, t)
              else setTitle(task.title)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') {
                setTitle(task.title)
                setEditing(false)
              }
            }}
            className="flex-1 border-b border-rule bg-transparent font-serif text-[15px] text-ink outline-none focus:border-ink"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={`flex-1 truncate text-left font-serif text-[15px] ${
              task.done ? 'text-muted line-through' : 'text-ink'
            }`}
          >
            {task.title}
          </button>
        )}
        <div className="flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => setAdding((a) => !a)}
            aria-label="add subtask"
            className="text-muted hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (task.tasks.length === 0 || confirm('Delete this task and its subtasks?'))
                deleteTask(projectId, task.id)
            }}
            aria-label="delete task"
            className="text-muted hover:text-[#d98c8c]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {task.tasks.map((c) => (
        <TaskNode key={c.id} projectId={projectId} task={c} depth={depth + 1} />
      ))}

      {adding && (
        <div className="flex items-center gap-2 py-1" style={{ paddingLeft: (depth + 1) * 18 }}>
          <span className="h-[15px] w-[15px] shrink-0 rounded-[4px] border border-dashed border-rule" />
          <input
            autoFocus
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const t = sub.trim()
                if (t) {
                  addTask(projectId, task.id, t)
                  setSub('')
                }
              }
              if (e.key === 'Escape') {
                setAdding(false)
                setSub('')
              }
            }}
            onBlur={() => {
              if (!sub.trim()) setAdding(false)
            }}
            placeholder="add a subtask"
            className="flex-1 border-b border-rule bg-transparent font-serif text-[15px] text-ink outline-none placeholder:text-muted focus:border-ink"
          />
        </div>
      )}
    </div>
  )
}

export function TaskTree({ projectId, tasks }: { projectId: string; tasks: Task[] }) {
  const addTask = useStore((s) => s.addTask)
  const [root, setRoot] = useState('')

  return (
    <div>
      {tasks.map((t) => (
        <TaskNode key={t.id} projectId={projectId} task={t} depth={0} />
      ))}
      <div className="mt-0.5 flex items-center gap-2 py-1">
        <span className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[4px] border border-dashed border-rule text-muted">
          <Plus className="h-3 w-3" />
        </span>
        <input
          value={root}
          onChange={(e) => setRoot(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const t = root.trim()
              if (t) {
                addTask(projectId, null, t)
                setRoot('')
              }
            }
          }}
          placeholder="add a task"
          className="flex-1 border-b border-transparent bg-transparent font-serif text-[15px] text-ink outline-none placeholder:text-muted focus:border-rule"
        />
      </div>
    </div>
  )
}
