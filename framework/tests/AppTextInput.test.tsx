import { describe, test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AppTextInput } from "../components";

describe("AppTextInput", () => {
  test("renders an input element", () => {
    render(<AppTextInput />);
    expect(screen.getByRole("textbox")).toBeDefined();
  });

  test("renders label bound to input", () => {
    render(<AppTextInput label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input.tagName).toBe("INPUT");
  });

  test("renders hint text", () => {
    render(<AppTextInput hint="Enter your email" />);
    expect(screen.getByText("Enter your email")).toBeDefined();
  });

  test("renders error text", () => {
    render(<AppTextInput error="Required" />);
    expect(screen.getByText("Required")).toBeDefined();
  });

  test("sets aria-invalid when error is present", () => {
    render(<AppTextInput error="Required" />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  test("does not set aria-invalid when no error", () => {
    render(<AppTextInput />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  test("forwards className to input", () => {
    render(<AppTextInput className="my-class" />);
    const input = screen.getByRole("textbox");
    expect(input.classList.contains("my-class")).toBe(true);
  });

  test("forwards native props", () => {
    render(<AppTextInput placeholder="Type here" disabled />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("placeholder")).toBe("Type here");
    expect(input.hasAttribute("disabled")).toBe(true);
  });

  test("links hint via aria-describedby", () => {
    render(<AppTextInput hint="Helper text" />);
    const input = screen.getByRole("textbox");
    const ids = (input.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
    const texts = ids.map((id) => document.getElementById(id)?.textContent);
    expect(texts).toContain("Helper text");
  });

  test("links error via aria-describedby", () => {
    render(<AppTextInput error="Invalid input" />);
    const input = screen.getByRole("textbox");
    const ids = (input.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
    const texts = ids.map((id) => document.getElementById(id)?.textContent);
    expect(texts).toContain("Invalid input");
  });

  test("forwardRef provides access to input DOM node", () => {
    let inputRef: HTMLInputElement | null = null;
    render(<AppTextInput ref={(el) => { inputRef = el; }} />);
    expect(inputRef).not.toBeNull();
    expect(inputRef!.tagName).toBe("INPUT");
  });
});
