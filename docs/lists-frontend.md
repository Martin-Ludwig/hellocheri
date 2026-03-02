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

## Commands

```sh
bun dev        # start with HMR
bun test       # run tests
bun run build  # production build
```
