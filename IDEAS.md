# Ideas

Feature ideas and future improvements to explore.

## Lists

- Make item position assignment atomic: replace the two-step SELECT MAX + INSERT in `POST /lists/:id/items` with a single `INSERT ... SELECT` or add a `UNIQUE(list_id, position)` constraint with retry logic, to eliminate the race condition under concurrent writes.

## Cross-project

- Shared authentication layer across all projects
- Unified design system / component library using Tailwind CSS Pro
- Monorepo-level CI/CD pipeline with per-project test runs
