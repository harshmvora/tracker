# Tracker

A personal end-of-day project tracker that refuses to be a template. You write the day down in plain words; Claude sorts it into projects, each surfaced with its single next move — lit like a desk lamp on what's yours to do tonight.

Bring your own Anthropic API key (entered in the app, stored only in your browser).

## What it does

- **Dump, don't fill forms.** Type whatever happened tonight; Claude structures it into projects, matching existing ones by meaning and creating new ones as needed.
- **One next move per project.** Each project shows its first open task (or a dump-set next action), lit in amber. Check it off and the lamp walks to the next.
- **Nested tasks.** A task can hold subtasks, and those their own — any task can grow into a small project.
- **Two voices.** A serif for your words, a mono for the system's, on a warm, low-contrast night desk.
- Everything lives in your browser's `localStorage` — no account, nothing synced except the direct call to Anthropic when you file a dump.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL, click **settings**, paste an Anthropic API key ([console](https://console.anthropic.com/settings/keys)), then file your first dump. No projects yet? Hit **load examples**.

## Model / cost

The model is one constant in `src/lib/claude.ts` (`MODEL`). Defaults to `claude-opus-4-8`; switch to `claude-sonnet-4-6` for a cheaper, still-capable structuring pass. Each dump is a small request.

## Deploy

Static SPA — `npm run build` outputs `dist/`, deployable to Vercel/Netlify/any static host with zero config (Vite preset). The API key is entered per-user in the browser, so there's nothing server-side to configure.

## Stack

Vite, React 19, TypeScript, Tailwind v4, Zustand (localStorage persistence), the Anthropic TypeScript SDK (browser), lucide-react.
