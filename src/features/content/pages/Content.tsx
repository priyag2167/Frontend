import { useState, type FormEvent } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  Download,
  FileText,
  Plus,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { api, download, params } from "@/shared/api/client";
import { useAction } from "@/shared/hooks/useAction";
import { useCan, useSession } from "@/features/auth/hooks/useSession";
import { useDebounced } from "@/shared/hooks/useDebounced";
import { useNow } from "@/shared/hooks/useNow";
import type { ContentItem, Page } from "@/shared/types/contracts";
import { Dialog } from "@/shared/components/ui/Dialog";
import { Empty } from "@/shared/components/ui/Empty";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Pagination } from "@/shared/components/ui/Pagination";
import { QueryState } from "@/shared/components/ui/QueryState";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { Status } from "@/shared/components/ui/Status";
import { Submit } from "@/shared/components/ui/Submit";
import { dateTime, localInput } from "@/shared/utils/format";

export default function Content() {
  const now = useNow();
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [upload, setUpload] = useState(false),
    [versionFor, setVersionFor] = useState<ContentItem | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [workflow, setWorkflow] = useState<{
      item: ContentItem;
      action: string;
    } | null>(null);
  const term = useDebounced(search),
    canWrite = useCan("content.write"),
    canReview = useCan("content.review"),
    isAdmin = useCan("admin.manage"),
    user = useSession().data!.user;
  const query = useQuery({
    queryKey: ["content", "list", page, term, status],
    queryFn: ({ signal }) =>
      api<Page<ContentItem>>(
        "/content" + params({ page, search: term, status }),
        { signal },
      ),
    placeholderData: keepPreviousData,
  });
  const getFile = useMutation({
    mutationFn: (item: ContentItem) =>
      download(`/content/${item.id}/download`, item.fileName),
  });
  function actions(item: ContentItem) {
    const owner = item.ownerUserId === user.id || isAdmin;
    const reviewer = canReview && item.ownerUserId !== user.id;
    const a: string[] = [];
    if (canWrite && owner && ["draft", "rejected"].includes(item.status))
      a.push("submit");
    if (reviewer && item.status === "submitted") a.push("start_review");
    if (reviewer && item.status === "under_review") a.push("approve", "reject");
    if (canWrite && owner && item.status === "approved") a.push("publish");
    if (canWrite && owner && ["published", "approved"].includes(item.status))
      a.push("retire");
    return a;
  }
  return (
    <>
      <PageHeader
        eyebrow="APPROVED KNOWLEDGE"
        title="Content library"
        description="The right information. The right version. Ready for the right conversation."
        actions={
          canWrite ? (
            <button className="btn primary" onClick={() => setUpload(true)}>
              <Plus size={17} />
              Upload document
            </button>
          ) : null
        }
      />
      <div className="panel">
        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search content titles…"
          />
          <select
            aria-label="Content status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All accessible content</option>
            {[
              "draft",
              "submitted",
              "under_review",
              "approved",
              "published",
              "rejected",
              "retired",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <ErrorMessage error={getFile.error} />
        <QueryState
          pending={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
        >
          {query.data?.items.length ? (
            <div className="content-grid">
              {query.data.items.map((item) => (
                <article className="content-card" key={item.id}>
                  <div className="content-card-cover">
                    <div className="document-glyph">
                      <FileText size={35} />
                      <span>PDF</span>
                    </div>
                    <span className="version-label">
                      VERSION {item.versionNumber}
                    </span>
                  </div>
                  <div className="content-card-body">
                    <div className="section-heading">
                      <span className="eyebrow">
                        {item.contentType.replaceAll("_", " ")}
                      </span>
                      <Status
                        value={
                          item.expiresAt &&
                          new Date(item.expiresAt).getTime() < now
                            ? "expired"
                            : item.status
                        }
                      />
                    </div>
                    <button
                      className="content-title"
                      onClick={() => setSelected(item.id)}
                    >
                      {item.title}
                    </button>
                    <p>{item.description || "No description provided."}</p>
                    <small>
                      {item.ownerName} · Updated {dateTime(item.updatedAt)}
                    </small>
                    {item.scanStatus === "development_unscanned" && (
                      <small className="development-label">
                        Development document · not virus scanned
                      </small>
                    )}
                    <div className="content-actions">
                      <button
                        className="btn small secondary"
                        disabled={getFile.isPending}
                        onClick={() => getFile.mutate(item)}
                      >
                        <Download size={14} />
                        Download
                      </button>
                      {actions(item).map((action) => (
                        <button
                          className="text-button"
                          key={action}
                          onClick={() => setWorkflow({ item, action })}
                        >
                          {action.replaceAll("_", " ")}
                        </button>
                      ))}
                      {canWrite &&
                        (item.ownerUserId === user.id || isAdmin) &&
                        !["submitted", "under_review"].includes(
                          item.status,
                        ) && (
                          <button
                            className="text-button"
                            onClick={() => setVersionFor(item)}
                          >
                            New version
                          </button>
                        )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="A trusted source of knowledge"
              description="Uploaded documents follow an independent review and publication workflow before use in visits."
            />
          )}
          <Pagination data={query.data} onPage={setPage} />
        </QueryState>
      </div>
      {upload && <UploadForm onClose={() => setUpload(false)} />}
      {versionFor && (
        <UploadForm item={versionFor} onClose={() => setVersionFor(null)} />
      )}
      {workflow && (
        <WorkflowForm {...workflow} onClose={() => setWorkflow(null)} />
      )}
      {selected && (
        <ContentDetails id={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
function UploadForm({
  item,
  onClose,
}: {
  item?: ContentItem;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [contentType, setType] = useState("presentation"),
    [audience, setAudience] = useState("internal"),
    [changeSummary, setSummary] = useState("");
  const save = useAction<FormData>(
    item ? `/content/${item.id}/versions` : "/content",
    [["content"], ["training"], ["audit"]],
    "POST",
    item
      ? "New document version created as a draft."
      : "Document uploaded as a draft.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    if (item) {
      form.set("changeSummary", changeSummary);
    } else {
      form.set("title", title);
      form.set("description", description);
      form.set("contentType", contentType);
      form.set("audience", audience);
    }
    try {
      await save.mutateAsync(form);
      onClose();
    } catch {
      /* input retained */
    }
  }
  return (
    <Dialog
      title={item ? "Upload a new version" : "Upload controlled content"}
      description={
        item
          ? item.title
          : "PDF documents up to 10 MB. New uploads start as drafts."
      }
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        {!item && (
          <>
            <Field label="Document title">
              <input
                required
                maxLength={240}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                maxLength={4000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <div className="form-grid">
              <Field label="Content type">
                <select
                  value={contentType}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="presentation">Product presentation</option>
                  <option value="scientific_material">
                    Scientific material
                  </option>
                  <option value="sop">SOP / controlled procedure</option>
                  <option value="training">Training document</option>
                </select>
              </Field>
              <Field label="Audience">
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                >
                  <option value="internal">Internal</option>
                  <option value="commercial">Commercial</option>
                  <option value="all">All authorised users</option>
                </select>
              </Field>
            </div>
          </>
        )}
        {item && (
          <Field label="Summary of changes">
            <textarea
              required
              maxLength={2000}
              rows={3}
              value={changeSummary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </Field>
        )}
        <div className="upload-zone">
          <UploadCloud size={28} />
          <Field label="Select PDF document">
            <input
              type="file"
              accept=".pdf,application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <small>
            Stored securely and accessed through the authorised API.
          </small>
        </div>
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
          <Submit pending={save.isPending}>Upload draft</Submit>
        </div>
      </form>
    </Dialog>
  );
}
function WorkflowForm({
  item,
  action,
  onClose,
}: {
  item: ContentItem;
  action: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState(""),
    [effective, setEffective] = useState(localInput()),
    [expires, setExpires] = useState("");
  const save = useAction(
    `/content/${item.id}/actions`,
    [["content"], ["training"], ["audit"], ["notifications"], ["dashboard"]],
    "POST",
    "Content workflow updated.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        action,
        comments,
        version: item.version,
        effectiveAt:
          action === "publish" ? new Date(effective).toISOString() : null,
        expiresAt:
          action === "publish" && expires
            ? new Date(expires).toISOString()
            : null,
      });
      onClose();
    } catch {
      /* error shown */
    }
  }
  return (
    <Dialog
      title={`${action.replaceAll("_", " ")} content`}
      description={item.title}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <div className="notice">
          <ShieldCheck size={18} />
          <p>
            This action and your comments will be recorded against version{" "}
            {item.versionNumber}.
          </p>
        </div>
        {action === "publish" && (
          <div className="form-grid">
            <Field label="Effective from">
              <input
                type="datetime-local"
                required
                value={effective}
                onChange={(e) => setEffective(e.target.value)}
              />
            </Field>
            <Field label="Expires on (optional)">
              <input
                type="datetime-local"
                value={expires}
                min={effective}
                onChange={(e) => setExpires(e.target.value)}
              />
            </Field>
          </div>
        )}
        <Field label="Review comments / reason">
          <textarea
            required
            maxLength={2000}
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </Field>
        <ErrorMessage error={save.error} />
        <div className="form-actions">
          <button
            className="btn secondary"
            type="button"
            onClick={onClose}
            disabled={save.isPending}
          >
            Cancel
          </button>
          <Submit pending={save.isPending}>
            Confirm {action.replaceAll("_", " ")}
          </Submit>
        </div>
      </form>
    </Dialog>
  );
}
function ContentDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useQuery({
    queryKey: ["content", id],
    queryFn: ({ signal }) => api<ContentItem>(`/content/${id}`, { signal }),
  });
  const item = query.data;
  return (
    <Dialog title="Content record" onClose={onClose} wide>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {item && (
          <div className="form-stack">
            <div className="section-heading">
              <h2>{item.title}</h2>
              <Status value={item.status} />
            </div>
            <p>{item.description}</p>
            <dl className="details-list">
              <dt>Current version</dt>
              <dd>{item.versionNumber}</dd>
              <dt>Author</dt>
              <dd>{item.ownerName}</dd>
              <dt>Effective</dt>
              <dd>{dateTime(item.effectiveAt)}</dd>
              <dt>Expires</dt>
              <dd>{dateTime(item.expiresAt)}</dd>
              <dt>SHA-256</dt>
              <dd className="mono">{item.checksumSha256}</dd>
            </dl>
            <h3>Version review history</h3>
            {item.history?.length ? (
              item.history.map((entry, i) => (
                <div className="activity-row" key={i}>
                  <div>
                    <strong>
                      {entry.reviewerName} · v{entry.versionNumber}
                    </strong>
                    <p>{entry.comments}</p>
                    <small>{dateTime(entry.decidedAt)}</small>
                  </div>
                  <Status value={entry.decision} />
                </div>
              ))
            ) : (
              <p className="muted">No approval decisions recorded.</p>
            )}
          </div>
        )}
      </QueryState>
    </Dialog>
  );
}
