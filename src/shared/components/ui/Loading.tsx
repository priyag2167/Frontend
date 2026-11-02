import { LoaderCircle } from "lucide-react";

export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={22} />
      <span>Loading your workspace…</span>
    </div>
  );
}
