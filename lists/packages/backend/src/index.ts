import { Elysia, t } from "elysia";
import { db } from "./db/index";

const listShape = t.Object({
  id: t.String(),
  name: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const listWithStatusShape = t.Object({
  id: t.String(),
  name: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
  completed: t.Boolean(),
});

const app = new Elysia()
  .get(
    "/lists",
    () => {
      const rows = db
        .query<
          {
            id: string;
            name: string;
            created_at: string;
            updated_at: string;
            completed: number;
          },
          []
        >(
          "SELECT id, name, created_at, updated_at, completed FROM lists_with_status ORDER BY created_at DESC",
        )
        .all();

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completed: row.completed === 1,
      }));
    },
    { response: t.Array(listWithStatusShape) },
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
      response: listShape,
    },
  );

export default app;

const server = Bun.serve({
  port: 3001,
  fetch: app.fetch,
});

console.log(`Lists API running on http://localhost:${server.port}`);
