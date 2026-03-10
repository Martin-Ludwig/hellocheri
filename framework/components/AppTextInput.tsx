import React from "react";

export interface AppTextInputProps extends React.ComponentPropsWithoutRef<"input"> {
  label?: string;
  error?: string;
  hint?: string;
}

export const AppTextInput = React.forwardRef<HTMLInputElement, AppTextInputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div>
        {label && <label htmlFor={inputId}>{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={className}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {hint && <span id={hintId}>{hint}</span>}
        {error && <span id={errorId}>{error}</span>}
      </div>
    );
  },
);

AppTextInput.displayName = "AppTextInput";
