# CLAUDE.md

Project conventions and guidelines for AI-assisted development.

## Issue Workflow

Follow these steps for every issue, do NOT skip ahead or start coding without explicit approval.

### 1. Understand the issue
- Read the issue carefully.
- Ask clarifying questions if anything is ambiguous or underspecified.

### 2. Identify gaps
- Check for edge cases, missing requirements, or overlooked dependencies.
- Ask follow-up questions before proceeding.

### 3. Check issue size
- Estimate how many files will need to change.
- If more than 3 files are needed, stop and create smaller sequential sub-issues in Linear.app.
- plan.md and docs changes are excluded from that limit.
- Present the proposed sub-issues and wait for approval before creating them in Linear.app.
- Only proceed if the issue fits within the 3-file limit.

### 4. Write `plan.md`
Create a `plan.md` in the worktree root covering:

1. **Task understanding** — what the issue is asking for and why
2. **Research** — relevant best practices, patterns, or docs to consult (see [Documentation](#documentation))
3. **Implementation steps** — concrete list of changes to make
4. **Impact analysis** — other files/modules affected that also need updating
5. **Tests** — what tests to write or adjust (see [Testing](#testing))
6. **Documentation updates** — which docs to add or update

### 5. Present the plan
Share `plan.md` with the user for review. Wait for feedback and incorporate any changes.

### 6. Wait for "go"
Do NOT begin implementation until the user explicitly approves with a "go".

### 7. Before pull request 
Before pull request, Delete plan.md. But decide first: If the plan contains non-obvious architectural decisions or tradeoffs worth preserving, extract them into issue-worklogs/<ISSUE-ID>.md at the repo root (next to framework/).

---

## Code Style & Readability

Write code that is easy to read and maintain. Prefer clarity over cleverness and simplicity over efficiency, unless performance is explicitly required.

### Philosophy
- Code should read like plain English where possible
- Comments explain *why*, not *what*
- When there are multiple ways to solve something, name the tradeoffs and wait
  for a decision — do not silently pick the cleverest solution
- If in doubt, write the boring solution

### Language & Formatting
- Use English language throughout the entire project (variable names, comments, strings, docs)
- No em-dashes, arrow characters (->), or emojis in any written content
- TypeScript strict mode everywhere
- Tailwind CSS (Pro) for styling, no additional UI libraries

### Naming
- Use long, descriptive names -- for variables, functions, and types
- No abbreviations, no single-letter variables outside of tiny loops
- Prefer readable, self-explanatory names over short aliases (e.g. SQL `FROM lists list` not `FROM lists l`)

### Structure
- One function does one thing
- Flat over nested and use early returns and guard clauses
- No deeply chained methods or one-liners that require a second read
- Always use `@` path aliases instead of relative imports


### Patterns
- Solve the same problem the same way everywhere, no creative variations

---

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

---

## Linear

Config: `.linear.toml` at the repo root (workspace, team, sort order).

```sh
bunx @schpet/linear-cli issue list
bunx @schpet/linear-cli issue view HEL-123
bunx @schpet/linear-cli issue create --title "..." --description-file /tmp/desc.md --parent HEL-123
bunx @schpet/linear-cli issue update HEL-123 --status "In Progress"
```

Always use `--description-file` (not `--description`) for multi-line content to avoid shell escaping issues.

---

## Package Manager

Always use `bun` over `npm`. Never use `npm`, `npx`, or `yarn`.

```sh
bun install          # Install dependencies
bun dev              # Start dev server
bun test             # Run tests
bun run build        # Build for production
```

---

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
