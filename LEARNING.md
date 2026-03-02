# Learning

Insights, patterns, and pitfalls discovered during development.

## Monorepo with Bun Workspaces

- Bun workspaces are configured via `package.json` `workspaces` field at the project root
- Each sub-package gets its own `package.json` with a scoped name (e.g. `@notes/frontend`)
- Run `bun install` at the workspace root to install all dependencies across packages
- `bunfig.toml` at the project root configures Bun behavior per project
