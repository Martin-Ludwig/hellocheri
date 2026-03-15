import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ListItem, ItemStatus } from "@lists/shared";

const API_BASE = "http://localhost:3001";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; listName: string; items: ListItem[] };

export function ListDetailPage() {
  const { id: listId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" });

  const loadListAndItems = useCallback(async () => {
    if (!listId) return;
    setFetchState({ status: "loading" });
    try {
      const [listResponse, itemsResponse] = await Promise.all([
        fetch(`${API_BASE}/lists/${listId}`),
        fetch(`${API_BASE}/lists/${listId}/items`),
      ]);

      if (!listResponse.ok || !itemsResponse.ok) {
        setFetchState({ status: "error", message: "Failed to load list." });
        return;
      }

      const listData = (await listResponse.json()) as {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
      };

      const itemsData = (await itemsResponse.json()) as Array<{
        id: string;
        listId: string;
        text: string;
        status: number;
        position: number;
        createdAt: string;
        updatedAt: string;
      }>;

      const items = itemsData.map(
        (item) =>
          new ListItem(
            item.id,
            item.listId,
            item.text,
            item.status,
            item.position,
            item.createdAt,
            item.updatedAt,
          ),
      );

      setFetchState({ status: "success", listName: listData.name, items });
    } catch {
      setFetchState({ status: "error", message: "Failed to load list." });
    }
  }, [listId]);

  useEffect(() => {
    void loadListAndItems();
  }, [loadListAndItems]);

  async function handleToggleItem(item: ListItem) {
    const newStatus = item.isCompleted() ? ItemStatus.Default : ItemStatus.Completed;
    await fetch(`${API_BASE}/lists/${listId}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    void loadListAndItems();
  }

  async function handleDeleteItem(itemId: string) {
    await fetch(`${API_BASE}/lists/${listId}/items/${itemId}`, {
      method: "DELETE",
    });
    void loadListAndItems();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => void navigate("/")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back
        </button>

        {fetchState.status === "success" && (
          <h1 className="text-2xl font-bold text-gray-900">{fetchState.listName}</h1>
        )}
      </div>

      {fetchState.status === "loading" && (
        <p className="text-sm text-gray-500">Loading...</p>
      )}

      {fetchState.status === "error" && (
        <p className="text-sm text-red-600">{fetchState.message}</p>
      )}

      {fetchState.status === "success" && fetchState.items.length === 0 && (
        <p className="text-sm text-gray-500">No items in this list.</p>
      )}

      {fetchState.status === "success" && fetchState.items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {fetchState.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isCompleted()}
                  onChange={() => void handleToggleItem(item)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span
                  className={
                    item.isCompleted()
                      ? "text-sm text-gray-400 line-through"
                      : "text-sm text-gray-900"
                  }
                >
                  {item.text}
                </span>
              </label>
              <button
                type="button"
                onClick={() => void handleDeleteItem(item.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
