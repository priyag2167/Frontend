import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function Empty({
  title = "Nothing here yet",
  description = "New records will appear here.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={26} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
