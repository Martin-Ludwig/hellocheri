# HEL-77 — Resolve `document is not defined` in frontend tests

## Problem

Three separate but related issues, all caused by missing DOM setup.

**1. `ReferenceError: document is not defined` in tests**
Bun's test runner has no browser globals. `@testing-library/react`'s `render()` immediately calls `document.body`, which crashes.

**2. `screen` queries permanently throwing**
Even after getting `document` defined, `screen.getByText()` and friends threw `For queries bound to document.body a global document has to be available`. This is because `@testing-library/dom` initialises the `screen` object once at module load time with a static `typeof document !== "undefined"` check. If `document` is not defined at that exact moment, `screen` is set to a version that throws on every call, forever.

**3. VSCode error: `Cannot find name 'document'`**
`tsconfig.json` had `"lib": ["ESNext"]`, which does not include browser globals. TypeScript had no knowledge of `document`, `window`, etc.

## Root cause of the timing issue

The naive fix — calling `GlobalRegistrator.register()` in the same preload file that imports `@testing-library/react` — does not work because of how ES modules evaluate imports.

All `import` statements in a file are evaluated before any of the file's own code runs. The runtime hoists them. So in this file:

```ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { cleanup } from "@testing-library/react"; // evaluates screen.js NOW

GlobalRegistrator.register(); // runs AFTER both imports — too late
```

By the time `GlobalRegistrator.register()` runs, `@testing-library/dom`'s `screen.js` has already evaluated with `document` undefined. `screen` is permanently broken. This also means import order in the same file does not help — the runtime hoists all imports regardless of where they appear.

## Solution

**Split into two preload files.** Bun runs preload files sequentially, each one fully (imports + top-level code) before the next starts. This guarantees `register()` completes before `@testing-library/react` is ever imported.

**`bunfig.toml`**
```toml
[test]
preload = ["./tests/dom-setup.ts", "./tests/setup.ts"]
```

**`tests/dom-setup.ts`** — only imports happy-dom, no @testing-library
```ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
```

**`tests/setup.ts`** — imports @testing-library only after DOM is ready
```ts
import { afterEach } from "bun:test";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

**`tsconfig.json`** — add DOM types
```json
"lib": ["ESNext", "DOM", "DOM.Iterable"]
```

Note: `environment = "happy-dom"` in `bunfig.toml` does not exist in Bun 1.3.x. The preload approach is the correct method.

## Files changed

| File | Change |
|---|---|
| `lists/packages/frontend/tsconfig.json` | Added `"DOM"` and `"DOM.Iterable"` to `lib` |
| `lists/packages/frontend/bunfig.toml` | Two preload files instead of one |
| `lists/packages/frontend/tests/dom-setup.ts` | New — calls `GlobalRegistrator.register()` |
| `lists/packages/frontend/tests/setup.ts` | New — registers `afterEach(cleanup)` |
| `lists/packages/frontend/package.json` | Added `@happy-dom/global-registrator` as devDependency |
| `framework/bunfig.toml` | Same two-preload pattern |
| `framework/tests/dom-setup.ts` | New — same as above |
| `framework/tests/setup.ts` | New — same as above |
| `framework/package.json` | Added `@happy-dom/global-registrator` as devDependency |
| `LEARNING.md` | Documented the split-preload requirement and the ES module timing trap |

## Test results

```
lists/packages/frontend   18 pass, 0 fail
framework                 11 pass, 0 fail
```
