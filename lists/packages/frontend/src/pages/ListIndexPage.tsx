import React, { useCallback, useEffect, useState } from "react";
import { ListWithStatus } from "@lists/shared";
import { ListCard } from "@frontend/components/ListCard";

const API_BASE = "http://localhost:3001";
const DEFAULT_LIST_NAME = "New List";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; lists: ListWithStatus[] };

export function ListIndexPage() {
  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" });
  const [creating, setCreating] = useState(false);

  const loadLists = useCallback(async () => {
    setFetchState({ status: "loading" });
    try {
      const response = await fetch(`${API_BASE}/lists`);
      if (!response.ok) {
        setFetchState({ status: "error", message: "Failed to load lists." });
        return;
      }
      const data = (await response.json()) as Array<{
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        completed: boolean;
      }>;
      const lists: ListWithStatus[] = data.map(
        (item) =>
          new ListWithStatus(
            item.id,
            item.name,
            item.createdAt,
            item.updatedAt,
            item.completed,
          ),
      );
      setFetchState({ status: "success", lists });
    } catch {
      setFetchState({ status: "error", message: "Failed to load lists." });
    }
  }, []);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  async function handleNewList() {
    setCreating(true);
    try {
      await fetch(`${API_BASE}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: DEFAULT_LIST_NAME }),
      });
      void loadLists();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Lists</h1>
        <button
          type="button"
          onClick={() => void handleNewList()}
          disabled={creating}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          New List
        </button>
      </div>

      {fetchState.status === "loading" && (
        <p className="text-sm text-gray-500">Loading...</p>
      )}

      {fetchState.status === "error" && (
        <p className="text-sm text-red-600">{fetchState.message}</p>
      )}

      {fetchState.status === "success" && fetchState.lists.length === 0 && (
        <p className="text-sm text-gray-500">
          No lists yet. Create your first one.
        </p>
      )}

      {fetchState.status === "success" && fetchState.lists.length > 0 && (
        <ul className="flex flex-col gap-2">
          {fetchState.lists.map((list) => (
            <li key={list.id}>
              <ListCard list={list} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
