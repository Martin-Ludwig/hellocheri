import { Elysia, t } from "elysia";
import { db } from "@backend/db/index";
import type { ListWithStatusRow, ListItemRow } from "@lists/shared";

const listSchema = t.Object({
  id: t.String(),
  name: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const listWithStatusSchema = t.Object({
  id: t.String(),
  name: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
  completed: t.Boolean(),
  itemCount: t.Number(),
});

const listItemSchema = t.Object({
  id: t.String(),
  listId: t.String(),
  text: t.String(),
  status: t.Number(),
  position: t.Number(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const notFoundSchema = t.Object({ error: t.String() });

const app = new Elysia()
  .get(
    "/lists",
    () => {
      const rows = db
        .query<ListWithStatusRow, []>(
          "SELECT id, name, created_at, updated_at, completed, item_count FROM lists_with_status ORDER BY created_at DESC",
        )
        .all();

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completed: row.completed === 1,
        itemCount: row.item_count,
      }));
    },
    { response: t.Array(listWithStatusSchema) },
  )
  .get(
    "/lists/:id",
    ({ params, set }) => {
      const row = db
        .query<ListWithStatusRow, [string]>(
          "SELECT id, name, created_at, updated_at, completed, item_count FROM lists_with_status WHERE id = ?",
        )
        .get(params.id);

      if (!row) {
        set.status = 404;
        return { error: "List not found" };
      }

      return {
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completed: row.completed === 1,
        itemCount: row.item_count,
      };
    },
    { response: { 200: listWithStatusSchema, 404: notFoundSchema } },
  )
  .get(
    "/lists/:id/items",
    ({ params, set }) => {
      const list = db
        .query<{ id: string }, [string]>("SELECT id FROM lists WHERE id = ?")
        .get(params.id);

      if (!list) {
        set.status = 404;
        return { error: "List not found" };
      }

      const rows = db
        .query<ListItemRow, [string]>(
          "SELECT id, list_id, text, status, position, created_at, updated_at FROM list_items WHERE list_id = ? ORDER BY position ASC, created_at ASC",
        )
        .all(params.id);

      return rows.map((row) => ({
        id: row.id,
        listId: row.list_id,
        text: row.text,
        status: row.status,
        position: row.position,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    {
      response: {
        200: t.Array(listItemSchema),
        404: notFoundSchema,
      },
    },
  )
  .post(
    "/lists/:id/items",
    ({ params, body, set }) => {
      const list = db
        .query<{ id: string }, [string]>("SELECT id FROM lists WHERE id = ?")
        .get(params.id);

      if (!list) {
        set.status = 404;
        return { error: "List not found" };
      }

      const positionRow = db
        .query<{ next_position: number }, [string]>(
          "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM list_items WHERE list_id = ?",
        )
        .get(params.id)!;

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      db.query(
        "INSERT INTO list_items (id, list_id, text, status, position, created_at, updated_at) VALUES ($id, $listId, $text, 0, $position, $now, $now)",
      ).run({ $id: id, $listId: params.id, $text: body.text, $position: positionRow.next_position, $now: now });

      set.status = 201;
      return {
        id,
        listId: params.id,
        text: body.text,
        status: 0,
        position: positionRow.next_position,
        createdAt: now,
        updatedAt: now,
      };
    },
    {
      body: t.Object({ text: t.String({ minLength: 1 }) }),
      response: {
        201: listItemSchema,
        404: notFoundSchema,
      },
    },
  )
  .patch(
    "/lists/:id/items/:itemId",
    ({ params, body, set }) => {
      const item = db
        .query<{ id: string }, [string, string]>(
          "SELECT id FROM list_items WHERE id = ? AND list_id = ?",
        )
        .get(params.itemId, params.id);

      if (!item) {
        set.status = 404;
        return { error: "Item not found" };
      }

      const now = new Date().toISOString();

      db.query(
        "UPDATE list_items SET status = $status, updated_at = $now WHERE id = $id",
      ).run({ $status: body.status, $now: now, $id: params.itemId });

      const updated = db
        .query<ListItemRow, [string]>(
          "SELECT id, list_id, text, status, position, created_at, updated_at FROM list_items WHERE id = ?",
        )
        .get(params.itemId)!;

      return {
        id: updated.id,
        listId: updated.list_id,
        text: updated.text,
        status: updated.status,
        position: updated.position,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };
    },
    {
      body: t.Object({ status: t.Number({ minimum: 0, maximum: 1 }) }),
      response: {
        200: listItemSchema,
        404: notFoundSchema,
      },
    },
  )
  .delete(
    "/lists/:id/items/:itemId",
    ({ params, set }) => {
      const item = db
        .query<{ id: string }, [string, string]>(
          "SELECT id FROM list_items WHERE id = ? AND list_id = ?",
        )
        .get(params.itemId, params.id);

      if (!item) {
        set.status = 404;
        return { error: "Item not found" };
      }

      db.query("DELETE FROM list_items WHERE id = ?").run(params.itemId);

      set.status = 204;
      return;
    },
    {
      response: {
        204: t.Void(),
        404: notFoundSchema,
      },
    },
  )
  .patch(
    "/lists/:id",
    ({ params, body, set }) => {
      const row = db
        .query<{ id: string }, [string]>("SELECT id FROM lists WHERE id = ?")
        .get(params.id);

      if (!row) {
        set.status = 404;
        return { error: "List not found" };
      }

      const now = new Date().toISOString();

      db.query(
        "UPDATE lists SET name = $name, updated_at = $now WHERE id = $id",
      ).run({ $name: body.name, $now: now, $id: params.id });

      const updated = db
        .query<ListWithStatusRow, [string]>(
          "SELECT id, name, created_at, updated_at, completed, item_count FROM lists_with_status WHERE id = ?",
        )
        .get(params.id)!;

      return {
        id: updated.id,
        name: updated.name,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        completed: updated.completed === 1,
        itemCount: updated.item_count,
      };
    },
    {
      body: t.Object({ name: t.String({ minLength: 1 }) }),
      response: {
        200: listWithStatusSchema,
        404: notFoundSchema,
      },
    },
  )
  .post(
    "/lists",
    ({ body }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      db.query(
        "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
      ).run({ $id: id, $name: body.name, $now: now });

      return { id, name: body.name, createdAt: now, updatedAt: now };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
      }),
      response: listSchema,
    },
  );

export default app;

const server = Bun.serve({
  port: 3001,
  fetch: app.fetch,
});

console.log(`Lists API running on http://localhost:${server.port}`);
