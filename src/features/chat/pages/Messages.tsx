import { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, MessageCirclePlus, CheckCheck } from "lucide-react";
import { useSession } from "@/features/auth/hooks/useSession";
import { api } from "@/shared/api/client";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Empty } from "@/shared/components/ui/Empty";
import { Loading } from "@/shared/components/ui/Loading";
import { useDebounced } from "@/shared/hooks/useDebounced";
import { initials } from "@/shared/utils/format";
import type { Page } from "@/shared/types/contracts";
import type { Conversation } from "../types";
import { NewChat } from "../components/NewChat";
import { ChatThread } from "../components/ChatThread";
import "../styles/chat.css";

function previewTime(value: string) {
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Messages() {
  const [params, setParams] = useSearchParams();
  const selected = params.get("conversation");
  const [newChat, setNewChat] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  // Drafts live only in this signed-in screen, never in shared browser storage.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const term = useDebounced(search);
  const userId = useSession().data!.user.id;
  const client = useQueryClient();
  const conversations = useInfiniteQuery({
    queryKey: ["chat", "conversations", term, unreadOnly],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api<Page<Conversation>>(
        `/chat/conversations?search=${encodeURIComponent(term)}&unreadOnly=${unreadOnly}&page=${pageParam}`,
        { signal },
      ),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    refetchInterval: 8000,
    staleTime: 0,
  });
  const items = [
    ...new Map(
      conversations.data?.pages.flatMap((p) => p.items).map((c) => [c.id, c]),
    ).values(),
  ];
  function select(id: string) {
    setParams({ conversation: id });
    setNewChat(false);
    void client.invalidateQueries({ queryKey: ["chat", "conversations"] });
  }
  return (
    <section className="messages-page" aria-label="Professional messages">
      <div className="messages-heading">
        <div>
          <span className="chat-eyebrow">STAY CONNECTED</span>
          <h1>Messages</h1>
          <p>Good conversations. Better follow-through.</p>
        </div>
        <span className="chat-heading-note">
          <MessageCircle size={17} /> Your professional conversations
        </span>
      </div>
      <div className={`chat-workspace ${selected ? "has-conversation" : ""}`}>
        <aside className="chat-sidebar" aria-label="Conversations">
          <div className="chat-list-heading">
            <h2>Chats</h2>
            <button
              className="icon-button chat-new"
              aria-label="New conversation"
              title="New conversation"
              onClick={() => setNewChat(true)}
            >
              <MessageCirclePlus size={21} />
            </button>
          </div>
          <div className="chat-search">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search conversations…"
            />
          </div>
          <div className="chat-filters" aria-label="Conversation filters">
            <button
              aria-pressed={!unreadOnly}
              className={!unreadOnly ? "selected" : ""}
              onClick={() => setUnreadOnly(false)}
            >
              All chats
            </button>
            <button
              aria-pressed={unreadOnly}
              className={unreadOnly ? "selected" : ""}
              onClick={() => setUnreadOnly(true)}
            >
              Unread
            </button>
          </div>
          <ErrorMessage error={conversations.error} />
          {conversations.error && (
            <button
              className="btn secondary"
              onClick={() => void conversations.refetch()}
            >
              Retry conversations
            </button>
          )}
          <div className="chat-conversation-list">
            {conversations.isPending ? (
              <Loading />
            ) : items.length ? (
              items.map((c) => (
                <button
                  key={c.id}
                  className={`chat-list-item ${selected === c.id ? "active" : ""}`}
                  aria-current={selected === c.id ? "true" : undefined}
                  onClick={() => select(c.id)}
                >
                  <span className="avatar teal">{initials(c.peerName)}</span>
                  <span className="chat-preview">
                    <span className="chat-preview-top">
                      <strong>{c.peerName}</strong>
                      <time dateTime={c.updatedAt}>
                        {previewTime(c.updatedAt)}
                      </time>
                    </span>
                    <span className="chat-peer-role">{c.peerRole}</span>
                    <span className="chat-preview-bottom">
                      <span>
                        {c.lastSenderId === userId ? "You: " : ""}
                        {c.lastMessage ?? "Say hello to start the conversation"}
                      </span>
                      {c.unreadCount > 0 && (
                        <span
                          className="chat-unread"
                          aria-label={`${c.unreadCount} unread messages`}
                        >
                          {c.unreadCount > 99 ? "99+" : c.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <Empty
                title={
                  unreadOnly
                    ? "You’re all caught up"
                    : term
                      ? "No matching chats"
                      : "Start a conversation"
                }
                description={
                  unreadOnly
                    ? "New messages will appear here."
                    : term
                      ? "Try another name or institution."
                      : "Keep questions and follow-ups together in one place."
                }
                action={
                  !term && !unreadOnly ? (
                    <button
                      className="btn primary"
                      onClick={() => setNewChat(true)}
                    >
                      New conversation
                    </button>
                  ) : undefined
                }
              />
            )}
            {conversations.hasNextPage && (
              <button
                className="btn secondary chat-load"
                disabled={conversations.isFetching}
                onClick={() => void conversations.fetchNextPage()}
              >
                Load more chats
              </button>
            )}
          </div>
          <div className="chat-list-footer">
            <CheckCheck size={15} /> A little clarity goes a long way.
          </div>
        </aside>
        {selected ? (
          <ChatThread
            key={selected}
            id={selected}
            userId={userId}
            onBack={() => setParams({})}
            draft={drafts[selected] ?? ""}
            setDraft={(value) =>
              setDrafts((previous) => ({ ...previous, [selected]: value }))
            }
          />
        ) : (
          <div className="chat-welcome">
            <div className="chat-welcome-art">
              <MessageCircle size={54} strokeWidth={1.4} />
              <span>
                <CheckCheck size={23} />
              </span>
            </div>
            <span className="chat-eyebrow">A DIRECT CONNECTION</span>
            <h2>Keep the conversation going</h2>
            <p>
              Ask a question, coordinate your next visit, or follow up with your
              healthcare professional or representative.
            </p>
            <button className="btn primary" onClick={() => setNewChat(true)}>
              <MessageCirclePlus size={18} /> Start a conversation
            </button>
            <small>
              Only you and your assigned contact can access your chat.
            </small>
          </div>
        )}
      </div>
      {newChat && (
        <NewChat onClose={() => setNewChat(false)} onSelect={select} />
      )}
    </section>
  );
}
