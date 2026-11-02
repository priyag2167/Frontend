import type { ReactNode } from "react";
import { Check, LoaderCircle } from "lucide-react";

export function Submit({
  pending,
  children = "Save changes",
}: {
  pending: boolean;
  children?: ReactNode;
}) {
  return (
    <button type="submit" className="btn primary" disabled={pending}>
      {pending ? (
        <LoaderCircle size={16} className="spin" />
      ) : (
        <Check size={16} />
      )}{" "}
      {pending ? "Saving…" : children}
    </button>
  );
}
