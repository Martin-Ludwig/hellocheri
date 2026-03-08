CREATE TABLE IF NOT EXISTS item_status (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT OR IGNORE INTO item_status (id, name) VALUES (0, 'default'), (1, 'completed');

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
  position  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);

-- View: completed is computed, not stored — always consistent
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
