import { forwardRef, type SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; hint?: string };
export const MythoriaSelect = forwardRef<HTMLSelectElement, Props>(function MythoriaSelect({ label, error, hint, id, className = "", children, ...props }, ref) {
  const fieldId = id ?? props.name; const messageId = fieldId ? `${fieldId}-message` : undefined;
  return <label className="block text-sm font-semibold text-[var(--mythoria-gold-light)]" htmlFor={fieldId}>{label}<select {...props} ref={ref} id={fieldId} aria-invalid={Boolean(error)} aria-describedby={error || hint ? messageId : undefined} className={["mythoria-select mt-2", error ? "border-[var(--mythoria-danger)]" : "", className].join(" ")}>{children}</select>{(error || hint) && <span id={messageId} className={`mt-2 block text-xs ${error ? "text-red-300" : "text-[var(--mythoria-text-muted)]"}`}>{error ?? hint}</span>}</label>;
});
