import { afterEach } from "bun:test";
import { Window } from "happy-dom";

const happyWindow = new Window({ url: "http://localhost/" });

const errorConstructors = [
  "Error", "SyntaxError", "TypeError", "RangeError",
  "ReferenceError", "URIError", "EvalError",
] as const;
for (const name of errorConstructors) {
  Object.defineProperty(happyWindow, name, {
    value: globalThis[name],
    configurable: true,
    writable: true,
  });
}

Object.defineProperties(globalThis, {
  window:      { value: happyWindow, configurable: true, writable: true },
  document:    { value: happyWindow.document, configurable: true, writable: true },
  navigator:   { value: happyWindow.navigator, configurable: true, writable: true },
  location:    { value: happyWindow.location, configurable: true, writable: true },
  history:     { value: happyWindow.history, configurable: true, writable: true },
  HTMLElement: { value: happyWindow.HTMLElement, configurable: true, writable: true },
  Element:     { value: happyWindow.Element, configurable: true, writable: true },
  Node:        { value: happyWindow.Node, configurable: true, writable: true },
  Event:       { value: happyWindow.Event, configurable: true, writable: true },
  CustomEvent: { value: happyWindow.CustomEvent, configurable: true, writable: true },
});

// Cleanup after each test. Dynamic import ensures @testing-library/react
// is loaded only after the DOM globals above are in place.
afterEach(async () => {
  const { cleanup } = await import("@testing-library/react");
  cleanup();
});
