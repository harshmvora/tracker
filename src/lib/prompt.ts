import type { Project } from '../types'

/**
 * The single tool Claude is forced to call. Its input schema *is* the structured
 * output contract — the model can only answer by filling this in.
 */
export const STRUCTURE_TOOL = {
  name: 'record_updates',
  description: "Record the structured project updates extracted from the user's brain-dump.",
  input_schema: {
    type: 'object' as const,
    properties: {
      updates: {
        type: 'array',
        description: 'One entry per distinct project mentioned in the dump.',
        items: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description:
                'The project this update belongs to. Reuse an existing project name verbatim when one fits by meaning; otherwise give the new project a concise name.',
            },
            isNew: {
              type: 'boolean',
              description: 'True only if this project is not already in the provided list.',
            },
            status: {
              type: 'string',
              enum: ['active', 'waiting', 'stalled', 'done'],
              description: 'Current status, if it can be inferred from the dump.',
            },
            nextAction: {
              type: 'string',
              description:
                'The single most useful next step to move this project forward. Be specific and concrete. Always provide one unless the project is done.',
            },
            people: {
              type: 'array',
              items: { type: 'string' },
              description: 'People involved or mentioned for this project.',
            },
            waitingOn: {
              type: 'string',
              description: 'Who or what this project is blocked on, if anything.',
            },
            due: {
              type: 'string',
              description: 'A due date in YYYY-MM-DD form, if one is mentioned or clearly implied.',
            },
            note: {
              type: 'string',
              description: 'A terse, distilled one-line log of what happened in this dump.',
            },
          },
          required: ['projectName', 'isNew', 'note'],
          additionalProperties: false,
        },
      },
    },
    required: ['updates'],
    additionalProperties: false,
  },
}

export const SYSTEM_PROMPT = `You maintain a personal project tracker for a busy person who juggles many projects at once.

You are given:
1. The projects already being tracked (name, status, current next action).
2. A freeform end-of-day brain-dump.

Your job: read the dump and extract updates — one per distinct project mentioned.

Rules:
- Match each update to an existing project by MEANING, not exact string. "The Henderson kitchen" and "Henderson reno" are the same project. When you match, reuse the existing project's name verbatim and set isNew=false.
- Only set isNew=true when the dump genuinely introduces a project that is not in the list.
- Always produce a concrete, specific nextAction (the single most useful next step) unless the project is clearly finished. Prefer "Email Sara the revised quote" over vague "follow up".
- Keep note terse: what actually happened, distilled to one line.
- Infer status, people, waitingOn, and due only when the dump supports it; otherwise omit them.
- If the dump describes work with no clear project, create a sensibly-named project for it.
- Set status to "done" when the dump says the work is finished.`

export function buildUserMessage(projects: Project[], dump: string, today: string): string {
  const existing = projects.map((p) => ({
    name: p.name,
    status: p.status,
    nextAction: p.nextAction,
  }))
  return [
    `Today is ${today}.`,
    '',
    'Projects currently tracked:',
    existing.length ? JSON.stringify(existing, null, 2) : '(none yet)',
    '',
    'Brain-dump:',
    dump.trim(),
  ].join('\n')
}
