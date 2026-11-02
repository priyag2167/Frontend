import { ChevronRight, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useNow } from "@/shared/hooks/useNow";
import { useUiStore } from "@/shared/stores/uiStore";
import { initials } from "@/shared/utils/format";
import type { Session } from "@/shared/types/contracts";
import { NotificationsMenu } from "./NotificationsMenu";
import { getPageTitle } from "../../router/navigation";

export function Header({
  session,
  productName,
}: {
  session: Session;
  productName?: string;
}) {
  const { user, roles } = session;
  const now = useNow();
  const { pathname } = useLocation();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button mobile-menu"
          aria-label="Open navigation"
          aria-controls="workspace-navigation"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={22} />
        </button>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link
            className="breadcrumb-home"
            to={
              session.permissions.includes("reports.read") ? "/" : "/training"
            }
          >
            {productName ?? "Pharma VRM"}
          </Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="breadcrumb-current" aria-current="page">
            {getPageTitle(pathname)}
          </span>
        </nav>
      </div>
      <div className="topbar-right">
        <span className="today-label">
          {new Intl.DateTimeFormat(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(new Date(now))}
        </span>
        <NotificationsMenu />
        <Link
          className="profile"
          to="/settings"
          title="Open my settings"
          aria-label={`My settings for ${user.displayName}`}
        >
          <span className="avatar">{initials(user.displayName)}</span>
          <div>
            <strong>{user.displayName}</strong>
            <small>{roles[0]?.replaceAll("_", " ")}</small>
          </div>
        </Link>
      </div>
    </header>
  );
}
