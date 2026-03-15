# Roadmap

## Phase 1 — Foundation

- [x] Define monorepo structure and conventions (HEL-5)
- [ ] Scaffold `notes` project
- [x] Scaffold `lists` project (HEL-6 — lists/frontend initialised with react, react-dom, tailwindcss)
- [x] Rename `shared/` to `framework/`, add LocalStorageManager class with docs and tests (HEL-7)
- [x] Add AppTextInput base component to framework with docs and tests (HEL-25)

## Phase 2 — Notes

- [ ] Notes backend (Elysia REST API)
- [ ] Notes frontend (React)
- [ ] Notes shared types

## Phase 3 — Lists

- [x] Lists backend (Elysia REST API) — GET /lists, POST /lists (HEL-69)
- [x] Lists frontend (React) — index page with list overview and create modal (HEL-69)
- [x] Lists shared types + DB schema (HEL-8)
- [x] Lists backend — item endpoints: GET /lists/:id, GET /lists/:id/items, PATCH /lists/:id/items/:itemId, DELETE /lists/:id/items/:itemId (HEL-70)
- [x] Lists frontend — detail page with items, check off, delete (HEL-71)
