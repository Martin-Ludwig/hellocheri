import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "@frontend/App";

function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
