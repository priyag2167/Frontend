import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { api } from "@/shared/api/client";
import type { AdminUserDetails } from "@/shared/types/contracts";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { QueryState } from "@/shared/components/ui/QueryState";
import { Status } from "@/shared/components/ui/Status";
import { dateTime, initials } from "@/shared/utils/format";
import { UserActions } from "../components/UserActions";
import { permissionDescriptions } from "../types/permissions";

export default function UserDetails() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: ({ signal }) =>
      api<AdminUserDetails>(`/admin/users/${id}`, { signal }),
  });
  const account = query.data;
  return (
    <>
      <Link to="/admin" className="text-button">
        <ArrowLeft size={16} /> Back to people & access
      </Link>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {account && (
          <>
            <PageHeader
              eyebrow="USER DETAILS"
              title={account.displayName}
              description={account.email}
              actions={
                <UserActions account={account} canManage={account.canManage} />
              }
            />
            <div className="user-detail-grid">
              <section className="panel">
                <div className="profile-hero">
                  <span className="avatar teal">
                    {initials(account.displayName)}
                  </span>
                  <div>
                    <h2>Account information</h2>
                    <Status value={account.status} />
                  </div>
                </div>
                <dl className="details-list">
                  <dt>Full name</dt>
                  <dd>{account.displayName}</dd>
                  <dt>Email</dt>
                  <dd>{account.email}</dd>
                  <dt>Phone</dt>
                  <dd>{account.phone ?? "Not provided"}</dd>
                  <dt>Department / team</dt>
                  <dd>{account.organisationUnitName ?? "Not assigned"}</dd>
                  <dt>Reporting manager</dt>
                  <dd>
                    {account.managerId ? (
                      <Link
                        className="user-link"
                        to={`/admin/users/${account.managerId}`}
                      >
                        {account.managerName}
                      </Link>
                    ) : (
                      "No manager"
                    )}
                  </dd>
                  <dt>Time zone</dt>
                  <dd>{account.timeZone}</dd>
                  <dt>Created</dt>
                  <dd>{dateTime(account.createdAt)}</dd>
                  <dt>Last updated</dt>
                  <dd>{dateTime(account.updatedAt)}</dd>
                  <dt>Last login</dt>
                  <dd>
                    {account.lastLoginAt
                      ? dateTime(account.lastLoginAt)
                      : "Never signed in"}
                  </dd>
                  <dt>Active sessions</dt>
                  <dd>{account.activeSessionCount}</dd>
                </dl>
                {account.status !== "active" && (
                  <div className="notice subtle">
                    <p>
                      This account cannot sign in. Its assigned permissions are
                      shown for reference.
                    </p>
                  </div>
                )}
              </section>
              <section className="panel">
                <div className="section-heading">
                  <h2>Roles & responsibility</h2>
                  <ShieldCheck size={20} />
                </div>
                {account.roleDetails.length ? (
                  account.roleDetails.map((role) => (
                    <div key={role.id} className="user-role-card">
                      <h3>{role.name.replaceAll("_", " ")}</h3>
                      <p>
                        {role.description ||
                          `${role.permissions.length} permissions assigned through this role.`}
                      </p>
                      <small>Assigned {dateTime(role.assignedAt)}</small>
                    </div>
                  ))
                ) : (
                  <p>No roles assigned.</p>
                )}
                <h3>Territories</h3>
                {account.territories.length ? (
                  <ul className="permission-list">
                    {account.territories.map((t) => (
                      <li key={t.id}>
                        {t.name} ({t.code})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No territories assigned.</p>
                )}
                <h3>Direct reports</h3>
                {account.directReports.length ? (
                  <ul className="permission-list">
                    {account.directReports.map((report) => (
                      <li key={report.id}>
                        <Link
                          className="user-link"
                          to={`/admin/users/${report.id}`}
                        >
                          {report.displayName}
                        </Link>{" "}
                        · {report.status}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No direct reports.</p>
                )}
              </section>
            </div>
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Effective permissions</h2>
                  <p>
                    Combined permissions from all assigned roles. Organisation
                    and team scope control whose records this user can access.
                  </p>
                </div>
                <span className="result-count">
                  {account.permissions.length} permissions
                </span>
              </div>
              {account.permissions.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Permission</th>
                        <th>Granted by role</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {account.permissions.map((p) => (
                        <tr key={p.key}>
                          <td>
                            <code>{p.key}</code>
                          </td>
                          <td>
                            {account.roleDetails
                              .filter((r) => r.permissions.includes(p.key))
                              .map((r) => r.name.replaceAll("_", " "))
                              .join(", ")}
                          </td>
                          <td>
                            {p.description ??
                              permissionDescriptions[p.key] ??
                              "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No permissions assigned.</p>
              )}
            </section>
          </>
        )}
      </QueryState>
    </>
  );
}
