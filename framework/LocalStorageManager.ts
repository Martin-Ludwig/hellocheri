type RehydrateFunction<T> = (raw: unknown) => T;

interface LocalStorageOptions<T> {
  storageKey: string;
  enabled?: boolean;
  rehydrate?: RehydrateFunction<T>;
  debug?: boolean;
}

export class LocalStorageManager<T> {
  private readonly storageKey: string;
  private readonly enabled: boolean;
  private readonly rehydrate?: RehydrateFunction<T>;
  private readonly debug: boolean;

  constructor(options: LocalStorageOptions<T>) {
    this.storageKey = options.storageKey;
    this.enabled = options.enabled ?? true;
    this.rehydrate = options.rehydrate;
    this.debug = options.debug ?? false;
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.debug) {
      console.log(`[LocalStorage: ${this.storageKey}] ${message}`, ...args);
    }
  }

  get(): T | null {
    if (!this.enabled) return null;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      if (this.rehydrate) return this.rehydrate(parsed);
      return parsed as T;
    } catch (error) {
      this.log("get failed", error);
      return null;
    }
  }

  set(value: T): void {
    if (!this.enabled) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(value));
      this.log("set", value);
    } catch (error) {
      this.log("set failed", error);
    }
  }

  remove(): void {
    if (!this.enabled) return;
    try {
      localStorage.removeItem(this.storageKey);
      this.log("removed");
    } catch (error) {
      this.log("remove failed", error);
    }
  }

  has(): boolean {
    if (!this.enabled) return false;
    return localStorage.getItem(this.storageKey) !== null;
  }
}
