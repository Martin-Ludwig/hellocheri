import { describe, test, expect, beforeEach } from "bun:test";
import { db } from "@backend/db/index";
import app from "./index";

beforeEach(() => {
  db.exec("DELETE FROM list_items");
  db.exec("DELETE FROM lists");
});

describe("GET /lists", () => {
  test("returns an empty array when no lists exist", async () => {
    const response = await app.handle(new Request("http://localhost/lists"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  test("returns all lists with completion status", async () => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: id, $name: "Groceries", $now: now });

    const response = await app.handle(new Request("http://localhost/lists"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      id,
      name: "Groceries",
      completed: false,
    });
  });

  test("returns lists ordered by created_at descending", async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 1000).toISOString();
    const later = now.toISOString();

    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: crypto.randomUUID(), $name: "First", $now: earlier });
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: crypto.randomUUID(), $name: "Second", $now: later });

    const response = await app.handle(new Request("http://localhost/lists"));
    const body = await response.json();
    expect(body[0].name).toBe("Second");
    expect(body[1].name).toBe("First");
  });
});

describe("POST /lists", () => {
  test("creates a list and returns it", async () => {
    const response = await app.handle(
      new Request("http://localhost/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Books" }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ name: "Books" });
    expect(typeof body.id).toBe("string");
    expect(typeof body.createdAt).toBe("string");
  });

  test("persists the list so it appears in GET /lists", async () => {
    await app.handle(
      new Request("http://localhost/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Watchlist" }),
      }),
    );
    const response = await app.handle(new Request("http://localhost/lists"));
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Watchlist");
  });

  test("returns 422 when name is missing", async () => {
    const response = await app.handle(
      new Request("http://localhost/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(422);
  });

  test("returns 422 when name is empty string", async () => {
    const response = await app.handle(
      new Request("http://localhost/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      }),
    );
    expect(response.status).toBe(422);
  });
});
