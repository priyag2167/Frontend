import { useState, type FormEvent } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useCan, useSession } from "@/features/auth/hooks/useSession";
import { api } from "@/shared/api/client";
import { Field } from "@/shared/components/ui/Field";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Submit } from "@/shared/components/ui/Submit";
import { useDebounced } from "@/shared/hooks/useDebounced";
import type { Hcp, Page } from "@/shared/types/contracts";

export function HcpChatAccess({
  hcp,
  onClose,
}: {
  hcp: Hcp;
  onClose: () => void;
}) {
  const canManage = useCan("admin.manage");
  const canChat = useCan("chat.use");
  const session = useSession().data!;
  const navigate = useNavigate();
  const start = useMutation({
    mutationFn: () =>
      api<{ id: string }>("/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ hcpId: hcp.id }),
      }),
    onSuccess: ({ id }) => {
      onClose();
      navigate(`/messages?conversation=${id}`);
    },
  });
  return (
    <section>
      <h3 className="subheading">Professional messaging</h3>
      <p className="muted">
        {hcp.portalUserId
          ? `Linked HCP account: ${hcp.portalUserName ?? "HCP account"}`
          : "No HCP login account linked yet. An administrator can connect a verified HCP account below."}
      </p>
      {canChat &&
        session.roles.includes("medical_representative") &&
        hcp.assignedRepId === session.user.id &&
        hcp.portalUserId && (
          <button
            className="btn primary"
            disabled={start.isPending || !hcp.contactAllowed}
            onClick={() => start.mutate()}
          >
            <MessageCircle size={16} /> Message healthcare professional
          </button>
        )}
      <ErrorMessage error={start.error} />
      {canManage && <AccountLink key={hcp.version} hcp={hcp} />}
    </section>
  );
}

function AccountLink({ hcp }: { hcp: Hcp }) {
  const [editing, setEditing] = useState(false);
  const [account, setAccount] = useState(hcp.portalUserId ?? "");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const term = useDebounced(search);
  const client = useQueryClient();
  const accounts = useInfiniteQuery({
    queryKey: ["hcps", hcp.id, "chat-accounts", term],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api<Page<{ id: string; displayName: string; email: string }>>(
        `/hcps/${hcp.id}/chat-accounts?search=${encodeURIComponent(term)}&page=${pageParam}`,
        { signal },
      ),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    enabled: editing,
  });
  const choices = accounts.data?.pages.flatMap((p) => p.items) ?? [];
  const save = useMutation({
    mutationFn: () =>
      api(`/hcps/${hcp.id}/chat-account`, {
        method: "PUT",
        body: JSON.stringify({
          userId: account || null,
          reason,
          version: hcp.version,
        }),
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["hcps"] }),
        client.invalidateQueries({ queryKey: ["chat"] }),
      ]);
      setEditing(false);
    },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (reason.trim()) save.mutate();
  }
  if (!editing)
    return (
      <button className="btn secondary" onClick={() => setEditing(true)}>
        {hcp.portalUserId ? "Manage chat account" : "Link HCP chat account"}
      </button>
    );
  return (
    <form className="form-stack" onSubmit={submit}>
      <p>
        Choose the login belonging to this healthcare professional. Create an
        account with the HCP role in{" "}
        <Link to="/admin">People &amp; access</Link> first if needed. Changing
        the link does not transfer earlier conversations.
      </p>
      <Field label="Find HCP account">
        <input
          value={search}
          maxLength={200}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or account email"
        />
      </Field>
      <Field label="HCP login account">
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          disabled={save.isPending}
        >
          <option value="">No linked account</option>
          {account && !choices.some((c) => c.id === account) && (
            <option value={account}>
              {account === hcp.portalUserId
                ? (hcp.portalUserName ?? "Current account")
                : "Selected account"}
            </option>
          )}
          {choices.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName} · {c.email}
            </option>
          ))}
        </select>
      </Field>
      {accounts.hasNextPage && (
        <button
          type="button"
          className="btn secondary"
          disabled={accounts.isFetching}
          onClick={() => void accounts.fetchNextPage()}
        >
          Load more accounts
        </button>
      )}
      {accounts.isPending && (
        <p className="muted">Loading eligible accounts…</p>
      )}
      {!accounts.isPending && !choices.length && (
        <p className="muted">
          No eligible accounts found. Check the name, active status, HCP role
          and messaging permission.
        </p>
      )}
      <Field label="Identity verification / reason">
        <textarea
          required
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Record how you verified the account belongs to this HCP, or why you are unlinking it."
        />
      </Field>
      <ErrorMessage error={accounts.error || save.error} />
      <div className="form-actions">
        <button
          type="button"
          className="btn secondary"
          disabled={save.isPending}
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
        <Submit pending={save.isPending}>Save chat access</Submit>
      </div>
    </form>
  );
}
