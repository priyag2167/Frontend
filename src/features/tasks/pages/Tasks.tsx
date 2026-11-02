import { UserSelect } from "@/shared/components/UserSelect";
import { useState, type FormEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Check, Clock3, Plus } from "lucide-react";
import { useNow } from "@/shared/hooks/useNow";
import { api, params } from "@/shared/api/client";
import { useAction } from "@/shared/hooks/useAction";
import { useCan, useSession } from "@/features/auth/hooks/useSession";
import type { FollowUp, Page } from "@/shared/types/contracts";
import { Dialog } from "@/shared/components/ui/Dialog";
import { Empty } from "@/shared/components/ui/Empty";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Pagination } from "@/shared/components/ui/Pagination";
import { QueryState } from "@/shared/components/ui/QueryState";
import { ReasonDialog } from "@/shared/components/ui/ReasonDialog";
import { Status } from "@/shared/components/ui/Status";
import { Submit } from "@/shared/components/ui/Submit";
import { dateTime, localInput } from "@/shared/utils/format";
import { HcpSelect } from "@/features/hcps/components/HcpSelect";

export default function Tasks() {
  const now = useNow();
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [creating, setCreating] = useState(false),
    [transition, setTransition] = useState<{
      task: FollowUp;
      status: "in_progress" | "completed" | "cancelled";
    } | null>(null);
  const canWrite = useCan("task.write");
  const query = useQuery({
    queryKey: ["tasks", "list", status, page],
    queryFn: ({ signal }) =>
      api<Page<FollowUp>>("/follow-up-tasks" + params({ page, status }), {
        signal,
      }),
    placeholderData: keepPreviousData,
  });
  const action = useAction(
    `/follow-up-tasks/${transition?.task.id}/transitions`,
    [["tasks"], ["dashboard"], ["audit"]],
    "POST",
    "Follow-up status updated.",
  );
  return (
    <>
      <PageHeader
        eyebrow="FOLLOW-THROUGH"
        title="Follow-up tasks"
        description="Keep your commitments in view. Give every conversation a next step."
        actions={
          canWrite ? (
            <button className="btn primary" onClick={() => setCreating(true)}>
              <Plus size={17} />
              Create task
            </button>
          ) : null
        }
      />
      <div className="panel">
        <div className="toolbar">
          <div className="filter-tabs">
            {[
              ["", "All tasks"],
              ["open", "Open"],
              ["in_progress", "In progress"],
              ["overdue", "Overdue"],
              ["completed", "Completed"],
              ["cancelled", "Cancelled"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={status === value ? "active" : ""}
                onClick={() => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="result-count">{query.data?.total ?? 0} tasks</span>
        </div>
        <QueryState
          pending={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
        >
          {query.data?.items.length ? (
            <div className="task-list">
              {query.data.items.map((t) => {
                const overdue =
                  ["open", "in_progress"].includes(t.status) &&
                  new Date(t.dueAt).getTime() < now;
                return (
                  <article
                    className={`task-row ${t.status === "completed" ? "done" : ""}`}
                    key={t.id}
                  >
                    <button
                      className="task-check"
                      aria-label={`Complete ${t.title}`}
                      disabled={
                        !canWrite || !["open", "in_progress"].includes(t.status)
                      }
                      onClick={() =>
                        setTransition({ task: t, status: "completed" })
                      }
                    >
                      {t.status === "completed" && <Check size={15} />}
                    </button>
                    <div className="task-description">
                      <strong>{t.title}</strong>
                      <small>
                        {t.hcpName ?? "General follow-up"} · {t.assigneeName}
                      </small>
                      {t.description && <p>{t.description}</p>}
                    </div>
                    <span className={`priority priority-${t.priority}`}>
                      {["", "High", "Medium", "Low", "Low"][t.priority]}{" "}
                      priority
                    </span>
                    <span className={overdue ? "overdue" : "muted"}>
                      <Clock3 size={13} /> {dateTime(t.dueAt)}
                    </span>
                    <Status value={overdue ? "overdue" : t.status} />
                    {canWrite && ["open", "in_progress"].includes(t.status) && (
                      <div className="row-actions">
                        {t.status === "open" && (
                          <button
                            className="text-button"
                            onClick={() =>
                              setTransition({ task: t, status: "in_progress" })
                            }
                          >
                            Start task
                          </button>
                        )}
                        <button
                          className="text-button danger-text"
                          onClick={() =>
                            setTransition({ task: t, status: "cancelled" })
                          }
                        >
                          Cancel task
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty
              title={
                status === "completed"
                  ? "No completed tasks yet"
                  : "A clear path ahead"
              }
              description="Create a follow-up here or include one when submitting a call report."
            />
          )}
          <Pagination data={query.data} onPage={setPage} />
        </QueryState>
      </div>
      {creating && <TaskForm onClose={() => setCreating(false)} />}
      {transition && (
        <ReasonDialog
          title={
            transition.status === "completed"
              ? "Complete follow-up"
              : transition.status === "cancelled"
                ? "Cancel follow-up"
                : "Start follow-up"
          }
          description={transition.task.title}
          pending={action.isPending}
          error={action.error}
          onClose={() => setTransition(null)}
          confirm={(reason) =>
            action.mutateAsync({
              status: transition.status,
              version: transition.task.version,
              reason,
            })
          }
        />
      )}
    </>
  );
}
function TaskForm({ onClose }: { onClose: () => void }) {
  const user = useSession().data!.user;
  const canReadHcps = useCan("hcp.read");
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [hcpId, setHcp] = useState(""),
    [assignedTo, setAssigned] = useState(user.id),
    [priority, setPriority] = useState(2),
    [due, setDue] = useState(() => localInput(new Date(Date.now() + 86400000)));
  const save = useAction(
    "/follow-up-tasks",
    [["tasks"], ["dashboard"], ["audit"], ["notifications"]],
    "POST",
    "Follow-up task created.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        title,
        description: description || null,
        hcpId: hcpId || null,
        assignedTo,
        priority,
        dueAt: new Date(due).toISOString(),
      });
      onClose();
    } catch {
      /* input preserved */
    }
  }
  return (
    <Dialog
      title="Create a follow-up"
      description="Make the next action clear, owned, and time bound."
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <Field label="Action / task title">
          <input
            required
            maxLength={220}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to happen next?"
          />
        </Field>
        <Field label="Details (optional)">
          <textarea
            rows={3}
            maxLength={4000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        {canReadHcps && (
          <HcpSelect
            value={hcpId}
            onChange={setHcp}
            optional
            onSelect={(hcp) => setAssigned(hcp.assignedRepId)}
          />
        )}
        <div className="form-grid">
          <UserSelect
            label="Assigned to"
            purpose="task-assignee"
            value={assignedTo}
            onChange={setAssigned}
            hcpId={hcpId}
          />
          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              <option value={1}>High</option>
              <option value={2}>Medium</option>
              <option value={3}>Low</option>
            </select>
          </Field>
        </div>
        <Field label="Due date & time">
          <input
            type="datetime-local"
            min={localInput()}
            required
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </Field>
        <ErrorMessage error={save.error} />
        <div className="form-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={onClose}
            disabled={save.isPending}
          >
            Cancel
          </button>
          <Submit pending={save.isPending}>Create task</Submit>
        </div>
      </form>
    </Dialog>
  );
}
