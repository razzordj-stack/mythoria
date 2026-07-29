import { forwardRef, type TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; hint?: string };
export const MythoriaTextarea = forwardRef<HTMLTextAreaElement, Props>(function MythoriaTextarea({ label, error, hint, id, className = "", ...props }, ref) {
  const fieldId = id ?? props.name; const messageId = fieldId ? `${fieldId}-message` : undefined;
  return <label className="block text-sm font-semibold text-[var(--mythoria-gold-light)]" htmlFor={fieldId}>{label}<textarea {...props} ref={ref} id={fieldId} aria-invalid={Boolean(error)} aria-describedby={error || hint ? messageId : undefined} className={["mythoria-textarea mt-2", error ? "border-[var(--mythoria-danger)]" : "", className].join(" ")} />{(error || hint) && <span id={messageId} className={`mt-2 block text-xs ${error ? "text-red-300" : "text-[var(--mythoria-text-muted)]"}`}>{error ?? hint}</span>}</label>;
});
