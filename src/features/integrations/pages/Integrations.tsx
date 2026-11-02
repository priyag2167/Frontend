import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cable, Server } from "lucide-react";
import { api, params } from "@/shared/api/client";
import type { Integration, Page } from "@/shared/types/contracts";
import { Empty } from "@/shared/components/ui/Empty";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Pagination } from "@/shared/components/ui/Pagination";
import { QueryState } from "@/shared/components/ui/QueryState";
import { Status } from "@/shared/components/ui/Status";
import { dateTime } from "@/shared/utils/format";

interface Job {
  id: string;
  providerKey: string;
  operation: string;
  status: string;
  attempts: number;
  nextAttemptAt: string | null;
  updatedAt: string;
}
export default function Integrations() {
  const [page, setPage] = useState(1);
  const connections = useQuery({
    queryKey: ["integrations", "status"],
    queryFn: ({ signal }) =>
      api<Integration[]>("/integrations/status", { signal }),
  });
  const jobs = useQuery({
    queryKey: ["integrations", "jobs", page],
    queryFn: ({ signal }) =>
      api<Page<Job>>("/integrations/jobs" + params({ page }), { signal }),
  });
  return (
    <>
      <PageHeader
        eyebrow="CONNECTED SYSTEMS"
        title="Integrations"
        description="Visibility into approved connections and delivery history."
      />
      <div className="notice subtle">
        <Cable size={18} />
        <p>
          Provider credentials and adapters must be configured by your
          deployment administrator. Unconfigured systems do not send business
          data.
        </p>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Enterprise connections</h2>
          <Server size={18} />
        </div>
        <QueryState
          pending={connections.isPending}
          error={connections.error}
          retry={() => void connections.refetch()}
        >
          {connections.data?.length ? (
            <div className="training-grid">
              {connections.data.map((c) => (
                <article className="training-card" key={c.id}>
                  <div className="section-heading">
                    <h3>{c.displayName}</h3>
                    <Status
                      value={
                        c.isEnabled && c.adapterAvailable
                          ? "configured"
                          : "not_configured"
                      }
                    />
                  </div>
                  <p>
                    {c.providerKey} · {c.environment}
                  </p>
                  <small>Last checked: {dateTime(c.lastCheckedAt)}</small>
                  {c.lastErrorCode && (
                    <p className="overdue">{c.lastErrorCode}</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="Ready for your approved systems"
              description="Connect your identity provider, CRM, document system, or VR provider after supplying their API contracts."
            />
          )}
        </QueryState>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Delivery & synchronisation history</h2>
        </div>
        <QueryState
          pending={jobs.isPending}
          error={jobs.error}
          retry={() => void jobs.refetch()}
        >
          {jobs.data?.items.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Operation</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>Next attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.data.items.map((j) => (
                    <tr key={j.id}>
                      <td>{j.providerKey}</td>
                      <td>{j.operation}</td>
                      <td>
                        <Status value={j.status} />
                      </td>
                      <td>{j.attempts}</td>
                      <td>{dateTime(j.nextAttemptAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No delivery jobs yet"
              description="Integration operations appear here when an approved adapter is active."
            />
          )}
          <Pagination data={jobs.data} onPage={setPage} />
        </QueryState>
      </section>
    </>
  );
}
