# Plan: HEL-25 — AppTextInput

## 1. Task Understanding

**What:** Create a base React text input component (`AppTextInput`) in `framework/components/`. It is shared across all projects (notes, lists, …).

**Why:** Projects need a consistent, accessible input primitive. The base component handles structure and accessibility; each project layers its own Tailwind classes on top.

**Key constraint:** No hardcoded colors, borders, or spacing — purely structural. Projects own all visual decisions via `className`.

---

## 2. Research

### Pattern: Unstyled base component
- The component accepts all native `<input>` HTML attributes via `React.ComponentPropsWithoutRef<"input">` — no re-declaration of `placeholder`, `disabled`, `type`, etc.
- `className` is forwarded directly to the `<input>` element so projects can apply Tailwind classes freely.

### Pattern: `forwardRef`
- Form inputs must support `ref` for focus management, scroll, and third-party form libraries (e.g. React Hook Form).
- Use `React.forwardRef<HTMLInputElement, AppTextInputProps>`.

### Accessibility
- Label linked to input via matching `id` / `htmlFor` (auto-generated if not provided via `id` prop).
- Error text and hint text linked via `aria-describedby`.
- `aria-invalid="true"` set automatically when `error` is present.

### Bun workspace resolution for `@framework`
- A `package.json` in `framework/` with `"name": "@framework"` registers the folder as a named package.
- Each project root (`lists/package.json`, `notes/package.json`) adds `"../framework"` to its `workspaces` array — Bun symlinks it into that project's `node_modules/@framework`.
- Each consuming frontend package declares `"@framework": "workspace:*"` as a dependency.

### DOM environment for React tests
- Existing tests (`tests/LocalStorageManager.test.ts`) use `bun:test` without DOM.
- React component tests need a DOM. Bun supports `happy-dom` via `bunfig.toml` at the root.
- Requires installing `happy-dom` and creating a root-level `bunfig.toml` with `[test] preload = ["happy-dom"]`.
- `@testing-library/react` + `@testing-library/dom` are needed for component assertions.

---

## 3. Implementation Steps

1. **`framework/package.json`** — create; name `@framework`, point main to `components/index.ts`
2. **`framework/components/AppTextInput.tsx`** — create the component (see API below)
3. **`framework/components/index.ts`** — barrel export
4. **`lists/package.json`** — add `"../framework"` to `workspaces`
5. **`notes/package.json`** — same
6. **`lists/packages/frontend/package.json`** — add `"@framework": "workspace:*"` to `dependencies`
7. **`notes/packages/frontend/package.json`** — same
8. **`framework/bunfig.toml`** — create; configure `[test]` with `happy-dom` preload
9. **`framework/tests/AppTextInput.test.tsx`** — write tests (see section 5)
10. **`docs/textinput.md`** — API reference and usage examples
11. **`docs.md`** — add entry for `AppTextInput` under Framework
12. **`README.md`** — component catalogue already updated (AppTextInput row exists)
13. **`ROADMAP.md`** — add HEL-25 as completed item
14. **`LEARNING.md`** — document DOM test setup pattern

### Component API

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
  <label for="...">...</label>       <!-- only if label prop provided -->
  <input aria-invalid aria-describedby="..." class="..." />
  <span id="...-hint">...</span>     <!-- only if hint prop provided -->
  <span id="...-error">...</span>    <!-- only if error prop provided -->
</div>
```

---

## 4. Impact Analysis

| File | Change | Reason |
| ---- | ------ | ------ |
| `lists/package.json` | Add `"../framework"` to workspaces | Required for `@framework` to resolve |
| `notes/package.json` | Add `"../framework"` to workspaces | Same |
| `lists/packages/frontend/package.json` | Add `@framework` dependency | Required for import resolution |
| `notes/packages/frontend/package.json` | Add `@framework` dependency | Same |
| `framework/bunfig.toml` | New file | Required for DOM environment in framework tests |
| `docs.md` | Add AppTextInput link | Documentation index |
| `README.md` | Already updated | Component catalogue |
| `ROADMAP.md` | Tick HEL-25 | Keeps roadmap current |
| `LEARNING.md` | Add DOM test setup entry | Useful for next React component |

No existing source files are modified.

---

## 5. Tests

File: `tests/AppTextInput.test.tsx`

| Test | What it verifies |
| ---- | ---------------- |
| Renders without props | Component mounts, an `<input>` is in the DOM |
| Renders label | `<label>` present; `htmlFor` matches input `id` |
| Renders hint | Hint text visible; linked via `aria-describedby` |
| Renders error | Error text visible; `aria-invalid="true"`; linked via `aria-describedby` |
| No error → no aria-invalid | `aria-invalid` absent when no error prop |
| Native props forwarded | `placeholder`, `disabled`, `type="email"` reach the `<input>` |
| className forwarded | Custom class appears on the `<input>` |
| forwardRef | `ref.current` points to the `<input>` DOM node |

**Setup required before tests can run:**
- `happy-dom` and `@testing-library/react` installed as devDependencies in `framework/package.json`
- `framework/bunfig.toml` with `[test] preload = ["happy-dom"]`

Tests live at `framework/tests/AppTextInput.test.tsx` and are run with `bun test` from inside `framework/`.

---

## 6. Documentation Updates

| File | Change |
| ---- | ------ |
| `docs/textinput.md` | New file — API reference, props table, usage examples for base + project-extended usage |
| `docs.md` | Add `AppTextInput` link under Framework section |
| `README.md` | Component catalogue row already added |
| `ROADMAP.md` | Tick HEL-25 as completed |
| `LEARNING.md` | Add note: DOM test setup for React components requires `happy-dom` + root `bunfig.toml` |
