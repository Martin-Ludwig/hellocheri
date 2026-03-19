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

describe("GET /lists/:id", () => {
  test("returns the list when it exists", async () => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: id, $name: "Shopping", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${id}`),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ id, name: "Shopping", completed: false });
  });

  test("returns 404 for an unknown id", async () => {
    const response = await app.handle(
      new Request("http://localhost/lists/does-not-exist"),
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("List not found");
  });
});

describe("GET /lists/:id/items", () => {
  test("returns an empty array when the list has no items", async () => {
    const listId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: listId, $name: "Empty", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${listId}/items`),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  test("returns items ordered by position ascending", async () => {
    const listId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: listId, $name: "Ordered", $now: now });

    db.query(
      "INSERT INTO list_items (id, list_id, text, status, position, created_at, updated_at) VALUES ($id, $listId, $text, 0, $position, $now, $now)",
    ).run({ $id: crypto.randomUUID(), $listId: listId, $text: "Second", $position: 2, $now: now });
    db.query(
      "INSERT INTO list_items (id, list_id, text, status, position, created_at, updated_at) VALUES ($id, $listId, $text, 0, $position, $now, $now)",
    ).run({ $id: crypto.randomUUID(), $listId: listId, $text: "First", $position: 1, $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${listId}/items`),
    );
    const body = await response.json();
    expect(body).toHaveLength(2);
    expect(body[0].text).toBe("First");
    expect(body[1].text).toBe("Second");
  });

  test("returns 404 for an unknown list", async () => {
    const response = await app.handle(
      new Request("http://localhost/lists/does-not-exist/items"),
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("List not found");
  });
});

describe("POST /lists/:id/items", () => {
  test("creates an item and returns 201 with item shape", async () => {
    const listId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: listId, $name: "Shopping", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Milk" }),
      }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({
      listId,
      text: "Milk",
      status: 0,
      position: 0,
    });
    expect(typeof body.id).toBe("string");
  });

  test("assigns position as max(position) + 1 for subsequent items", async () => {
    const listId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: listId, $name: "Shopping", $now: now });
    db.query(
      "INSERT INTO list_items (id, list_id, text, status, position, created_at, updated_at) VALUES ($id, $listId, $text, 0, 0, $now, $now)",
    ).run({ $id: crypto.randomUUID(), $listId: listId, $text: "First", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Second" }),
      }),
    );
    const body = await response.json();
    expect(body.position).toBe(1);
  });

  test("returns 404 for an unknown list", async () => {
    const response = await app.handle(
      new Request("http://localhost/lists/does-not-exist/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Milk" }),
      }),
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("List not found");
  });

  test("returns 422 when text is empty string", async () => {
    const listId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: listId, $name: "Shopping", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "" }),
      }),
    );
    expect(response.status).toBe(422);
  });
});

describe("PATCH /lists/:id/items/:itemId", () => {
  test("updates the item status", async () => {
    const listId = crypto.randomUUID();
    const itemId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: listId, $name: "List", $now: now });
    db.query(
      "INSERT INTO list_items (id, list_id, text, status, position, created_at, updated_at) VALUES ($id, $listId, $text, 0, 0, $now, $now)",
    ).run({ $id: itemId, $listId: listId, $text: "Buy milk", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${listId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 1 }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe(1);
    expect(body.id).toBe(itemId);
  });

  test("returns 404 for an unknown item", async () => {
    const listId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: listId, $name: "List", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${listId}/items/does-not-exist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 1 }),
      }),
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Item not found");
  });
});

describe("DELETE /lists/:id/items/:itemId", () => {
  test("deletes the item and returns 204", async () => {
    const listId = crypto.randomUUID();
    const itemId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: listId, $name: "List", $now: now });
    db.query(
      "INSERT INTO list_items (id, list_id, text, status, position, created_at, updated_at) VALUES ($id, $listId, $text, 0, 0, $now, $now)",
    ).run({ $id: itemId, $listId: listId, $text: "Delete me", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${listId}/items/${itemId}`, {
        method: "DELETE",
      }),
    );
    expect(response.status).toBe(204);

    const checkResponse = await app.handle(
      new Request(`http://localhost/lists/${listId}/items`),
    );
    const body = await checkResponse.json();
    expect(body).toHaveLength(0);
  });

  test("returns 404 for an unknown item", async () => {
    const listId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: listId, $name: "List", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${listId}/items/does-not-exist`, {
        method: "DELETE",
      }),
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Item not found");
  });
});

describe("PATCH /lists/:id", () => {
  test("updates the list name and returns the updated list", async () => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: id, $name: "Old Name", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(id);
    expect(body.name).toBe("New Name");
    expect(body.completed).toBe(false);
  });

  test("persists the updated name", async () => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: id, $name: "Before", $now: now });

    await app.handle(
      new Request(`http://localhost/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "After" }),
      }),
    );

    const response = await app.handle(new Request(`http://localhost/lists/${id}`));
    const body = await response.json();
    expect(body.name).toBe("After");
  });

  test("returns 404 for an unknown id", async () => {
    const response = await app.handle(
      new Request("http://localhost/lists/does-not-exist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Anything" }),
      }),
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("List not found");
  });

  test("returns 422 when name is empty string", async () => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.query(
      "INSERT INTO lists (id, name, created_at, updated_at) VALUES ($id, $name, $now, $now)",
    ).run({ $id: id, $name: "Name", $now: now });

    const response = await app.handle(
      new Request(`http://localhost/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      }),
    );
    expect(response.status).toBe(422);
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
