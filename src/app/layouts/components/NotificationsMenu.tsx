import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "@/shared/api/client";
import type { Notification, Page } from "@/shared/types/contracts";
import { dateTime } from "@/shared/utils/format";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";

export function NotificationsMenu() {
  const client = useQueryClient();
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: ({ signal }) =>
      api<Page<Notification>>("/notifications?pageSize=8", { signal }),
    refetchInterval: 60000,
  });
  const markRead = useMutation({
    mutationFn: () => api("/notifications/read", { method: "POST" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const unread = notifications.data?.items.filter((n) => !n.readAt).length ?? 0;
  return (
    <details className="notifications">
      <summary
        className="icon-button"
        aria-label={`${unread} unread notifications`}
      >
        <Bell size={19} />
        {unread > 0 && <span className="notification-dot" />}
      </summary>
      <div className="notification-popover">
        <div className="section-heading">
          <h3>Notifications</h3>
          <button
            className="text-button"
            disabled={markRead.isPending}
            onClick={() => markRead.mutate()}
          >
            Mark read
          </button>
        </div>
        <ErrorMessage error={notifications.error || markRead.error} />
        {notifications.data?.items.length ? (
          notifications.data.items.map((n) => (
            <div
              className={`notification-item ${n.readAt ? "" : "unread"}`}
              key={n.id}
            >
              <strong>{n.title}</strong>
              <small>{dateTime(n.createdAt)}</small>
            </div>
          ))
        ) : (
          <p className="muted">You're all caught up.</p>
        )}
      </div>
    </details>
  );
}
