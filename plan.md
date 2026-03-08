# HEL-8 — DB Schema: Plan

## Antworten auf die offenen Fragen

### 1. Kommt der List-Type in `framework/`?

**Nein.** `framework/` ist für projektübergreifende Utilities (z.B. LocalStorageManager,
der in Notes UND Lists genutzt wird). Ein `List`-Typ ist aber spezifisch für das
`lists`-Projekt — er gehört in `@lists/shared`.

Regel: `framework/` = generische Utilities; `@lists/shared` = lists-spezifische Typen.

### 2. Wie sharen wir den Typ zwischen Frontend und Backend?

Das Workspace-Setup ist dafür bereits vorbereitet:
- `@lists/frontend` hängt von `@lists/shared: "workspace:*"` ab
- `@lists/backend` hängt von `@lists/shared: "workspace:*"` ab

Wir definieren die Interfaces in `lists/packages/shared/src/index.ts`
und importieren sie in beiden Packages. Kein Codeduplizierung, kein Copy-Paste.

### 3. Welche Attribute brauchen wir?

**List-Entity** (user-facing Liste, z.B. "Einkaufsliste"):

| Feld         | Typ      | Hinweise                              |
|--------------|----------|---------------------------------------|
| `id`         | `string` | UUID v4                               |
| `name`       | `string` | Anzeigename der Liste                 |
| `createdAt`  | `string` | ISO-8601 Timestamp                    |
| `updatedAt`  | `string` | ISO-8601 Timestamp                    |

**ItemStatus-Entity** (Lookup-Tabelle, fix vorbefüllt):

| Feld   | Typ      | Hinweise                                        |
|--------|----------|-------------------------------------------------|
| `id`   | `number` | 0 = default, 1 = completed                      |
| `name` | `string` | Maschinenlesbarer Code (`"default"`, `"completed"`) — kein Display-Text, Übersetzung im Frontend |

**ListItem-Entity** (einzelner Eintrag in einer Liste):

| Feld        | Typ      | Hinweise                              |
|-------------|----------|---------------------------------------|
| `id`        | `string` | UUID v4                               |
| `listId`    | `string` | Foreign Key → List.id                 |
| `text`      | `string` | Inhalt des Eintrags                   |
| `status`    | `number` | Foreign Key → ItemStatus.id           |
| `sortOrder` | `number` | Reihenfolge in der Liste              |
| `createdAt` | `string` | ISO-8601 Timestamp                    |
| `updatedAt` | `string` | ISO-8601 Timestamp                    |

**i18n-Strategie:** `item_status.name` ist ein sprachagnostischer Code-Schlüssel.
Das Frontend übersetzt: `"completed"` → `"Erledigt"` / `"Done"`. DB bleibt sprachunabhängig.

**Bewusst weggelassen (YAGNI):**
- `description` — kein klarer Use-Case bisher
- `color` / `icon` — UI-Feature für später (IDEAS.md)
- `isArchived` — kann später mit einem Boolean ergänzt werden
- `userId` — kein Auth-Layer geplant (HEL-5 Scope)

---

## Umsetzungsschritte

### Schritt 1 — TypeScript-Typen in `@lists/shared`

Datei: `lists/packages/shared/src/index.ts`

```ts
// Enum spiegelt item_status Tabelle wider (id = Integer-Wert)
export enum ItemStatus {
  Default   = 0,
  Completed = 1,
}

// Base types (DB row shape, as stored)
export interface List {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ListWithStatus spiegelt die lists_with_status View wider
export interface ListWithStatus extends List {
  completed: boolean; // berechnet via View, nicht gespeichert
}

export interface ListItem {
  id: string;
  listId: string;
  text: string;
  status: ItemStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// completed ist abgeleitet — nicht in DB gespeichert, als Funktion implementiert
export function isCompleted(item: ListItem): boolean {
  return item.status === ItemStatus.Completed;
}

// Input types (for creating/updating, no id/timestamps)
// Pick<List, "name">          = { name: string }   — nur dieses Feld aus List
// Partial<...>                = { name?: string }  — alle Felder optional (PATCH-Semantik)
export type CreateListInput = Pick<List, "name">;
export type UpdateListInput = Partial<Pick<List, "name">>;

export type CreateListItemInput = Pick<ListItem, "listId" | "text" | "sortOrder">;
export type UpdateListItemInput = Partial<Pick<ListItem, "text" | "status" | "sortOrder">>;
```

