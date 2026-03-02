import { describe, it, expect, beforeEach } from "bun:test";
import { LocalStorageManager } from "../framework/LocalStorageManager";

// Minimal in-memory localStorage mock
function createLocalStorageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

beforeEach(() => {
  globalThis.localStorage = createLocalStorageMock();
});

// --- get / set ---

describe("set and get", () => {
  it("stores and retrieves a string", () => {
    const store = new LocalStorageManager<string>({ storageKey: "key" });
    store.set("hello");
    expect(store.get()).toBe("hello");
  });

  it("stores and retrieves a number", () => {
    const store = new LocalStorageManager<number>({ storageKey: "count" });
    store.set(42);
    expect(store.get()).toBe(42);
  });

  it("stores and retrieves an object", () => {
    interface Prefs { theme: string; count: number }
    const store = new LocalStorageManager<Prefs>({ storageKey: "prefs" });
    store.set({ theme: "dark", count: 3 });
    expect(store.get()).toEqual({ theme: "dark", count: 3 });
  });

  it("returns null when key is absent", () => {
    const store = new LocalStorageManager<string>({ storageKey: "missing" });
    expect(store.get()).toBeNull();
  });
});

// --- has ---

describe("has", () => {
  it("returns false before set", () => {
    const store = new LocalStorageManager<string>({ storageKey: "k" });
    expect(store.has()).toBe(false);
  });

  it("returns true after set", () => {
    const store = new LocalStorageManager<string>({ storageKey: "k" });
    store.set("value");
    expect(store.has()).toBe(true);
  });

  it("returns false after remove", () => {
    const store = new LocalStorageManager<string>({ storageKey: "k" });
    store.set("value");
    store.remove();
    expect(store.has()).toBe(false);
  });
});

// --- remove ---

describe("remove", () => {
  it("removes the stored value", () => {
    const store = new LocalStorageManager<string>({ storageKey: "k" });
    store.set("value");
    store.remove();
    expect(store.get()).toBeNull();
  });

  it("is a no-op when key does not exist", () => {
    const store = new LocalStorageManager<string>({ storageKey: "k" });
    expect(() => store.remove()).not.toThrow();
  });
});

// --- enabled: false ---

describe("disabled mode (enabled: false)", () => {
  it("set is a no-op", () => {
    const store = new LocalStorageManager<string>({ storageKey: "k", enabled: false });
    store.set("value");
    expect(localStorage.getItem("k")).toBeNull();
  });

  it("get returns null", () => {
    const store = new LocalStorageManager<string>({ storageKey: "k", enabled: false });
    expect(store.get()).toBeNull();
  });

  it("has returns false", () => {
    const store = new LocalStorageManager<string>({ storageKey: "k", enabled: false });
    expect(store.has()).toBe(false);
  });

  it("remove is a no-op", () => {
    // Manually write to storage to verify remove doesn't touch it
    localStorage.setItem("k", JSON.stringify("value"));
    const store = new LocalStorageManager<string>({ storageKey: "k", enabled: false });
    store.remove();
    expect(localStorage.getItem("k")).not.toBeNull();
  });
});

// --- rehydrate ---

describe("rehydrate", () => {
  it("transforms the parsed value", () => {
    interface Raw { date: string }
    interface Hydrated { date: Date }

    const store = new LocalStorageManager<Hydrated>({
      storageKey: "session",
      rehydrate: (raw) => {
        const r = raw as Raw;
        return { date: new Date(r.date) };
      },
    });

    store.set({ date: new Date("2026-01-01") } as unknown as Hydrated);
    const result = store.get();
    expect(result?.date).toBeInstanceOf(Date);
    expect(result?.date.getFullYear()).toBe(2026);
  });
});

// --- corrupt data ---

describe("corrupt stored data", () => {
  it("get returns null on invalid JSON", () => {
    localStorage.setItem("bad", "not-json{{{");
    const store = new LocalStorageManager<object>({ storageKey: "bad" });
    expect(store.get()).toBeNull();
  });
});

// --- debug ---

describe("debug mode", () => {
  it("logs on set without throwing", () => {
    const store = new LocalStorageManager<string>({ storageKey: "k", debug: true });
    expect(() => store.set("hi")).not.toThrow();
  });
});
