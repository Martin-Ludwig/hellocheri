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

## Framework React Components

- React component tests need a DOM environment — configure `happy-dom` via `bunfig.toml` in the package: `[test] preload = ["happy-dom"]`
- Install `happy-dom` and `@testing-library/react` as `devDependencies` in the package that owns the tests (`framework/package.json`)
- Use `React.useId()` to auto-generate stable, unique IDs for label/aria wiring — avoids prop drilling `id` for simple cases
- `React.forwardRef` is required for form inputs so consumers can call `.focus()` or integrate with form libraries
- Base components in `framework/` have no Tailwind classes — projects wrap them and add classes via `className`

## LocalStorageManager (framework/)

- Bun's test environment has no `localStorage` — assign a mock to `globalThis.localStorage` in `beforeEach`
- Use `rehydrate: (raw: unknown) => T` to restore non-serializable types (e.g. `Date`) after JSON.parse
- `enabled: false` is the correct pattern for SSR, testing, and feature-flagged storage
- All storage operations should be wrapped in try/catch — JSON.parse can throw on corrupt data
