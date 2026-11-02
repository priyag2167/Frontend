import { UserSelect } from "@/shared/components/UserSelect";
import { useState, type FormEvent } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FilePenLine,
  List,
  Play,
  RefreshCw,
  X,
} from "lucide-react";
import { useNow } from "@/shared/hooks/useNow";
import { api, jsonBody, params } from "@/shared/api/client";
import { useAction } from "@/shared/hooks/useAction";
import { useCan, useSession } from "@/features/auth/hooks/useSession";
import type { ContentItem, Engagement, Page } from "@/shared/types/contracts";
import { useUiStore } from "@/shared/stores/uiStore";
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

export default function Engagements() {
  const now = useNow();
  const userZone = useSession().data!.user.timeZone;
  const calendarDate = (value: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: userZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);

  const [searchParams, setSearchParams] = useSearchParams();
  const hcp = searchParams.get("hcp") ?? "";
  const [creating, setCreating] = useState(!!hcp),
    [report, setReport] = useState<Engagement | null>(null),
    [cancel, setCancel] = useState<Engagement | null>(null),
    [reschedule, setReschedule] = useState<Engagement | null>(null);
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [view, setView] = useState<"list" | "week">("list"),
    [anchor, setAnchor] = useState(() => calendarDate(new Date(now)));
  const start = new Date(`${anchor}T00:00:00`),
    end = new Date(start);
  end.setDate(end.getDate() + 7);
  const query = useQuery({
    queryKey: ["engagements", "list", status, page, view, anchor],
    queryFn: ({ signal }) =>
      api<Page<Engagement>>(
        "/engagements" +
          params({
            status,
            page,
            pageSize: view === "week" ? 100 : 20,
            from:
              view === "week"
                ? new Date(start.getTime() - 86400000).toISOString()
                : undefined,
            to:
              view === "week"
                ? new Date(end.getTime() + 86400000).toISOString()
                : undefined,
          }),
        { signal },
      ),
    placeholderData: keepPreviousData,
  });
  const transition = useAction<{
    id: string;
    status: string;
    version: number;
    reason: string;
  }>(
    (v) => `/engagements/${v.id}/transitions`,
    [["engagements"], ["dashboard"], ["audit"]],
  );
  const canWrite = useCan("engagement.write");
  const closeCreate = () => {
    setCreating(false);
    if (hcp) setSearchParams({}, { replace: true });
  };
  function shift(days: number) {
    const date = new Date(`${anchor}T12:00:00`);
    date.setDate(date.getDate() + days);
    setAnchor(localInput(date).slice(0, 10));
    setPage(1);
  }
  function actions(v: Engagement) {
    const live = ["scheduled", "rescheduled", "in_progress"].includes(v.status);
    return canWrite && live ? (
      <div className="row-actions">
        {v.status !== "in_progress" ? (
          <button
            className="btn small secondary"
            disabled={
              transition.isPending ||
              new Date(v.scheduledStart).getTime() > now + 15 * 60000
            }
            title="Start within 15 minutes of the appointment"
            onClick={() =>
              transition.mutate({
                id: v.id,
                status: "in_progress",
                version: v.version,
                reason: "Representative explicitly started the visit.",
              })
            }
          >
            <Play size={13} />
            Start visit
          </button>
        ) : (
          <button className="btn small primary" onClick={() => setReport(v)}>
            <FilePenLine size={13} />
            Call report
          </button>
        )}
        {v.status !== "in_progress" && (
          <button
            className="icon-button"
            aria-label="Reschedule visit"
            onClick={() => setReschedule(v)}
          >
            <RefreshCw size={15} />
          </button>
        )}
        <button
          className="icon-button"
          aria-label="Cancel visit"
          onClick={() => setCancel(v)}
        >
          <X size={15} />
        </button>
      </div>
    ) : null;
  }
  return (
    <>
      <PageHeader
        eyebrow="FIELD ENGAGEMENT"
        title="Visit planner"
        description={`Plan meaningful conversations. Display time zone: ${userZone}.`}
        actions={
          canWrite ? (
            <button className="btn primary" onClick={() => setCreating(true)}>
              <CalendarPlus size={17} />
              Schedule a visit
            </button>
          ) : null
        }
      />
      <div className="panel">
        <div className="toolbar">
          <div className="segmented">
            <button
              className={view === "list" ? "selected" : ""}
              onClick={() => {
                setView("list");
                setPage(1);
              }}
            >
              <List size={15} />
              List
            </button>
            <button
              className={view === "week" ? "selected" : ""}
              onClick={() => {
                setView("week");
                setPage(1);
              }}
            >
              <CalendarDays size={15} />
              Week
            </button>
          </div>
          <select
            aria-label="Visit status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All visit states</option>
            {[
              "scheduled",
              "in_progress",
              "completed",
              "cancelled",
              "rescheduled",
              "no_show",
              "requires_review",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          {view === "week" && (
            <div className="date-navigation">
              <button
                className="icon-button"
                aria-label="Previous week"
                onClick={() => shift(-7)}
              >
                <ChevronLeft size={17} />
              </button>
              <input
                type="date"
                aria-label="Week starting"
                value={anchor}
                onChange={(e) => {
                  if (e.target.value) {
                    setAnchor(e.target.value);
                    setPage(1);
                  }
                }}
              />
              <button
                className="icon-button"
                aria-label="Next week"
                onClick={() => shift(7)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          )}
          <span className="result-count">{query.data?.total ?? 0} visits</span>
        </div>
        <ErrorMessage error={transition.error} />
        <QueryState
          pending={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
        >
          {query.data?.items.length ? (
            view === "list" ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Appointment</th>
                      <th>Healthcare professional</th>
                      <th>Representative</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <strong>{v.subject}</strong>
                          <small>
                            <Clock3 size={12} /> {dateTime(v.scheduledStart)}
                          </small>
                        </td>
                        <td>
                          <strong>{v.hcpName}</strong>
                          <small>{v.institutionName}</small>
                        </td>
                        <td>
                          {v.ownerName}
                          <small>{v.channel.replaceAll("_", " ")}</small>
                        </td>
                        <td>
                          <Status value={v.status} />
                        </td>
                        <td>{actions(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="week-grid">
                {Array.from({ length: 7 }, (_, i) => {
                  const day = new Date(start);
                  day.setDate(day.getDate() + i);
                  const key = localInput(day).slice(0, 10);
                  const events = query.data.items.filter(
                    (v) =>
                      localInput(new Date(v.scheduledStart)).slice(0, 10) ===
                      key,
                  );
                  return (
                    <section
                      className={`week-day ${key === calendarDate(new Date(now)) ? "today" : ""}`}
                      key={key}
                    >
                      <header>
                        <small>
                          {day.toLocaleDateString(undefined, {
                            weekday: "short",
                          })}
                        </small>
                        <strong>{day.getDate()}</strong>
                      </header>
                      {events.map((v) => (
                        <article className="calendar-event" key={v.id}>
                          <small>
                            {new Date(v.scheduledStart).toLocaleTimeString(
                              undefined,
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </small>
                          <strong>{v.hcpName}</strong>
                          <p>{v.subject}</p>
                          <Status value={v.status} />
                          {actions(v)}
                        </article>
                      ))}
                    </section>
                  );
                })}
              </div>
            )
          ) : (
            <Empty
              title="A little room in your calendar"
              description="Schedule a visit with an authorised healthcare professional to get started."
            />
          )}
          <Pagination
            data={query.data}
            onPage={setPage}
            busy={query.isFetching}
          />
        </QueryState>
      </div>
      {creating && <ScheduleForm initialHcp={hcp} onClose={closeCreate} />}
      {report && <ReportForm visit={report} onClose={() => setReport(null)} />}
      {reschedule && (
        <RescheduleForm
          visit={reschedule}
          onClose={() => setReschedule(null)}
        />
      )}
      {cancel && (
        <ReasonDialog
          title="Cancel this visit?"
          description={`${cancel.hcpName} · ${dateTime(cancel.scheduledStart)}`}
          onClose={() => setCancel(null)}
          pending={transition.isPending}
          error={transition.error}
          confirm={(reason) =>
            transition.mutateAsync({
              id: cancel.id,
              status: "cancelled",
              version: cancel.version,
              reason,
            })
          }
        />
      )}
    </>
  );
}

function ScheduleForm({
  initialHcp,
  onClose,
}: {
  initialHcp: string;
  onClose: () => void;
}) {
  const user = useSession().data!.user;
  const [hcpId, setHcp] = useState(initialHcp),
    [ownerUserId, setOwner] = useState(user.id),
    [subject, setSubject] = useState(""),
    [engagementType, setType] = useState("Product education"),
    [channel, setChannel] = useState("in_person"),
    [locationText, setLocation] = useState("");
  const [start, setStart] = useState(() =>
      localInput(new Date(Date.now() + 3600000)),
    ),
    [end, setEnd] = useState(() => localInput(new Date(Date.now() + 5400000)));
  const save = useAction(
    "/engagements",
    [["engagements"], ["dashboard"], ["notifications"], ["audit"]],
    "POST",
    "Visit scheduled.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        hcpId,
        ownerUserId,
        engagementType,
        channel,
        subject,
        locationText: locationText || null,
        scheduledStart: new Date(start).toISOString(),
        scheduledEnd: new Date(end).toISOString(),
      });
      onClose();
    } catch {
      /* preserve values */
    }
  }
  return (
    <Dialog
      title="Schedule a visit"
      description={`Appointment inputs use your device time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <HcpSelect
          value={hcpId}
          onChange={setHcp}
          contactRequired
          onSelect={(hcp) => setOwner(hcp.assignedRepId)}
        />
        <Field label="Purpose / agenda">
          <input
            required
            maxLength={220}
            placeholder="What would you like to discuss?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Field>
        <div className="form-grid">
          <Field label="Visit type">
            <select
              value={engagementType}
              onChange={(e) => setType(e.target.value)}
            >
              {[
                "Product education",
                "Scientific exchange",
                "Routine follow-up",
                "Medical information",
                "Web meeting",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Channel">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="in_person">In person</option>
              <option value="web">Web meeting</option>
              <option value="phone">Phone</option>
              <option value="vr">VR assisted</option>
            </select>
          </Field>
          <Field label="Start">
            <input
              type="datetime-local"
              required
              value={start}
              min={localInput()}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field label="End">
            <input
              type="datetime-local"
              required
              value={end}
              min={start}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>
        </div>
        <UserSelect
          label="Representative"
          purpose="visit-owner"
          value={ownerUserId}
          onChange={setOwner}
          hcpId={hcpId}
          waitForContext={!hcpId}
        />
        <Field label="Location / meeting details (optional)">
          <input
            maxLength={300}
            value={locationText}
            onChange={(e) => setLocation(e.target.value)}
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
          <Submit pending={save.isPending}>Schedule visit</Submit>
        </div>
      </form>
    </Dialog>
  );
}

function RescheduleForm({
  visit,
  onClose,
}: {
  visit: Engagement;
  onClose: () => void;
}) {
  const [start, setStart] = useState(
      localInput(new Date(visit.scheduledStart)),
    ),
    [end, setEnd] = useState(localInput(new Date(visit.scheduledEnd))),
    [reason, setReason] = useState("");
  const save = useAction(
    `/engagements/${visit.id}/reschedule`,
    [["engagements"], ["dashboard"], ["audit"]],
    "POST",
    "Visit rescheduled.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        scheduledStart: new Date(start).toISOString(),
        scheduledEnd: new Date(end).toISOString(),
        version: visit.version,
        reason,
      });
      onClose();
    } catch {
      /* shown below */
    }
  }
  return (
    <Dialog
      title="Reschedule visit"
      description={visit.hcpName}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <Field label="New start">
          <input
            type="datetime-local"
            value={start}
            min={localInput()}
            required
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
        <Field label="New end">
          <input
            type="datetime-local"
            value={end}
            min={start}
            required
            onChange={(e) => setEnd(e.target.value)}
          />
        </Field>
        <Field label="Reason">
          <textarea
            required
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <ErrorMessage error={save.error} />
        <Submit pending={save.isPending}>Reschedule visit</Submit>
      </form>
    </Dialog>
  );
}

function ReportForm({
  visit,
  onClose,
}: {
  visit: Engagement;
  onClose: () => void;
}) {
  const now = useNow();
  const client = useQueryClient();
  const [key] = useState(() => crypto.randomUUID());
  const [start, setStart] = useState(
      localInput(new Date(visit.actualStart ?? visit.scheduledStart)),
    ),
    [end, setEnd] = useState(localInput()),
    [notes, setNotes] = useState(""),
    [outcome, setOutcome] = useState(""),
    [questions, setQuestions] = useState(""),
    [materials, setMaterials] = useState<string[]>([]),
    [followUp, setFollowUp] = useState(""),
    [due, setDue] = useState("");
  const canReadContent = useCan("content.read");
  const content = useQuery({
    enabled: canReadContent,
    queryKey: ["content", "published"],
    queryFn: ({ signal }) =>
      api<Page<ContentItem>>("/content?usableOnly=true&pageSize=100", {
        signal,
      }),
  });
  const save = useMutation({
    mutationFn: () =>
      api(`/engagements/${visit.id}/call-report`, {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: jsonBody({
          actualStart: new Date(start).toISOString(),
          actualEnd: new Date(end).toISOString(),
          interactionNotes: notes,
          outcome,
          questionsRaised: questions || null,
          materials,
          followUpAction: followUp || null,
          followUpDueAt: due ? new Date(due).toISOString() : null,
        }),
      }),
    onSuccess: async () => {
      await Promise.all(
        [
          "engagements",
          "reports",
          "tasks",
          "dashboard",
          "notifications",
          "audit",
        ].map((k) => client.invalidateQueries({ queryKey: [k] })),
      );
      useUiStore.getState().notify("Call report submitted. Visit completed.");
    },
  });
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync();
      onClose();
    } catch {
      /* keep report for retry with same idempotency key */
    }
  }
  return (
    <Dialog
      title="Complete visit & submit report"
      description={`${visit.hcpName} · ${visit.subject}`}
      onClose={onClose}
      wide
    >
      <form className="form-stack" onSubmit={submit}>
        <div className="notice">
          <FilePenLine size={18} />
          <p>
            Record the actual interaction. Submission completes this visit and
            creates any follow-up in one transaction.
          </p>
        </div>
        <div className="form-grid">
          <Field label="Actual interaction start">
            <input
              type="datetime-local"
              required
              value={start}
              max={end}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field label="Actual interaction end">
            <input
              type="datetime-local"
              required
              value={end}
              max={localInput()}
              min={start}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>
        </div>
        <Field
          label="Discussion notes"
          hint="Use permitted professional discussion notes. Do not include patient identifiers."
        >
          <textarea
            required
            maxLength={10000}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what was actually discussed…"
          />
        </Field>
        <Field label="Visit outcome">
          <select
            required
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          >
            <option value="">Choose the actual outcome</option>
            <option value="Information shared">Information shared</option>
            <option value="Follow-up required">Follow-up required</option>
            <option value="Medical information requested">
              Medical information requested
            </option>
            <option value="No further action">No further action</option>
          </select>
        </Field>
        <Field label="Questions / information requests (optional)">
          <textarea
            rows={2}
            maxLength={4000}
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
          />
        </Field>
        <fieldset>
          <legend>Published materials used (optional)</legend>
          {content.data?.items
            .filter(
              (c) =>
                (!c.expiresAt || new Date(c.expiresAt).getTime() > now) &&
                (!c.effectiveAt || new Date(c.effectiveAt).getTime() <= now),
            )
            .map((c) => (
              <label className="check-field" key={c.id}>
                <input
                  type="checkbox"
                  checked={materials.includes(c.currentVersionId)}
                  onChange={(e) =>
                    setMaterials((prev) =>
                      e.target.checked
                        ? [...prev, c.currentVersionId]
                        : prev.filter((id) => id !== c.currentVersionId),
                    )
                  }
                />
                {c.title} · v{c.versionNumber}
              </label>
            ))}
          {!content.data?.items.length && (
            <p className="muted">
              No usable published materials available in your access scope.
            </p>
          )}
        </fieldset>
        <div className="form-grid">
          <Field label="Agreed follow-up (optional)">
            <input
              maxLength={220}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Describe the next action"
            />
          </Field>
          <Field label="Follow-up due">
            <input
              type="datetime-local"
              required={!!followUp}
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </Field>
        </div>
        <ErrorMessage error={save.error || content.error} />
        <div className="form-actions">
          <button
            className="btn secondary"
            type="button"
            disabled={save.isPending}
            onClick={onClose}
          >
            Cancel
          </button>
          <Submit pending={save.isPending}>Submit call report</Submit>
        </div>
      </form>
    </Dialog>
  );
}
