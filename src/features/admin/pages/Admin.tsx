import { UserSelect } from "@/shared/components/UserSelect";
import { useState, type FormEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { KeyRound, MapPin, Plus, Users, UploadCloud } from "lucide-react";
import { api, params } from "@/shared/api/client";
import { useAction } from "@/shared/hooks/useAction";
import { Link } from "react-router-dom";
import { UserAccessForm } from "../components/UserAccessForm";
import { UserActions } from "../components/UserActions";
import type { AdminUser, Page } from "@/shared/types/contracts";
import { Dialog } from "@/shared/components/ui/Dialog";
import { Empty } from "@/shared/components/ui/Empty";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Pagination } from "@/shared/components/ui/Pagination";
import { QueryState } from "@/shared/components/ui/QueryState";
import { Status } from "@/shared/components/ui/Status";
import { Submit } from "@/shared/components/ui/Submit";
import { dateTime, initials } from "@/shared/utils/format";

import { CsvImportDialog } from "@/shared/components/CsvImportDialog";

export default function Admin() {
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1),
    [editing, setEditing] = useState<AdminUser | null | undefined>(undefined),
    [territory, setTerritory] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "users", page],
    queryFn: ({ signal }) =>
      api<Page<AdminUser>>("/admin/users" + params({ page }), { signal }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        eyebrow="ORGANISATION"
        title="People & access"
        description="Give every person the access and accountability their work needs."
        actions={
          <>
            <button
              className="btn secondary"
              onClick={() => setImporting(true)}
            >
              <UploadCloud size={16} />
              Import CSV
            </button>
            <button
              className="btn secondary"
              onClick={() => setTerritory(true)}
            >
              <MapPin size={16} />
              Add territory
            </button>
            <button className="btn primary" onClick={() => setEditing(null)}>
              <Plus size={16} />
              Create account
            </button>
          </>
        }
      />
      <div className="notice subtle">
        <KeyRound size={18} />
        <p>
          Access is checked on every protected request. Changing roles or
          suspending an account revokes its active sessions.
        </p>
      </div>
      <div className="panel">
        <div className="toolbar">
          <Users size={18} />
          <strong>Organisation accounts</strong>
          <span className="result-count">
            {query.data?.total ?? 0} accounts
          </span>
        </div>
        <QueryState
          pending={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
        >
          {query.data?.items.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Role</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th>Last login</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Link
                          className="person-cell user-link"
                          to={`/admin/users/${u.id}`}
                          aria-label={`View details for ${u.displayName}`}
                        >
                          <span className="avatar teal">
                            {initials(u.displayName)}
                          </span>
                          <span>
                            <strong>{u.displayName}</strong>
                            <small>{u.email}</small>
                          </span>
                        </Link>
                      </td>
                      <td>
                        {u.roles.map((r) => r.replaceAll("_", " ")).join(", ")}
                      </td>
                      <td>{u.managerName ?? "—"}</td>
                      <td>
                        <Status value={u.status} />
                      </td>
                      <td>{dateTime(u.lastLoginAt)}</td>
                      <td>
                        <UserActions account={u} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty />
          )}
          <Pagination data={query.data} onPage={setPage} />
        </QueryState>
      </div>
      {importing && (
        <CsvImportDialog
          title="Import organisation accounts"
          path="/admin/users/imports"
          headers={[
            "email",
            "displayName",
            "password",
            "role",
            "managerEmail",
            "timeZone",
            "organisationUnitCode",
          ]}
          limit={200}
          invalidate={[["admin"], ["lookups"], ["audit"]]}
          onClose={() => setImporting(false)}
        />
      )}
      {editing !== undefined && (
        <UserAccessForm
          account={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
      {territory && <TerritoryForm onClose={() => setTerritory(false)} />}
    </>
  );
}
function TerritoryForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState(""),
    [code, setCode] = useState(""),
    [ownerUserId, setOwner] = useState("");
  const save = useAction(
    "/admin/territories",
    [["lookups"], ["audit"]],
    "POST",
    "Territory created.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({ name, code, ownerUserId });
      onClose();
    } catch {
      /* shown below */
    }
  }
  return (
    <Dialog
      title="Add a territory"
      description="Assign ownership to make field responsibility clear."
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <Field label="Territory code">
          <input
            required
            maxLength={80}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>
        <Field label="Territory name">
          <input
            required
            maxLength={160}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <UserSelect
          label="Territory owner"
          purpose="territory-owner"
          value={ownerUserId}
          onChange={setOwner}
        />
        <ErrorMessage error={save.error} />
        <Submit pending={save.isPending}>Create territory</Submit>
      </form>
    </Dialog>
  );
}
