# LocalStorageManager

A generic, type-safe wrapper around the browser's `localStorage` API. Lives in `framework/LocalStorageManager.ts`.

## Features

- Generic over any JSON-serializable type `T`
- Optional `rehydrate` function for custom deserialization (e.g. restoring class instances or Date objects)
- `enabled` flag to disable storage at runtime (e.g. SSR, tests, feature flags)
- `debug` mode for console logging on every operation
- Safe: all read/write operations are wrapped in try/catch

## API

### Constructor

```ts
new LocalStorageManager<T>(options: LocalStorageOptions<T>)
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `storageKey` | `string` | — | The key used in `localStorage` |
| `enabled` | `boolean` | `true` | Disable all storage operations when `false` |
| `rehydrate` | `(raw: unknown) => T` | `undefined` | Transform the parsed JSON before returning |
| `debug` | `boolean` | `false` | Log all operations to the console |

### Methods

#### `get(): T | null`

Reads the value from `localStorage`, parses the JSON, and optionally passes it through `rehydrate`. Returns `null` if the key is absent, parsing fails, or storage is disabled.

#### `set(value: T): void`

Serializes `value` to JSON and writes it to `localStorage`. No-op when disabled.

#### `remove(): void`

Removes the key from `localStorage`. No-op when disabled.

#### `has(): boolean`

Returns `true` if the key exists in `localStorage`. Returns `false` when disabled.

## Usage

### Basic — primitive value

```ts
import { LocalStorageManager } from "../framework/LocalStorageManager";

const themeStore = new LocalStorageManager<string>({ storageKey: "theme" });

themeStore.set("dark");
themeStore.get();    // "dark"
themeStore.has();    // true
themeStore.remove();
themeStore.has();    // false
```

### Object value

```ts
interface UserPreferences {
  language: string;
  notifications: boolean;
}

const prefsStore = new LocalStorageManager<UserPreferences>({
  storageKey: "user-prefs",
});

prefsStore.set({ language: "en", notifications: true });
prefsStore.get(); // { language: "en", notifications: true }
```

### Rehydrate — restoring a class instance

Use `rehydrate` when the raw JSON doesn't map directly to the expected type (e.g. a `Date` is stored as a string).

```ts
interface Session {
  userId: string;
  expiresAt: Date;
}

const sessionStore = new LocalStorageManager<Session>({
  storageKey: "session",
  rehydrate: (raw) => {
    const data = raw as { userId: string; expiresAt: string };
    return { userId: data.userId, expiresAt: new Date(data.expiresAt) };
  },
});

sessionStore.set({ userId: "u1", expiresAt: new Date("2026-12-31") });
const session = sessionStore.get();
session?.expiresAt instanceof Date; // true
```

### Disabled mode

```ts
const store = new LocalStorageManager<string>({
  storageKey: "feature-flag-value",
  enabled: false,
});

store.set("hello");  // no-op
store.get();         // null
store.has();         // false
```

### Debug mode

```ts
const store = new LocalStorageManager<number>({
  storageKey: "counter",
  debug: true,
});

store.set(42);
// [LocalStorage: counter] set 42
```

## Notes

- Values are always serialized with `JSON.stringify` and deserialized with `JSON.parse`. Non-serializable values (functions, `undefined`, circular references) will be lost or throw.
- `localStorage` is only available in browser environments. The class will throw if used in a non-browser context without the `enabled: false` guard.
- The `rehydrate` function receives `unknown` and is responsible for validation. Use a schema library (e.g. Zod) inside `rehydrate` for runtime safety.
