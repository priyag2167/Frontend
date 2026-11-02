import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Login from "@/features/auth/pages/Login";
import { useCan } from "@/features/auth/hooks/useSession";
import { Empty } from "@/shared/components/ui/Empty";
import { Loading } from "@/shared/components/ui/Loading";
import { WorkspaceLayout } from "../layouts/WorkspaceLayout";
import { RequirePermission } from "./RequirePermission";
import { getPageTitle } from "./navigation";

const Dashboard = lazy(() => import("@/features/reporting/pages/Dashboard"));
const Guide = lazy(() => import("@/features/help/pages/Guide"));
const Hcps = lazy(() => import("@/features/hcps/pages/Hcps"));
const Messages = lazy(() => import("@/features/chat/pages/Messages"));
const Engagements = lazy(
  () => import("@/features/engagements/pages/Engagements"),
);
const Reports = lazy(() => import("@/features/engagements/pages/Reports"));
const Tasks = lazy(() => import("@/features/tasks/pages/Tasks"));
const Content = lazy(() => import("@/features/content/pages/Content"));
const Training = lazy(() => import("@/features/training/pages/Training"));
const Compliance = lazy(() => import("@/features/compliance/pages/Compliance"));
const OrganisationSettings = lazy(
  () => import("@/features/admin/pages/OrganisationSettings"),
);
const Admin = lazy(() => import("@/features/admin/pages/Admin"));
const UserDetails = lazy(() => import("@/features/admin/pages/UserDetails"));
const SettingsPage = lazy(() => import("@/features/auth/pages/Settings"));
const Integrations = lazy(
  () => import("@/features/integrations/pages/Integrations"),
);

function Home() {
  return useCan("reports.read") ? (
    <Dashboard />
  ) : (
    <Navigate to="/guide" replace />
  );
}

function PageTitle({ productName }: { productName: string }) {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);
  useEffect(() => {
    document.title = `${title} | ${productName}`;
  }, [title, productName]);
  return null;
}

export function AppRouter({ productName }: { productName: string }) {
  return (
    <BrowserRouter>
      <PageTitle productName={productName} />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<WorkspaceLayout />}>
            <Route index element={<Home />} />
            <Route path="guide" element={<Guide />} />
            <Route
              path="messages"
              element={
                <RequirePermission permission="chat.use">
                  <Messages />
                </RequirePermission>
              }
            />
            <Route
              path="hcps"
              element={
                <RequirePermission permission="hcp.read">
                  <Hcps />
                </RequirePermission>
              }
            />
            <Route
              path="engagements"
              element={
                <RequirePermission permission="engagement.read">
                  <Engagements />
                </RequirePermission>
              }
            />
            <Route
              path="call-reports"
              element={
                <RequirePermission permission="engagement.read">
                  <Reports />
                </RequirePermission>
              }
            />
            <Route
              path="tasks"
              element={
                <RequirePermission permission="task.read">
                  <Tasks />
                </RequirePermission>
              }
            />
            <Route
              path="content"
              element={
                <RequirePermission permission="content.read">
                  <Content />
                </RequirePermission>
              }
            />
            <Route
              path="training"
              element={
                <RequirePermission permission="training.read">
                  <Training />
                </RequirePermission>
              }
            />
            <Route
              path="analytics"
              element={
                <RequirePermission permission="reports.read">
                  <Dashboard analytics />
                </RequirePermission>
              }
            />
            <Route
              path="compliance"
              element={
                <RequirePermission permission="audit.read">
                  <Compliance />
                </RequirePermission>
              }
            />
            <Route
              path="organisation"
              element={
                <RequirePermission permission="admin.manage">
                  <OrganisationSettings />
                </RequirePermission>
              }
            />
            <Route
              path="admin"
              element={
                <RequirePermission permission="admin.manage">
                  <Admin />
                </RequirePermission>
              }
            />
            <Route
              path="admin/users/:id"
              element={
                <RequirePermission permission="admin.manage">
                  <UserDetails />
                </RequirePermission>
              }
            />
            <Route
              path="integrations"
              element={
                <RequirePermission permission="integrations.read">
                  <Integrations />
                </RequirePermission>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
            <Route
              path="*"
              element={
                <div className="panel">
                  <Empty
                    title="Page not found"
                    description="Use the navigation to return to your workspace."
                    action={
                      <Link className="btn primary" to="/">
                        Return to workspace
                      </Link>
                    }
                  />
                </div>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
