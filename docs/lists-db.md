# Lists — DB Schema

## Technology

SQLite via `bun:sqlite` (built-in, no extra dependency).

DB file: `lists.db` (created at backend process working directory).

## Tables

### `item_status`

Lookup table for list item statuses. Pre-seeded, not user-editable.

| Column | Type    | Description                        |
|--------|---------|------------------------------------|
| `id`   | INTEGER | Primary key                        |
| `name` | TEXT    | Machine-readable code (not a display label — translate in frontend) |

Seed values:

| id | name        |
|----|-------------|
| 0  | `default`   |
| 1  | `completed` |

### `lists`

| Column       | Type | Description         |
|--------------|------|---------------------|
| `id`         | TEXT | UUID v4, primary key |
| `name`       | TEXT | Display name         |
| `created_at` | TEXT | ISO-8601 timestamp   |
| `updated_at` | TEXT | ISO-8601 timestamp   |

### `list_items`

| Column       | Type    | Description                              |
|--------------|---------|------------------------------------------|
| `id`         | TEXT    | UUID v4, primary key                     |
| `list_id`    | TEXT    | Foreign key → `lists.id` (CASCADE delete) |
| `text`       | TEXT    | Item content                             |
| `status`     | INTEGER | Foreign key → `item_status.id`           |
| `position` | INTEGER | Position within list                     |
| `created_at` | TEXT    | ISO-8601 timestamp                       |
| `updated_at` | TEXT    | ISO-8601 timestamp                       |

Index: `idx_list_items_list_id` on `list_items(list_id)`.

## View: `lists_with_status`

`completed` on a list is derived (are all items completed?). Storing it would
create a sync problem: adding a new item would require resetting the flag manually.

The view computes it on-the-fly — always consistent, no triggers needed.

```sql
CREATE VIEW IF NOT EXISTS lists_with_status AS
SELECT
  list.*,
  CASE
    WHEN COUNT(item.id) = 0 THEN 0         -- empty list = not completed
    WHEN SUM(item.status != 1) = 0 THEN 1  -- all items have status "completed" (id=1)
    ELSE 0
  END AS completed
FROM lists list
LEFT JOIN list_items item ON item.list_id = list.id
GROUP BY list.id;
```

Query `lists_with_status` instead of `lists` whenever `completed` is needed.

## TypeScript Types

Defined in `@lists/shared` (`lists/packages/shared/src/index.ts`).
Shared between `@lists/frontend` and `@lists/backend` via Bun workspace.

| TS Type               | Maps to                            |
|-----------------------|------------------------------------|
| `List`                | `lists` table row                  |
| `ListWithStatus`      | `lists_with_status` view           |
| `ListItem`            | `list_items` table row             |
| `ItemStatus`          | `item_status` ids (enum)           |
| `CreateListInput`     | Body of `POST /lists`              |
| `UpdateListInput`     | Body of `PATCH /lists/:id`         |
| `CreateListItemInput` | Body of `POST /lists/:id/items`    |
| `UpdateListItemInput` | Body of `PATCH /items/:id`         |

`item.isCompleted()` is a method on `ListItem` — `completed` is not stored in the DB.

### Why Input classes?

`id`, `createdAt`, and `updatedAt` are generated server-side — the frontend must not
send them. The `*Input` classes define exactly what the frontend is allowed to send:

```ts
// Frontend sends only the name — nothing else
const input = new CreateListInput("Groceries");

// Backend generates the rest and returns the full object
const list = new List("uuid-123", "Groceries", "2026-03-08T10:00:00.000Z", "2026-03-08T10:00:00.000Z");
```

For updates, all fields are optional (`PATCH` semantics — only send what changed):

```ts
// Only rename the list, leave everything else untouched
const input = new UpdateListInput("Groceries (week 2)");
```

## i18n

`item_status.name` values are machine-readable codes (`"default"`, `"completed"`),
not display strings. The frontend maps these codes to translated labels.
