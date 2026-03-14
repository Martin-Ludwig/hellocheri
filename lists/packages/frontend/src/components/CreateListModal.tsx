import React, { useEffect, useRef, useState } from "react";
import { AppTextInput } from "@framework/components/AppTextInput";

const API_BASE = "http://localhost:3001";

interface CreateListModalProps {
  onCreated: () => void;
  onClose: () => void;
}

export function CreateListModal({ onCreated, onClose }: CreateListModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const response = await fetch(`${API_BASE}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!response.ok) {
        setError("Failed to create list. Please try again.");
        return;
      }
      onCreated();
    } catch {
      setError("Failed to create list. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-list-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2
          id="create-list-modal-title"
          className="mb-4 text-base font-semibold text-gray-900"
        >
          New list
        </h2>
        <form onSubmit={handleSubmit} noValidate>
          <AppTextInput
            ref={inputRef}
            label="Name"
            placeholder="Shopping, Reading, ..."
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={error}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={submitting}
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
