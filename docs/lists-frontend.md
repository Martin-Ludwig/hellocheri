# lists/frontend

React frontend bundled with Bun.

## Stack

- React 19 + TypeScript (strict)
- Tailwind CSS v4
- Bun bundler (no Vite/webpack)

## Key conventions

- Entry: `src/index.tsx` rendered into an HTML file served via `Bun.serve()`
- HTML files import `.tsx` directly — Bun transpiles automatically
- CSS files imported directly in `.tsx`; Bun bundles them

## Component structure

```
src/
├── index.html              # HTML shell — imports index.css and index.tsx
├── index.css               # Tailwind v4 entry (@import "tailwindcss")
├── index.tsx               # React root — renders <App /> into #root
├── App.tsx                 # Root component
├── pages/
│   └── ListIndexPage.tsx   # Index page: title, list overview, create button
└── components/
    ├── ListCard.tsx        # Single list card: name + completion badge
    └── CreateListModal.tsx # Modal to create a new list
```

## API

The backend runs on `http://localhost:3001`. Endpoints used by the frontend:

| Method | Path     | Description              |
|--------|----------|--------------------------|
| GET    | /lists   | Fetch all lists          |
| POST   | /lists   | Create a list            |

## Testing

Tests use `@testing-library/react` and `happy-dom`. The test environment is
configured in `bunfig.toml` (preloads `tests/setup.ts`).

Important: do not import `@testing-library/react` in `tests/setup.ts` — it
evaluates `screen` at module load time before the DOM globals are set up.
Use a dynamic import inside `afterEach` for `cleanup` instead.

## Commands

```sh
bun dev        # start with HMR
bun test       # run tests
bun run build  # production build
```
