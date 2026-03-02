# Learning

Insights, patterns, and pitfalls discovered during development.

## Monorepo with Bun Workspaces

- Bun workspaces are configured via `package.json` `workspaces` field at the project root
- Each sub-package gets its own `package.json` with a scoped name (e.g. `@notes/frontend`)
- Run `bun install` at the workspace root to install all dependencies across packages
- `bunfig.toml` at the project root configures Bun behavior per project
- `bun init -y` initialises a blank project non-interactively (creates index.ts, tsconfig.json, .gitignore, README.md, CLAUDE.md)
- Run `bun add` from inside a workspace package dir to add deps to that package's package.json; always follow up with `bun install` at the workspace root
- Bun stores installed packages in `node_modules/.bun/` using its own internal layout (no traditional per-package symlinks at the root level)
- Tailwind CSS v4 package is `tailwindcss`; React types are `@types/react` and `@types/react-dom` (both as devDependencies)
