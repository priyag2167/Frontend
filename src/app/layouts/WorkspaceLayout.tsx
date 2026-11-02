import { Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import {
  useSession,
  WorkspaceSessionContext,
} from "@/features/auth/hooks/useSession";
import { useBranding } from "@/features/branding/hooks/useBranding";
import { Loading } from "@/shared/components/ui/Loading";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";

export function WorkspaceLayout() {
  const session = useSession();
  const branding = useBranding().data;
  if (session.isPending) return <Loading />;
  if (session.error)
    return (
      <main className="connection-error">
        <h1>Unable to connect</h1>
        <ErrorMessage error={session.error} />
        <button className="btn primary" onClick={() => void session.refetch()}>
          Retry connection
        </button>
      </main>
    );
  if (!session.data) return <Navigate to="/login" replace />;

  return (
    <WorkspaceSessionContext value={session.data}>
      <div className="workspace">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Sidebar session={session.data} branding={branding} />
        <div className="workspace-body">
          <Header session={session.data} productName={branding?.productName} />
          <main id="main-content" className="main-content" tabIndex={-1}>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </main>
          <footer className="workspace-footer">
            <span>
              {branding?.productName ?? "Pharma VRM"} · Your engagement
              workspace
            </span>
            <span>
              <ShieldCheck size={13} /> Authorised workspace
            </span>
          </footer>
        </div>
        <Toast />
      </div>
    </WorkspaceSessionContext>
  );
}
