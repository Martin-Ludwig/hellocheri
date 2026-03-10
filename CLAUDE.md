# CLAUDE.md

Project conventions and guidelines for AI-assisted development.

## Issue Workflow

Follow these steps for every issue — do NOT skip ahead or start coding without explicit approval.

### 1. Understand the issue
- Read the issue carefully.
- Ask clarifying questions if anything is ambiguous or underspecified.

### 2. Identify gaps
- Check for edge cases, missing requirements, or overlooked dependencies.
- Ask follow-up questions before proceeding.

### 3. Write `plan.md`
Create a `plan.md` in the worktree root covering:

1. **Task understanding** — what the issue is asking for and why
2. **Research** — relevant best practices, patterns, or docs to consult (see [Documentation](#documentation))
3. **Implementation steps** — concrete list of changes to make
4. **Impact analysis** — other files/modules affected that also need updating
5. **Tests** — what tests to write or adjust (see [Testing](#testing))
6. **Documentation updates** — which docs to add or update

### 4. Present the plan
Share `plan.md` with the user for review. Wait for feedback and incorporate any changes.

### 5. Wait for "go"
Do NOT begin implementation until the user explicitly approves with a "go".

### 6. Before pull request delete plan.md.

---

## Package Manager

Always use `bun` over `npm`. Never use `npm`, `npx`, or `yarn`.

## Code Style

- TypeScript strict mode everywhere
- Tailwind CSS (Pro) for styling, no additional UI libraries
- Use English language throughout the entire project (variable names, comments, strings, docs)
- Prefer readable, self-explanatory names over short aliases (e.g. SQL `FROM lists list` not `FROM lists l`)
- Avoid em-dashes, arrow characters (->), and emojis in any written content (docs, comments, strings)

## Project Structure

Each project follows this workspace layout:

```
<project>/
├── packages/
│   ├── shared/      # Types, interfaces, validation shared between frontend and backend
│   ├── frontend/    # React App (Bun bundled)
│   └── backend/     # Elysia REST API
├── package.json     # Workspace root
└── bunfig.toml
```

The repo root also has a `framework/` folder for code shared across multiple projects.

## Testing

- Test runner: `bun test`
- Write tests for every new function, endpoint, and store logic
- Tests MUST pass before code is committed
- Use `test()` — not `it()`. Bun's docs only document `test()`
- Import from `bun:test`: `import { describe, test, expect } from "bun:test"`

## Documentation

Per-package documentation lives in `docs/`. Read the relevant file before working on a package.

After EVERY code change, check and update these files if needed:

| File | When to update |
| ---- | -------------- |
| `ROADMAP.md` | Check off roadmap checkboxes, add new phases/tasks as needed |
| `IDEAS.md` | Add new feature ideas that come up during work |
| `LEARNING.md` | Document new insights, patterns, pitfalls |
| `CLAUDE.md` | Add new commands, key files, conventions as needed |

## Key Commands

```sh
bun install          # Install dependencies
bun dev              # Start dev server
bun test             # Run tests
bun run build        # Build for production
```