### Schritt 2 — DB-Technologie

**SQLite via `bun:sqlite`** (built-in, kein extra Dependency nötig).

Begründung:
- Kein Server nötig, zero-config
- Bun hat nativen SQLite-Support
- Für eine lokale Listen-App völlig ausreichend
- Kann später zu Postgres migriert werden falls nötig

### Schritt 3 — DB-Schema in `@lists/backend`

Datei: `lists/packages/backend/src/db/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS item_status (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO item_status (id, name) VALUES (0, 'default'), (1, 'completed');

CREATE TABLE IF NOT EXISTS lists (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS list_items (
  id          TEXT PRIMARY KEY,
  list_id     TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  status      INTEGER NOT NULL DEFAULT 0 REFERENCES item_status(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);

-- View: completed wird berechnet, nicht gespeichert → immer konsistent
CREATE VIEW lists_with_status AS
SELECT
  list.*,
  CASE
    WHEN COUNT(item.id) = 0 THEN 0         -- leere Liste = nicht completed
    WHEN SUM(item.status != 1) = 0 THEN 1  -- alle items haben status "completed" (id=1)
    ELSE 0
  END AS completed
FROM lists list
LEFT JOIN list_items item ON item.list_id = list.id
GROUP BY list.id;
```

**Warum View statt gespeichertes Feld:**
`completed` auf einer Liste ist abgeleiteter Wert (alle Items completed?).
Würde man es speichern, entsteht ein Sync-Problem: neues Item → Liste muss
manuell auf `completed=false` zurückgesetzt werden. Die View berechnet es
on-the-fly — immer korrekt, ohne Trigger oder Sync-Logik.

### Schritt 4 — DB-Initialisierung in `@lists/backend`

Datei: `lists/packages/backend/src/db/index.ts`

```ts
import { Database } from "bun:sqlite";
import { readFileSync } from "fs";

const db = new Database("lists.db");
db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

export { db };
```

### Schritt 5 — Tests für `@lists/shared` Typen

Datei: `lists/packages/shared/src/index.test.ts`

Smoke-Tests: sicherstellen, dass alle Exports vorhanden sind und die Typen die
erwartete Struktur haben (via TypeScript-Compiler-Checks, kein Runtime-Test nötig).

### Schritt 6 — Docs & Roadmap updaten

- `docs/lists-db.md` anlegen: DB-Schema dokumentieren
- `ROADMAP.md`: HEL-8 abhaken
- `LEARNING.md`: Erkenntnisse festhalten (bun:sqlite, snake_case in DB vs. camelCase in TS)

---

## Dateiübersicht nach Umsetzung

```
lists/packages/
├── shared/src/
│   ├── index.ts          ← List, ListItem, Input-Typen
│   └── index.test.ts     ← Type-Tests (neu)
└── backend/src/
    └── db/
        ├── schema.sql    ← CREATE TABLE statements (neu)
        └── index.ts      ← DB-Initialisierung (neu)

docs/
└── lists-db.md           ← DB-Dokumentation (neu)
```

---

## Offene Fragen an dich

1. **Timestamps:** `string` (ISO-8601) oder `number` (Unix ms)? — Ich empfehle `string`
   für bessere Lesbarkeit/Debugging, aber `number` ist auch valid.
2. **`sortOrder` als `number` oder auto-increment?** — Vorschlag: explizit als Integer,
   damit User die Reihenfolge frei setzen kann.
3. **DB-Dateiname:** `lists.db` im Backend-Verzeichnis — ok so, oder anderer Pfad?
