# Plan: HEL-77 — Resolve `document is not defined` in frontend tests

## Task understanding

React component tests using `@testing-library/react` require a DOM environment. Bun's test runner does not provide one by default — it runs in a Node-like environment where `document` is undefined. The `happy-dom` package is already installed, but the `bunfig.toml` files are missing the `environment = "happy-dom"` directive that tells Bun to use it. This causes every `render()` call to throw `ReferenceError: document is not defined`.

Additionally, both `framework/bunfig.toml` and `lists/packages/frontend/bunfig.toml` reference a `./tests/setup.ts` preload file that does not exist in either package. This makes the preload silently do nothing (or could cause its own error depending on Bun version).

## Research

- Bun test environments: set via `environment = "happy-dom"` or `"jsdom"` in `[test]` section of `bunfig.toml`. Happy-dom is the lighter/faster option and is already a dev dependency.
- `@testing-library/react` recommends calling `cleanup()` after each test. With Bun + happy-dom, this must be done manually in a setup file (React Testing Library's automatic cleanup relies on a lifecycle hook that is not always triggered in Bun).
- The setup file just needs to import and register a `afterEach(cleanup)` call.

## Affected locations

| Location | Problem |
|---|---|
| `lists/packages/frontend/tsconfig.json` | `lib` is `["ESNext"]` — missing `"DOM"`, so TypeScript does not know about `document`, `window`, etc. |
| `lists/packages/frontend/bunfig.toml` | Missing `environment = "happy-dom"` |
| `lists/packages/frontend/tests/setup.ts` | File referenced in bunfig.toml but does not exist |
| `framework/bunfig.toml` | Same missing environment directive |
| `framework/tests/setup.ts` | Same missing preload file |

## File count check

Fixing both `lists/frontend` and `framework` requires 5 files, which exceeds the 3-file limit.

**Proposed split:**
- **HEL-77** (this issue): fix `lists/packages/frontend` only — 3 files (at limit)
  - Edit `lists/packages/frontend/tsconfig.json`
  - Edit `lists/packages/frontend/bunfig.toml`
  - Create `lists/packages/frontend/tests/setup.ts`
- **New sub-issue**: fix `framework` — 2 files
  - Edit `framework/bunfig.toml`
  - Create `framework/tests/setup.ts`

## Implementation steps (lists/frontend only)

1. **Edit `lists/packages/frontend/tsconfig.json`** — change `"lib"` from `["ESNext"]` to `["ESNext", "DOM", "DOM.Iterable"]`
2. **Edit `lists/packages/frontend/bunfig.toml`** — add `environment = "happy-dom"` to the `[test]` section
3. **Create `lists/packages/frontend/tests/setup.ts`** — register `afterEach(cleanup)` from `@testing-library/react`

## Tests

Run `bun test` from `lists/packages/frontend/` and confirm all tests in:
- `src/pages/ListIndexPage.test.tsx`
- `src/pages/ListDetailPage.test.tsx`
- `src/components/ListCard.test.tsx`

pass without `document is not defined` errors.

## Documentation updates

- `LEARNING.md` — add note about Bun requiring explicit `environment = "happy-dom"` for React component tests
