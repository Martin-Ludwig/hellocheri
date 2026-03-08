# hellocheri

A monorepo containing multiple projects built with Bun, TypeScript, React, and Elysia.

## Projects

| Project | Description |
| ------- | ----------- |
| `notes/` | Notes application |
| `lists/` | Lists application |

## Structure

```
├── framework/       # Shared utilities and classes across all projects
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

---

## Framework Components

The `framework/` folder contains React UI primitives shared across all projects. They live alongside non-UI utilities like `LocalStorageManager`.

### Structure

```
framework/
├── components/
│   ├── TextInput.tsx   # Base text input component
│   └── index.ts        # Barrel export for all components
├── LocalStorageManager.ts
```

### Design principles

| Principle | Description |
| --------- | ----------- |
| **Unstyled by default** | Components carry no hardcoded colors, borders, or spacing. All visual decisions belong to the consuming project. |
| **`className` extension** | Every component accepts a `className` prop. Projects add Tailwind classes there to apply their design system. |
| **Native props spread** | Components extend the underlying HTML element's props (`React.ComponentPropsWithoutRef<'input'>`, etc.) so every native attribute works without extra wiring. |
| **`forwardRef`** | All form elements use `React.forwardRef` so consuming code can access the DOM node (e.g. for focus management or third-party form libraries). |
| **Accessibility built-in** | Labels are bound via `htmlFor`/`id`. Errors and hints are linked via `aria-describedby`. `aria-invalid` is set automatically when an error is present. |
| **TypeScript strict** | Props interfaces are exported so projects can build on them with `extends`. |

### How a project uses a framework component

```tsx
// lists/packages/frontend/src/components/ListInput.tsx
import { AppTextInput } from "@framework/components";

export function ListInput(props: React.ComponentPropsWithoutRef<"input">) {
  return (
    <AppTextInput
      {...props}
      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}
```

The framework component provides structure and accessibility; the project component provides the look.

### Component catalogue

| Component | File | Description |
| --------- | ---- | ----------- |
| `AppTextInput` | `framework/components/AppTextInput.tsx` | Base text input with optional label, error, and hint slots |

### Adding a new framework component

1. Create `framework/components/MyComponent.tsx`
2. Export it from `framework/components/index.ts`
3. Add a row to the catalogue table above
4. Document the API in `docs/mycomponent.md`
5. Write tests in `tests/MyComponent.test.tsx`
