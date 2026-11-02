import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { api, params } from "@/shared/api/client";
import { useDebounced } from "@/shared/hooks/useDebounced";
import type { AuditEntry, Page } from "@/shared/types/contracts";
import { Dialog } from "@/shared/components/ui/Dialog";
import { Empty } from "@/shared/components/ui/Empty";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Pagination } from "@/shared/components/ui/Pagination";
import { QueryState } from "@/shared/components/ui/QueryState";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { dateTime } from "@/shared/utils/format";

export default function Compliance() {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [entityType, setType] = useState(""),
    [selected, setSelected] = useState<AuditEntry | null>(null);
  const term = useDebounced(search);
  const query = useQuery({
    queryKey: ["audit", page, term, entityType],
    queryFn: ({ signal }) =>
      api<Page<AuditEntry>>(
        "/audit-events" + params({ page, search: term, entityType }),
        { signal },
      ),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        eyebrow="ACCOUNTABILITY"
        title="Audit trail"
        description="A traceable history of changes, reviews, and access events."
      />
      <div className="notice subtle">
        <ShieldCheck size={18} />
        <p>
          Events record the actor, server time, record reference, and
          correlation ID. Regulatory validation remains an organisation-specific
          process.
        </p>
      </div>
      <div className="panel">
        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search audit actions…"
          />
          <select
            aria-label="Record type"
            value={entityType}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All record types</option>
            {[
              "authentication",
              "user",
              "hcp",
              "engagement",
              "call_report",
              "task",
              "content",
              "course",
              "training_assignment",
              "simulation_session",
              "report",
            ].map((t) => (
              <option key={t} value={t}>
                {t.replaceAll("_", " ")}
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
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Record</th>
                    <th>Timestamp</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <strong>
                          {event.action
                            .replaceAll(".", " · ")
                            .replaceAll("_", " ")}
                        </strong>
                        <small>Event #{event.id}</small>
                      </td>
                      <td>{event.actorName ?? "Unauthenticated / system"}</td>
                      <td>{event.entityType.replaceAll("_", " ")}</td>
                      <td>{dateTime(event.occurredAt)}</td>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => setSelected(event)}
                        >
                          View evidence
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No matching audit events"
              description="Recorded changes and security activity will appear here."
            />
          )}
          <Pagination data={query.data} onPage={setPage} />
        </QueryState>
      </div>
      {selected && (
        <Dialog
          title="Audit evidence"
          description={`Event #${selected.id} · ${selected.action}`}
          onClose={() => setSelected(null)}
          wide
        >
          <dl className="details-list">
            <dt>Actor</dt>
            <dd>{selected.actorName ?? "Unauthenticated / system"}</dd>
            <dt>Server time</dt>
            <dd>{dateTime(selected.occurredAt)}</dd>
            <dt>Record ID</dt>
            <dd className="mono">{selected.entityId ?? "—"}</dd>
            <dt>Correlation ID</dt>
            <dd className="mono">{selected.correlationId}</dd>
            <dt>Source</dt>
            <dd>{selected.source}</dd>
          </dl>
          <h3 className="subheading">Recorded change evidence</h3>
          <pre className="evidence-json">
            {JSON.stringify(selected.changes, null, 2)}
          </pre>
        </Dialog>
      )}
    </>
  );
}
