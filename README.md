# hellocheri

A monorepo containing multiple projects built with Bun, TypeScript, React, and Elysia.

## Projects

| Project | Description |
| ------- | ----------- |
| `notes/` | Notes application |
| `lists/` | Lists application |

## Structure

```
├── shared/          # Shared files across all projects
├── notes/           # Notes project
├── lists/           # Lists project
├── docs.md          # Documentation index
├── CLAUDE.md        # AI assistant conventions
├── ROADMAP.md       # Project roadmap
├── IDEAS.md         # Feature ideas
└── LEARNING.md      # Insights and patterns
```

## Getting Started

Each project is a standalone Bun workspace. Navigate into the project folder and run:

```sh
bun install
bun dev
```
