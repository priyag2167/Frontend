import { useState } from "react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { api } from "@/shared/api/client";
import { Dialog } from "@/shared/components/ui/Dialog";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Empty } from "@/shared/components/ui/Empty";
import { Loading } from "@/shared/components/ui/Loading";
import { useDebounced } from "@/shared/hooks/useDebounced";
import { initials } from "@/shared/utils/format";
import type { Page } from "@/shared/types/contracts";
import type { ChatContact } from "../types";

export function NewChat({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const term = useDebounced(search);
  const contacts = useInfiniteQuery({
    queryKey: ["chat", "contacts", term],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api<Page<ChatContact>>(
        `/chat/contacts?search=${encodeURIComponent(term)}&page=${pageParam}`,
        { signal },
      ),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
  });
  const start = useMutation({
    mutationFn: (hcpId: string) =>
      api<{ id: string }>("/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ hcpId }),
      }),
    onSuccess: ({ id }) => onSelect(id),
  });
  const items = contacts.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <Dialog
      title="New conversation"
      description="Connect with your assigned representative or linked healthcare professionals."
      onClose={onClose}
    >
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search name or institution…"
      />
      <ErrorMessage error={contacts.error || start.error} />
      {contacts.isPending ? (
        <Loading />
      ) : items.length ? (
        <div className="chat-contact-list">
          {items.map((contact) => (
            <button
              className="chat-contact"
              key={contact.hcpId}
              disabled={start.isPending}
              onClick={() => start.mutate(contact.hcpId)}
            >
              <span className="avatar teal">{initials(contact.peerName)}</span>
              <span>
                <strong>{contact.peerName}</strong>
                <small>{contact.peerRole}</small>
                <small>{contact.institutionName}</small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          ))}
          {contacts.hasNextPage && (
            <button
              className="btn secondary"
              disabled={contacts.isFetching}
              onClick={() => void contacts.fetchNextPage()}
            >
              Show more contacts
            </button>
          )}
        </div>
      ) : (
        <Empty
          title={term ? "No matching contacts" : "No contacts available yet"}
          description={
            term
              ? "Try a different name or institution."
              : "An administrator needs to link the HCP’s login account in the HCP directory. An assigned medical representative and contact permission are also required."
          }
        />
      )}
    </Dialog>
  );
}
