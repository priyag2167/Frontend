import { useState, type FormEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ClipboardList, Eye, ShieldCheck } from "lucide-react";
import { api, params } from "@/shared/api/client";
import { useAction } from "@/shared/hooks/useAction";
import { useCan, useSession } from "@/features/auth/hooks/useSession";
import type { CallReport, Page } from "@/shared/types/contracts";
import { Dialog } from "@/shared/components/ui/Dialog";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { Submit } from "@/shared/components/ui/Submit";
import { Empty } from "@/shared/components/ui/Empty";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Pagination } from "@/shared/components/ui/Pagination";
import { QueryState } from "@/shared/components/ui/QueryState";
import { ReasonDialog } from "@/shared/components/ui/ReasonDialog";
import { Status } from "@/shared/components/ui/Status";
import { dateTime } from "@/shared/utils/format";

export default function Reports() {
  const [amending, setAmending] = useState<CallReport | null>(null);
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [selected, setSelected] = useState<CallReport | null>(null),
    [review, setReview] = useState<{
      report: CallReport;
      decision: string;
    } | null>(null);
  const canReview = useCan("engagement.manage"),
    user = useSession().data!.user;
  const query = useQuery({
    queryKey: ["reports", status, page],
    queryFn: ({ signal }) =>
      api<Page<CallReport>>("/call-reports" + params({ page, status }), {
        signal,
      }),
    placeholderData: keepPreviousData,
  });
  const details = useQuery({
    queryKey: ["reports", "detail", selected?.id],
    queryFn: ({ signal }) =>
      api<CallReport>(`/call-reports/${selected!.id}`, { signal }),
    enabled: !!selected,
  });
  const action = useAction(
    `/call-reports/${review?.report.id}/review`,
    [["reports"], ["dashboard"], ["notifications"], ["audit"]],
    "POST",
    "Review recorded.",
  );
  return (
    <>
      <PageHeader
        eyebrow="ENGAGEMENT RECORDS"
        title="Call reports"
        description="Actual conversations, documented with context and clear follow-through."
      />
      <div className="panel">
        <div className="toolbar">
          <div className="toolbar-title">
            <ClipboardList size={18} />
            <strong>Interaction records</strong>
          </div>
          <select
            aria-label="Review status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All review states</option>
            {["submitted", "under_review", "approved", "rejected"].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
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
                    <th>Healthcare professional</th>
                    <th>Interaction</th>
                    <th>Outcome</th>
                    <th>Review</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.hcpName}</strong>
                        <small>{r.submittedByName}</small>
                      </td>
                      <td>
                        <strong>{r.subject}</strong>
                        <small>{dateTime(r.actualStart)}</small>
                      </td>
                      <td>{r.outcome}</td>
                      <td>
                        <Status value={r.reviewStatus} />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            aria-label="View call report"
                            onClick={() => setSelected(r)}
                          >
                            <Eye size={17} />
                          </button>
                          {r.reviewStatus === "rejected" &&
                            r.submittedBy === user.id && (
                              <button
                                className="btn small secondary"
                                onClick={() => setAmending(r)}
                              >
                                Correct & resubmit
                              </button>
                            )}
                          {canReview &&
                            r.submittedBy !== user.id &&
                            ["submitted", "under_review"].includes(
                              r.reviewStatus,
                            ) && (
                              <>
                                <button
                                  className="btn small secondary"
                                  onClick={() =>
                                    setReview({
                                      report: r,
                                      decision: "approved",
                                    })
                                  }
                                >
                                  <ShieldCheck size={14} />
                                  Approve
                                </button>
                                <button
                                  className="text-button danger"
                                  onClick={() =>
                                    setReview({
                                      report: r,
                                      decision: "rejected",
                                    })
                                  }
                                >
                                  Reject
                                </button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="The story of your visits, all here"
              description="Start a scheduled visit, then submit its call report from the visit planner."
            />
          )}
          <Pagination data={query.data} onPage={setPage} />
        </QueryState>
      </div>
      {selected && (
        <Dialog
          title="Call report"
          description={`${selected.hcpName} · ${selected.subject}`}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="form-stack">
            <Status value={selected.reviewStatus} />
            <dl className="details-list">
              <dt>Interaction</dt>
              <dd>
                {dateTime(selected.actualStart)} –{" "}
                {dateTime(selected.actualEnd)}
              </dd>
              <dt>Representative</dt>
              <dd>{selected.submittedByName}</dd>
              <dt>Channel</dt>
              <dd>{selected.channel.replaceAll("_", " ")}</dd>
              <dt>Outcome</dt>
              <dd>{selected.outcome}</dd>
            </dl>
            <h3>Discussion notes</h3>
            <p className="pre-wrap">{selected.interactionNotes}</p>
            {selected.questionsRaised && (
              <>
                <h3>Information requests</h3>
                <p className="pre-wrap">{selected.questionsRaised}</p>
              </>
            )}
            <h3>Materials used</h3>
            {selected.materials.length ? (
              selected.materials.map((m) => (
                <p key={m.id}>
                  {m.title} · v{m.version}
                </p>
              ))
            ) : (
              <p className="muted">None recorded</p>
            )}
            <ErrorMessage error={details.error} />
            {!!details.data?.amendments?.length && (
              <>
                <h3>Amendment history</h3>
                {details.data.amendments.map((amendment) => (
                  <details key={amendment.id}>
                    <summary>
                      {amendment.authorName} · {dateTime(amendment.createdAt)}
                    </summary>
                    <p>{amendment.reason}</p>
                    <pre className="evidence-json">
                      {JSON.stringify(amendment.previousRecord, null, 2)}
                    </pre>
                  </details>
                ))}
              </>
            )}
            {selected.reviewComments && (
              <div className="notice">
                <ShieldCheck size={17} />
                <div>
                  <strong>Review feedback</strong>
                  <p>{selected.reviewComments}</p>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}
      {amending && (
        <AmendForm report={amending} onClose={() => setAmending(null)} />
      )}
      {review && (
        <ReasonDialog
          title={
            review.decision === "approved"
              ? "Approve call report"
              : "Reject call report"
          }
          description="Your review and comments will be recorded in the audit trail."
          onClose={() => setReview(null)}
          pending={action.isPending}
          error={action.error}
          confirm={(comments) =>
            action.mutateAsync({ decision: review.decision, comments })
          }
        />
      )}
    </>
  );
}

function AmendForm({
  report,
  onClose,
}: {
  report: CallReport;
  onClose: () => void;
}) {
  const [interactionNotes, setNotes] = useState(report.interactionNotes),
    [outcome, setOutcome] = useState(report.outcome),
    [questionsRaised, setQuestions] = useState(report.questionsRaised ?? ""),
    [reason, setReason] = useState("");
  const save = useAction(
    `/call-reports/${report.id}/amendments`,
    [["reports"], ["audit"], ["dashboard"]],
    "POST",
    "Corrected report resubmitted. Previous evidence is preserved.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        interactionNotes,
        outcome,
        questionsRaised: questionsRaised || null,
        reason,
        version: report.version,
      });
      onClose();
    } catch {
      /* preserve correction */
    }
  }
  return (
    <Dialog
      title="Correct & resubmit report"
      description={`${report.hcpName} · Version ${report.version}. The previous record is preserved.`}
      onClose={onClose}
      wide
    >
      <form className="form-stack" onSubmit={submit}>
        {report.reviewComments && (
          <div className="notice">Review feedback: {report.reviewComments}</div>
        )}
        <Field label="Corrected discussion notes">
          <textarea
            required
            rows={5}
            maxLength={10000}
            value={interactionNotes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <Field label="Corrected outcome">
          <input
            required
            maxLength={100}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          />
        </Field>
        <Field label="Questions / information requests">
          <textarea
            rows={2}
            maxLength={4000}
            value={questionsRaised}
            onChange={(e) => setQuestions(e.target.value)}
          />
        </Field>
        <Field label="Reason for correction">
          <textarea
            required
            rows={2}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <p className="muted">
          The visit's actual times and recorded material versions remain part of
          its historical record. Existing follow-up tasks are managed
          separately.
        </p>
        <ErrorMessage error={save.error} />
        <Submit pending={save.isPending}>Resubmit for review</Submit>
      </form>
    </Dialog>
  );
}
