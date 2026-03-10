# Plan: HEL-25 — AppTextInput

## 1. Task Understanding

**What:** Create a base React text input component (`AppTextInput`) in `framework/components/`. Shared across all projects (notes, lists, …).

**Why:** Projects need a consistent, accessible input primitive. The base component handles structure and accessibility; each project layers its own Tailwind classes on top.

**Key constraint:** No hardcoded colors, borders, or spacing — purely structural. Projects own all visual decisions via `className`.

---

## 2. Research

### Pattern: Unstyled base component
- Accepts all native `<input>` HTML attributes via `React.ComponentPropsWithoutRef<"input">` — no re-declaration of `placeholder`, `disabled`, `type`, etc.
- `className` forwarded directly to the `<input>` so projects can apply Tailwind classes freely.

### Pattern: `forwardRef`
- Form inputs must support `ref` for focus management and third-party form libraries (e.g. React Hook Form).
- Use `React.forwardRef<HTMLInputElement, AppTextInputProps>`.

### Accessibility
- Label linked to input via matching `id` / `htmlFor` — auto-generated via `React.useId()` if not provided.
- Error and hint text linked via `aria-describedby`.
- `aria-invalid="true"` set automatically when `error` prop is present.

### Bun workspace resolution for `@framework`
- `framework/package.json` with `"name": "@framework"` registers the folder as a named package.
- Each project root adds `"../framework"` to its `workspaces` array — Bun symlinks it into `node_modules/@framework`.
- Each consuming frontend package declares `"@framework": "workspace:*"` as a dependency.

### DOM environment for React tests
- React component tests need a DOM environment. Bun does not provide one out of the box.
- Solution: install `happy-dom`, create `framework/tests/setup.ts` that initialises globals, and configure `framework/bunfig.toml` to preload it.
- Important: `happy-dom`'s internal `this.window` must have native error constructors (`SyntaxError`, `TypeError`, …) copied onto it, otherwise `querySelectorAll` throws at runtime.
- Use `@testing-library/react` for component assertions.
- Use `test()` from `bun:test` — not `it()` (not documented by Bun).

---

## 3. Implementation — What Was Built

### New files

| File | Description |
| ---- | ----------- |
| `framework/package.json` | Package identity (`@framework`), devDeps for testing |
| `framework/components/AppTextInput.tsx` | The component |
| `framework/components/index.ts` | Barrel export |
| `framework/bunfig.toml` | Preloads `tests/setup.ts` for DOM environment |
| `framework/tests/setup.ts` | Initialises happy-dom globals including error constructors |
| `framework/tests/AppTextInput.test.tsx` | 11 tests, all passing |
| `docs/textinput.md` | API reference and usage examples |

### Modified files

| File | Change |
| ---- | ------ |
| `lists/package.json` | Added `"../framework"` to `workspaces` |
| `notes/package.json` | Added `"../framework"` to `workspaces` |
| `lists/packages/frontend/package.json` | Added `"@framework": "workspace:*"` to dependencies |
| `notes/packages/frontend/package.json` | Added `"@framework": "workspace:*"` to dependencies |
| `docs.md` | Added `AppTextInput` link under Framework |
| `README.md` | Added component catalogue section with `AppTextInput` entry |
| `ROADMAP.md` | Ticked HEL-25 as completed |
| `LEARNING.md` | Documented DOM test setup pattern |
| `CLAUDE.md` | Added `test()` over `it()` convention |

---

## 4. Component API

```tsx
export interface AppTextInputProps extends React.ComponentPropsWithoutRef<"input"> {
  label?: string;  // renders a <label> bound via htmlFor
  error?: string;  // renders error text; sets aria-invalid + aria-describedby
  hint?: string;   // renders helper text below the input
}

export const AppTextInput = React.forwardRef<HTMLInputElement, AppTextInputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => { ... }
);
```

Rendered DOM structure:

```html
<div>
  <label for="...">...</label>         <!-- only if label provided -->
  <input aria-invalid aria-describedby="..." class="..." />
  <span id="...-hint">...</span>       <!-- only if hint provided -->
  <span id="...-error">...</span>      <!-- only if error provided -->
</div>
```

---

## 5. Tests

File: `framework/tests/AppTextInput.test.tsx` — **11/11 passing**

| Test | What it verifies |
| ---- | ---------------- |
| Renders without props | `<input>` is in the DOM |
| Renders label | `<label>` present; `htmlFor` matches input `id` |
| Renders hint | Hint text visible |
| Renders error | Error text visible |
| Sets aria-invalid on error | `aria-invalid="true"` when error prop present |
| No aria-invalid without error | Attribute absent when no error |
| Forwards className | Custom class on `<input>` |
| Forwards native props | `placeholder`, `disabled` reach the `<input>` |
| Links hint via aria-describedby | Hint element referenced by input |
| Links error via aria-describedby | Error element referenced by input |
| forwardRef | `ref.current` is the `<input>` DOM node |

---

## 6. Key Decisions Made During Implementation

- **Component named `AppTextInput`** (not `TextInput`) — `App` prefix marks it as a framework-level primitive.
- **Tests in `framework/`** (not root `tests/`) — keeps test deps and DOM setup self-contained.
- **happy-dom error constructor fix** — `this.window.SyntaxError` in happy-dom's selector engine is `undefined` unless native error types are explicitly copied onto the Window instance. Documented in `LEARNING.md`.
- **`test()` not `it()`** — Bun docs only document `test()`. Convention added to `CLAUDE.md`.
