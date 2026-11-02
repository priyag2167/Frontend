import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NavLink, useNavigate } from "react-router-dom";
import { BookOpenCheck, LogOut, Settings, X } from "lucide-react";
import { BrandLogo } from "@/features/branding/components/BrandLogo";
import { api, resetCsrf } from "@/shared/api/client";
import { useUiStore } from "@/shared/stores/uiStore";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import type { Session } from "@/shared/types/contracts";
import type { Branding } from "@/features/branding/types/branding";
import { navigation } from "../../router/navigation";
import { useUnreadMessages } from "@/features/chat/hooks/useUnreadMessages";

export function Sidebar({
  session,
  branding,
}: {
  session: Session;
  branding: Branding | null | undefined;
}) {
  const { permissions } = session;
  const unread =
    useUnreadMessages(permissions.includes("chat.use")).data?.count ?? 0;
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const sidebar = useRef<HTMLElement>(null);
  const client = useQueryClient();
  const navigate = useNavigate();
  const logout = useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: async () => {
      resetCsrf();
      await client.cancelQueries();
      client.setQueryData(["auth", "me"], null);
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      useUiStore.getState().reset();
      navigate("/login", { replace: true });
    },
  });

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    function updateNavigation() {
      if (sidebar.current)
        sidebar.current.inert = mobile.matches && !sidebarOpen;
      if (!mobile.matches && sidebarOpen) setSidebarOpen(false);
    }
    updateNavigation();
    mobile.addEventListener("change", updateNavigation);
    return () => mobile.removeEventListener("change", updateNavigation);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen || !window.matchMedia("(max-width: 760px)").matches)
      return;
    const previousFocus = document.activeElement;
    const content = document.querySelector<HTMLElement>(".workspace-body");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (content) content.inert = true;
    const focusable = () =>
      Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled)",
        ) ?? [],
      );
    focusable()[0]?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setSidebarOpen(false);
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (content) content.inert = false;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        id="workspace-navigation"
        ref={sidebar}
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        aria-label="Workspace navigation"
        role={sidebarOpen ? "dialog" : undefined}
        aria-modal={sidebarOpen || undefined}
      >
        <button
          className="icon-button sidebar-close"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
        <NavLink className="brand" to="/" onClick={() => setSidebarOpen(false)}>
          <BrandLogo
            url={branding?.logoUrl}
            companyName={branding?.companyName}
          />
          <div>
            {branding?.productName ?? "Pharma VRM"}
            <span title={branding?.companyName}>
              {branding?.companyName ?? "VRM WORKSPACE"}
            </span>
          </div>
        </NavLink>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation
            .filter((item) => permissions.includes(item.permission))
            .map(({ icon: Icon, ...item }) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.to === "/messages" && unread > 0 && (
                  <span
                    className="nav-unread"
                    aria-label={`${unread} unread messages`}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink
            className="nav-item"
            to="/guide"
            onClick={() => setSidebarOpen(false)}
          >
            <BookOpenCheck size={18} /> Workflow guide
          </NavLink>
          <div className="workspace-note">
            <span className="live-dot" /> Connected workspace
            <small>One place for every relationship.</small>
          </div>
          <NavLink
            className="nav-item"
            to="/settings"
            onClick={() => setSidebarOpen(false)}
          >
            <Settings size={18} />
            My settings
          </NavLink>
          <button
            className="nav-item"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut size={18} />
            Sign out
          </button>
          <ErrorMessage error={logout.error} />
        </div>
      </aside>
    </>
  );
}
