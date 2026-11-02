import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { useAction } from "@/shared/hooks/useAction";
import type { AdminUserDetails } from "@/shared/types/contracts";
import { Dialog } from "@/shared/components/ui/Dialog";
import { QueryState } from "@/shared/components/ui/QueryState";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { Submit } from "@/shared/components/ui/Submit";

export function UserProfileForm({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: ({ signal }) =>
      api<AdminUserDetails>(`/admin/users/${id}`, { signal }),
  });
  return (
    <Dialog
      title="Edit user"
      description="Update account information. Saving ends this user's active sessions."
      onClose={onClose}
    >
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {query.data && <ProfileFields account={query.data} onClose={onClose} />}
      </QueryState>
    </Dialog>
  );
}

function ProfileFields({
  account,
  onClose,
}: {
  account: AdminUserDetails;
  onClose: () => void;
}) {
  const [displayName, setName] = useState(account.displayName);
  const [email, setEmail] = useState(account.email);
  const [phone, setPhone] = useState(account.phone ?? "");
  const [timeZone, setTimeZone] = useState(account.timeZone);
  const [reason, setReason] = useState("");
  const save = useAction(
    `/admin/users/${account.id}`,
    [["admin"], ["lookups"], ["audit"]],
    "PUT",
    "User updated and sessions revoked.",
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await save.mutateAsync({
        displayName,
        email,
        phone: phone || null,
        timeZone,
        reason,
      });
      onClose();
    } catch {
      /* shown below */
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
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
      <Field label="Phone">
        <input
          type="tel"
          maxLength={40}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>
      <Field
        label="Time zone"
        hint="IANA time zone, for example Asia/Kolkata or UTC."
      >
        <input
          required
          maxLength={80}
          value={timeZone}
          onChange={(e) => setTimeZone(e.target.value)}
        />
      </Field>
      <Field label="Reason for change">
        <textarea
          required
          maxLength={2000}
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <ErrorMessage error={save.error} />
      <div className="form-actions">
        <button
          type="button"
          className="btn secondary"
          disabled={save.isPending}
          onClick={onClose}
        >
          Cancel
        </button>
        <Submit pending={save.isPending}>Save user</Submit>
      </div>
    </form>
  );
}
