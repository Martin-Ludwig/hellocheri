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

- React component tests need a DOM environment — install `happy-dom` and `@happy-dom/global-registrator` as devDependencies, then configure two preload files in `bunfig.toml` (see below)
- Install `happy-dom`, `@happy-dom/global-registrator`, and `@testing-library/react` as `devDependencies` in the package that owns the tests
- Use `React.useId()` to auto-generate stable, unique IDs for label/aria wiring — avoids prop drilling `id` for simple cases
- `React.forwardRef` is required for form inputs so consumers can call `.focus()` or integrate with form libraries
- Base components in `framework/` have no Tailwind classes — projects wrap them and add classes via `className`

## SQLite with bun:sqlite (@lists/backend)

- Use `test()` not `it()` — `test()` is the documented API in `bun:test`; `it()` works as an undocumented Jest alias but should be avoided
- `bun:sqlite` is built-in — no extra dependency needed
- DB is initialised by running `schema.sql` via `db.exec(readFileSync(...))` on startup
- Use `INSERT OR IGNORE` for seed data so re-running the schema is safe
- SQLite has no booleans — use `INTEGER` (0/1); SQLite also has no stored procedures
- Derived/computed values (e.g. list `completed`) belong in a VIEW, not a stored column — avoids sync bugs with triggers
- snake_case in DB columns (`list_id`, `created_at`), camelCase in TypeScript (`listId`, `createdAt`) — map at the DB access layer
- Define named row types (e.g. `ListWithStatusRow`, `ListItemRow`) in `@<project>/shared` and import them in the backend — avoids repeating inline anonymous types in every `db.query<{...}, [...]>()` call
- Enum values in TS (`ItemStatus`) mirror the integer primary keys of the lookup table (`item_status`)
- i18n: store machine-readable codes in DB (`"default"`, `"completed"`), translate to display strings in the frontend


## React frontend testing with happy-dom and @testing-library/react

- Bun has no built-in DOM support. Use `@happy-dom/global-registrator` — NOT `environment = "happy-dom"` in bunfig.toml; that key does not exist in Bun 1.3.x.
- Use TWO preload files in `bunfig.toml`: `preload = ["./tests/dom-setup.ts", "./tests/setup.ts"]`
  - `dom-setup.ts`: only `import { GlobalRegistrator } from "@happy-dom/global-registrator"; GlobalRegistrator.register();`
  - `setup.ts`: only `import { cleanup } from "@testing-library/react"; afterEach(() => { cleanup(); });`
- The split is required because ES modules evaluate all imports before any top-level code runs. If `GlobalRegistrator.register()` and `import ... from "@testing-library/react"` are in the same file, `@testing-library/dom`'s `screen` object initialises before the DOM globals are set up — all `screen` queries permanently throw.
- Without `afterEach(cleanup)`, rendered components accumulate across tests in the same file, causing "Found multiple elements" errors
- TypeScript also needs `"DOM"` and `"DOM.Iterable"` in the `lib` array in `tsconfig.json` — without it, VSCode reports "Cannot find name 'document'"
- Elysia does not automatically serialize class instances as JSON — return plain object literals from handlers and define TypeBox `response` schemas explicitly so Elysia sets the correct Content-Type and validates output
- `app.handle(new Request(...))` is the idiomatic way to test Elysia endpoints without starting a real HTTP server
- To return a 404 from an Elysia handler, use `set.status = 404; return { error: "..." }` — do NOT use the `error()` context helper with a typed `response` map, as it causes a 500 instead

## SQLite position assignment — race condition

The current `POST /lists/:id/items` handler computes position with a separate `SELECT COALESCE(MAX(position), -1) + 1` before the `INSERT`. Under concurrent requests these two statements are not atomic, so two items can receive the same position value.

This is acceptable for a single-user todo app (SQLite serializes writes anyway), but would be a real problem with concurrent users or if `(list_id, position)` were given a unique constraint.

Safer options if this ever matters: collapse into a single `INSERT INTO list_items (..., position) SELECT ..., COALESCE(MAX(position), -1) + 1 FROM list_items WHERE list_id = $listId`, or add a `UNIQUE(list_id, position)` constraint and retry on conflict.

## React Router v7

- In v7, `react-router` and `react-router-dom` are merged into a single `react-router` package — import everything from `react-router`
- Use `BrowserRouter` + `Routes` + `Route` for the component-based API
- `useNavigate()` and `useParams()` require a router context — in tests, wrap with `MemoryRouter`
- For navigation tests, render inside `MemoryRouter` with `Routes` so `fireEvent.click` actually transitions to the target route and assertions can check rendered output
- When adding `useNavigate()` to a component, all existing tests for that component must be wrapped in `MemoryRouter` or they will throw `useNavigate() may be used only in the context of a <Router>`
- Bun's `sed -i` operates on the current working directory — always use absolute paths or explicit `--cwd` to avoid corrupting files in unexpected locations

## LocalStorageManager (framework/)

- Bun's test environment has no `localStorage` — assign a mock to `globalThis.localStorage` in `beforeEach`
- Use `rehydrate: (raw: unknown) => T` to restore non-serializable types (e.g. `Date`) after JSON.parse
- `enabled: false` is the correct pattern for SSR, testing, and feature-flagged storage
- All storage operations should be wrapped in try/catch — JSON.parse can throw on corrupt data
