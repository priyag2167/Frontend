import { useSession } from "@/features/auth/hooks/useSession";
import { UserSelect } from "@/shared/components/UserSelect";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { useAction } from "@/shared/hooks/useAction";
import type { AdminUser } from "@/shared/types/contracts";
import { Dialog } from "@/shared/components/ui/Dialog";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { Submit } from "@/shared/components/ui/Submit";

export function UserAccessForm({
  account,
  onClose,
}: {
  account: AdminUser | null;
  onClose: () => void;
}) {
  const session = useSession().data!;
  const [displayName, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [role, setRole] = useState(account?.roles[0] ?? "medical_representative"),
    [status, setStatus] = useState(account?.status ?? "active"),
    [managerId, setManager] = useState(account?.managerId ?? ""),
    [reason, setReason] = useState("");
  const [organisationUnitId, setUnit] = useState(
    account?.organisationUnitId ?? "",
  );
  const units = useQuery({
    queryKey: ["admin", "units"],
    queryFn: ({ signal }) =>
      api<{ id: string; name: string; isActive: boolean }[]>(
        "/admin/organisation-units",
        {
          signal,
        },
      ),
  });
  const roles = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: ({ signal }) =>
      api<{ id: string; name: string; permissions: string[] }[]>(
        "/admin/roles",
        { signal },
      ),
  });
  const save = useAction(
    account ? `/admin/users/${account.id}/access` : "/admin/users",
    [["admin"], ["lookups"], ["audit"]],
    account ? "PUT" : "POST",
    account ? "Access updated and sessions revoked." : "User account created.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync(
        account
          ? {
              role,
              status,
              managerId: managerId || null,
              organisationUnitId: organisationUnitId || null,
              reason,
            }
          : {
              email,
              displayName,
              password,
              role,
              managerId: managerId || null,
              organisationUnitId: organisationUnitId || null,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
      );
      onClose();
    } catch {
      /* shown below */
    }
  }
  return (
    <Dialog
      title={account ? "Manage account access" : "Create an account"}
      description={
        account
          ? account.displayName
          : "Provision an individual account with the least required access."
      }
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        {!account && (
          <>
            <Field label="Full name">
              <input
                required
                maxLength={160}
                value={displayName}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Work email">
              <input
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field
              label="Initial password"
              hint="At least 12 characters. Share it using your approved secure channel."
            >
              <input
                type="password"
                required
                minLength={12}
                maxLength={256}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </>
        )}
        <Field label="Role">
          <select
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {roles.data
              ?.filter((r) =>
                r.permissions.every((permission) =>
                  session.permissions.includes(permission),
                ),
              )
              .map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name.replaceAll("_", " ")}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Department / team">
          <select
            value={organisationUnitId}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="">No unit assigned</option>
            {units.data
              ?.filter((u) => u.isActive)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </Field>
        <UserSelect
          label="Reporting manager"
          purpose="reporting-manager"
          value={managerId}
          onChange={setManager}
          excludeUserId={account?.id}
          optional
        />
        {account && (
          <>
            <Field label="Account status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </Field>
            <Field label="Reason for access change">
              <textarea
                required
                maxLength={2000}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          </>
        )}
        <ErrorMessage error={save.error || roles.error || units.error} />
        <Submit pending={save.isPending}>
          {account ? "Update access" : "Create account"}
        </Submit>
      </form>
    </Dialog>
  );
}
