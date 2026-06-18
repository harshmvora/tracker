import Anthropic from '@anthropic-ai/sdk'
import type { Project, ProjectUpdate } from '../types'
import { STRUCTURE_TOOL, SYSTEM_PROMPT, buildUserMessage } from './prompt'

/**
 * Default to the most capable model. This is a lightweight structuring task, so
 * switching to 'claude-sonnet-4-6' here cuts cost substantially with little
 * quality loss — change this one line if you want the cheaper/faster option.
 */
export const MODEL = 'claude-opus-4-8'

/**
 * Send a freeform brain-dump (plus the projects we already know about) to Claude
 * and get back a structured array of updates. Forced tool_choice guarantees the
 * model answers by filling in the tool schema, so the result is always parseable.
 */
export async function structureDump(
  apiKey: string,
  projects: Project[],
  dump: string,
): Promise<ProjectUpdate[]> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const today = new Date().toISOString().slice(0, 10)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [STRUCTURE_TOOL as Anthropic.Tool],
    tool_choice: { type: 'tool', name: STRUCTURE_TOOL.name },
    messages: [{ role: 'user', content: buildUserMessage(projects, dump, today) }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return structured updates — try rephrasing your dump.')
  }

  const input = toolUse.input as { updates?: ProjectUpdate[] }
  return input.updates ?? []
}
