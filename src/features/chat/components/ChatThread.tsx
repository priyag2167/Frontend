import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  Check,
  CheckCheck,
  Send,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { api, ApiError } from "@/shared/api/client";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Loading } from "@/shared/components/ui/Loading";
import { initials } from "@/shared/utils/format";
import type { ChatMessage, MessagePage } from "../types";

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  today.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ChatThread({
  id,
  userId,
  onBack,
  draft,
  setDraft,
}: {
  id: string;
  userId: string;
  onBack: () => void;
  draft: string;
  setDraft: (text: string) => void;
}) {
  const client = useQueryClient();
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef(true);
  const oldHeight = useRef<number | null>(null);
  const lastRead = useRef(0);
  const pendingSend = useRef<{ body: string; clientMessageId: string } | null>(
    null,
  );
  const [atBottom, setAtBottom] = useState(true);
  const [visible, setVisible] = useState(
    document.visibilityState === "visible",
  );
  const messages = useInfiniteQuery({
    queryKey: ["chat", "messages", id],
    initialPageParam: null as number | null,
    queryFn: ({ pageParam, signal }) =>
      api<MessagePage>(
        `/chat/conversations/${id}/messages${pageParam ? `?before=${pageParam}` : ""}`,
        { signal },
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: (query) =>
      query.state.error instanceof ApiError &&
      [403, 404].includes(query.state.error.status)
        ? false
        : 4000,
    staleTime: 0,
  });
  const conversation = messages.data?.pages[0]?.conversation;
  const rows = [
    ...new Map(
      messages.data?.pages.flatMap((p) => p.items).map((m) => [m.id, m]),
    ).values(),
  ].sort((a, b) => a.sequence - b.sequence);
  const latest = rows.at(-1)?.sequence ?? 0;
  const unavailable =
    messages.error instanceof ApiError &&
    [401, 403, 404].includes(messages.error.status);

  const read = useMutation({
    mutationFn: (sequence: number) =>
      api(`/chat/conversations/${id}/read`, {
        method: "POST",
        body: JSON.stringify({ sequence }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["chat", "unread"] });
      void client.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
    onError: () => {
      lastRead.current = 0;
    },
  });
  const markRead = read.mutate;
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (
      visible &&
      atBottom &&
      !unavailable &&
      latest > lastRead.current &&
      (conversation?.unreadCount ?? 0) > 0
    ) {
      lastRead.current = latest;
      markRead(latest);
    }
  }, [
    visible,
    atBottom,
    unavailable,
    latest,
    conversation?.unreadCount,
    messages.dataUpdatedAt,
    markRead,
  ]);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    if (oldHeight.current !== null) {
      element.scrollTop += element.scrollHeight - oldHeight.current;
      oldHeight.current = null;
    } else if (bottom.current) element.scrollTop = element.scrollHeight;
  }, [rows.length, latest]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      if (bottom.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (composer.current) {
      composer.current.style.height = "auto";
      composer.current.style.height = `${Math.min(composer.current.scrollHeight, 140)}px`;
    }
  }, [draft]);

  const send = useMutation({
    mutationFn: (input: { body: string; clientMessageId: string }) =>
      api<ChatMessage>(`/chat/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      pendingSend.current = null;
      setDraft("");
      bottom.current = true;
      setAtBottom(true);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["chat", "messages", id] }),
        client.invalidateQueries({ queryKey: ["chat", "conversations"] }),
      ]);
      composer.current?.focus();
    },
  });
  function submit(event?: FormEvent) {
    event?.preventDefault();
    const body = draft.trim();
    if (
      !body ||
      draft.length > 4000 ||
      send.isPending ||
      !conversation?.canSend ||
      unavailable
    )
      return;
    // Keep the identifier on retry, including when the server saved a message but its response was lost.
    if (pendingSend.current?.body !== body)
      pendingSend.current = { body, clientMessageId: crypto.randomUUID() };
    send.mutate(pendingSend.current!);
  }
  function jumpToLatest() {
    bottom.current = true;
    setAtBottom(true);
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }

  if (unavailable)
    return (
      <div className="chat-thread chat-unavailable">
        <MessageCircle size={40} />
        <h2>This conversation is unavailable</h2>
        <p>Your assignment or account access may have changed.</p>
        <button className="btn secondary" onClick={onBack}>
          Back to conversations
        </button>
      </div>
    );
  return (
    <section
      className="chat-thread"
      aria-label={
        conversation
          ? `Conversation with ${conversation.peerName}`
          : "Conversation"
      }
    >
      <header className="chat-thread-header">
        <button
          className="icon-button chat-back"
          aria-label="Back to conversations"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="avatar teal">
          {conversation ? initials(conversation.peerName) : "…"}
        </span>
        <div className="chat-thread-person">
          <h2>{conversation?.peerName ?? "Loading conversation…"}</h2>
          <span>
            {conversation?.peerRole}
            {conversation?.institutionName
              ? ` · ${conversation.institutionName}`
              : ""}
          </span>
        </div>
        <span
          className={`chat-sync ${messages.error ? "disconnected" : ""}`}
          title="New messages refresh every four seconds"
        >
          <span />
          {messages.error ? "Reconnecting" : "Auto-updating"}
        </span>
      </header>
      {messages.error && (
        <div className="chat-error">
          <ErrorMessage error={messages.error} />
          <button
            className="btn secondary"
            onClick={() => void messages.refetch()}
          >
            <RefreshCw size={15} /> Retry connection
          </button>
        </div>
      )}
      <div
        className="chat-history"
        ref={scroller}
        onScroll={() => {
          const el = scroller.current!;
          bottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 60;
          setAtBottom(bottom.current);
        }}
        aria-label="Message history"
        tabIndex={0}
      >
        {messages.isPending ? (
          <Loading />
        ) : (
          <>
            {messages.hasNextPage && (
              <button
                className="chat-older"
                disabled={messages.isFetching}
                onClick={async () => {
                  oldHeight.current = scroller.current?.scrollHeight ?? null;
                  bottom.current = false;
                  setAtBottom(false);
                  const result = await messages.fetchNextPage();
                  if (result.isError) oldHeight.current = null;
                }}
              >
                {messages.isFetchingNextPage
                  ? "Loading…"
                  : "Load earlier messages"}
              </button>
            )}
            {!rows.length && (
              <div className="chat-first-message">
                <MessageCircle size={30} />
                <h3>A good place to connect</h3>
                <p>Say hello and start your professional conversation.</p>
              </div>
            )}
            {rows.map((message, index) => {
              const own = message.senderId === userId;
              const seen =
                own &&
                message.sequence <= (conversation?.peerReadSequence ?? 0);
              const newDay =
                !index ||
                new Date(rows[index - 1].createdAt).toDateString() !==
                  new Date(message.createdAt).toDateString();
              return (
                <div key={message.id}>
                  {newDay && (
                    <div className="chat-day">
                      <span>{dayLabel(message.createdAt)}</span>
                    </div>
                  )}
                  <div className={`chat-message-row ${own ? "own" : ""}`}>
                    <div className="chat-bubble">
                      <p>{message.body}</p>
                      <div className="chat-message-meta">
                        <time
                          dateTime={message.createdAt}
                          title={new Date(message.createdAt).toLocaleString()}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                        {own && (
                          <span
                            className={seen ? "chat-seen" : ""}
                            aria-label={seen ? "Read" : "Sent"}
                            title={seen ? "Read" : "Sent"}
                          >
                            {seen ? (
                              <CheckCheck size={16} />
                            ) : (
                              <Check size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
      {!atBottom && (
        <button className="chat-jump" onClick={jumpToLatest}>
          <ArrowDown size={16} /> Latest messages
        </button>
      )}
      <div className="sr-only" role="status">
        {latest ? `${rows.length} messages loaded` : "No messages yet"}
      </div>
      <div className="chat-composer-wrap">
        {conversation && !conversation.canSend && (
          <p className="chat-paused" role="status">
            Contact permission is withdrawn. You can read earlier messages;
            sending is paused.
          </p>
        )}
        <ErrorMessage error={send.error || read.error} />
        {send.isError && (
          <p className="chat-retry-note">
            Your text is still here. Use Send to retry.
          </p>
        )}
        <form className="chat-composer" onSubmit={submit}>
          <textarea
            ref={composer}
            rows={1}
            maxLength={4000}
            aria-label="Message"
            placeholder="Write a message…"
            value={draft}
            disabled={send.isPending || !conversation?.canSend}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                !window.matchMedia("(pointer: coarse)").matches
              ) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button
            className="chat-send"
            type="submit"
            aria-label="Send message"
            title="Send message"
            disabled={!draft.trim() || send.isPending || !conversation?.canSend}
          >
            <Send size={20} />
          </button>
        </form>
        <div className="chat-composer-hint">
          <span>
            {send.isPending
              ? "Sending…"
              : "Enter to send · Shift + Enter for a new line"}
          </span>
          <span>{draft.length.toLocaleString()} / 4,000</span>
        </div>
      </div>
    </section>
  );
}
