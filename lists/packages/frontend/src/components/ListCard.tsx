import React from "react";
import type { ListWithStatus } from "@lists/shared";

interface ListCardProps {
  list: ListWithStatus;
}

function CompletionBadge({ list }: { list: ListWithStatus }) {
  if (list.completed) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      In progress
    </span>
  );
}

export function ListCard({ list }: ListCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-gray-900">{list.name}</span>
      <CompletionBadge list={list} />
    </div>
  );
}
