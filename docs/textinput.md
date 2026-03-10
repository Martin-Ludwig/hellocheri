# AppTextInput

A base text input component shared across all projects. Lives in `framework/components/AppTextInput.tsx`.

Import via:

```ts
import { AppTextInput } from "@framework/components";
```

## Features

- Accepts all native `<input>` HTML attributes via props spread
- Optional `label`, `error`, and `hint` slots
- Accessibility built-in: `aria-invalid`, `aria-describedby` set automatically
- `forwardRef` support for DOM access
- No hardcoded styling — projects apply Tailwind classes via `className`

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `label` | `string` | — | Renders a `<label>` bound to the input via `htmlFor` |
| `error` | `string` | — | Renders error text; sets `aria-invalid="true"` and links via `aria-describedby` |
| `hint` | `string` | — | Renders helper text below the input; linked via `aria-describedby` |
| `className` | `string` | — | Applied directly to the `<input>` element |
| `id` | `string` | auto | Overrides the auto-generated ID |
| `...rest` | — | — | All native `<input>` attributes (`placeholder`, `disabled`, `type`, `onChange`, …) |

## DOM structure

```html
<div>
  <label for="...">...</label>         <!-- only if label provided -->
  <input aria-invalid aria-describedby="..." class="..." />
  <span id="...-hint">...</span>       <!-- only if hint provided -->
  <span id="...-error">...</span>      <!-- only if error provided -->
</div>
```

## Usage

### Minimal

```tsx
<AppTextInput placeholder="Enter value" />
```

### With label and hint

```tsx
<AppTextInput
  label="Email"
  hint="We'll never share your email."
  type="email"
/>
```

### With error

```tsx
<AppTextInput
  label="Email"
  error="Please enter a valid email address."
  type="email"
/>
```

### Project-level styling

Projects wrap `AppTextInput` in their own component and add Tailwind classes:

```tsx
// lists/packages/frontend/src/components/ListInput.tsx
import { AppTextInput, AppTextInputProps } from "@framework/components";

export function ListInput(props: AppTextInputProps) {
  return (
    <AppTextInput
      {...props}
      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}
```

### With ref

```tsx
const ref = useRef<HTMLInputElement>(null);

<AppTextInput ref={ref} label="Name" />

// later:
ref.current?.focus();
```
