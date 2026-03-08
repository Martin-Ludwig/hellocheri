# CLAUDE.md

Project conventions and guidelines for AI-assisted development.

## Package Manager

Always use `bun` over `npm`. Never use `npm`, `npx`, or `yarn`.

## Code Style

- TypeScript strict mode everywhere
- Tailwind CSS (Pro) for styling — no additional UI libraries
- Use English language throughout the entire project (variable names, comments, strings, docs)
- Prefer readable, self-explanatory names over short aliases — e.g. SQL `FROM lists list` not `FROM lists l`

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

## Docs

Per-package documentation lives in `docs/`. Read the relevant file before working on a package.

## Documentation

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
