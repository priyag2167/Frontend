import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CalendarPlus,
  CheckCheck,
  Clock3,
  Download,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { useNow } from "@/shared/hooks/useNow";
import { api, download, params } from "@/shared/api/client";
import { useCan, useSession } from "@/features/auth/hooks/useSession";
import { useUiStore } from "@/shared/stores/uiStore";
import type {
  Dashboard as DashboardData,
  Engagement,
  FollowUp,
  Page,
} from "@/shared/types/contracts";
import { Empty } from "@/shared/components/ui/Empty";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { QueryState } from "@/shared/components/ui/QueryState";
import { Status } from "@/shared/components/ui/Status";
import { dateTime, localInput, initials } from "@/shared/utils/format";

export default function Dashboard({
  analytics = false,
}: {
  analytics?: boolean;
}) {
  const now = useNow();
  const session = useSession().data!;
  const days = useUiStore((s) => s.reportingDays),
    setDays = useUiStore((s) => s.setReportingDays);
  const [from, setFrom] = useState(() =>
      localInput(new Date(Date.now() - 30 * 86400000)).slice(0, 10),
    ),
    [to, setTo] = useState(() => localInput().slice(0, 10));
  const fromISO = new Date(`${from}T00:00:00`).toISOString();
  const end = new Date(`${to}T00:00:00`);
  end.setDate(end.getDate() + 1);
  const toISO = end.toISOString();
  const query = useQuery({
    queryKey: [
      "dashboard",
      analytics ? from : days,
      analytics ? to : "overview",
    ],
    queryFn: ({ signal }) =>
      api<DashboardData>(
        "/reports/engagements" +
          params(
            analytics
              ? { from: fromISO, to: toISO }
              : {
                  from: new Date(Date.now() - days * 86400000).toISOString(),
                  to: new Date(Date.now() + 86400000).toISOString(),
                },
          ),
        { signal },
      ),
  });
  const canVisit = useCan("engagement.read"),
    canTask = useCan("task.read"),
    canSchedule = useCan("engagement.write"),
    canExport = useCan("engagement.manage");
  const upcoming = useQuery({
    queryKey: ["engagements", "upcoming"],
    queryFn: ({ signal }) =>
      api<Page<Engagement>>(
        "/engagements" +
          params({
            from: new Date().toISOString(),
            to: new Date(Date.now() + 7 * 86400000).toISOString(),
            pageSize: 100,
          }),
        { signal },
      ),
    enabled: !analytics && canVisit,
  });
  const tasks = useQuery({
    queryKey: ["tasks", "overview"],
    queryFn: ({ signal }) =>
      api<Page<FollowUp>>("/follow-up-tasks?status=open&pageSize=5", {
        signal,
      }),
    enabled: !analytics && canTask,
  });
  const exportReport = useMutation({
    mutationFn: () =>
      download(
        "/reports/engagements/export" + params({ from: fromISO, to: toISO }),
        "engagements.csv",
      ),
  });
  const data = query.data;
  const rate = data?.counts.planned
    ? Math.round((data.counts.completed / data.counts.planned) * 100)
    : 0;
  const greeting =
    new Date(now).getHours() < 12
      ? "Good morning"
      : new Date(now).getHours() < 17
        ? "Good afternoon"
        : "Good evening";
  const firstName = session.user.displayName.split(" ")[0];
  return (
    <>
      <PageHeader
        eyebrow={
          analytics ? "MEASURED FROM YOUR RECORDS" : `${greeting}, ${firstName}`
        }
        title={analytics ? "Engagement analytics" : "Workspace overview"}
        description={
          analytics
            ? "Turn recorded activity into a clearer picture of your team."
            : "Track your visits, follow-ups, and team activity in one place."
        }
        actions={
          <>
            {analytics ? (
              <>
                {canExport && (
                  <button
                    className="btn secondary"
                    disabled={exportReport.isPending}
                    onClick={() => exportReport.mutate()}
                  >
                    <Download size={16} />
                    {exportReport.isPending ? "Exporting…" : "Export CSV"}
                  </button>
                )}
              </>
            ) : (
              <select
                aria-label="Reporting period"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            )}
            <button
              className="icon-button bordered"
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RefreshCw size={17} className={query.isFetching ? "spin" : ""} />
            </button>
          </>
        }
      />
      {analytics && (
        <div className="panel toolbar">
          <label>
            From{" "}
            <input
              type="date"
              aria-label="Report from"
              value={from}
              max={to}
              onChange={(e) => {
                if (e.target.value) setFrom(e.target.value);
              }}
            />
          </label>
          <label>
            To{" "}
            <input
              type="date"
              aria-label="Report to"
              value={to}
              min={from}
              onChange={(e) => {
                if (e.target.value) setTo(e.target.value);
              }}
            />
          </label>
          <span className="muted">Dates use your device time zone.</span>
        </div>
      )}
      <ErrorMessage error={exportReport.error} />
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {data && (
          <>
            {!analytics && (
              <section className="welcome-banner">
                <div>
                  <span className="eyebrow">
                    {canVisit
                      ? "PLAN. CONNECT. FOLLOW THROUGH."
                      : "YOUR WORKSPACE. YOUR NEXT STEPS."}
                  </span>
                  <h2>
                    {canVisit
                      ? "Make your next visit count."
                      : "Find your next action."}
                  </h2>
                  <p>
                    {canVisit
                      ? "Review your schedule and keep every conversation moving forward."
                      : "Open your workflow guide to find learning, review and administration tasks available to your role."}
                  </p>
                  {!canSchedule && (
                    <Link className="btn dark" to="/guide">
                      Open workflow guide <ArrowUpRight size={16} />
                    </Link>
                  )}
                  {canSchedule && (
                    <Link className="btn dark" to="/engagements">
                      <CalendarPlus size={16} />
                      Open visit planner
                      <ArrowUpRight size={16} />
                    </Link>
                  )}
                </div>
                <div className="banner-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orbit-center">
                    <Stethoscope size={43} />
                  </div>
                  <span className="orbit-dot dot-one" />
                  <span className="orbit-dot dot-two" />
                  <span className="orbit-chip">
                    <CheckCheck size={15} />{" "}
                    {canVisit
                      ? "Every visit, a clear next step."
                      : "Clear steps for your role."}
                  </span>
                </div>
              </section>
            )}
            <div className="metric-grid">
              {[
                {
                  label: "Healthcare professionals",
                  value: data.hcps?.total ?? "—",
                  hint: "In your authorised directory",
                  icon: Stethoscope,
                  tone: "teal",
                },
                {
                  label: "Completed visits",
                  value: canVisit ? data.counts.completed : "—",
                  hint: canVisit
                    ? `${data.counts.planned} planned in this period`
                    : "No visit access",
                  icon: CalendarCheck2,
                  tone: "blue",
                },
                {
                  label: "Scheduled visits",
                  value: canVisit ? data.counts.scheduled : "—",
                  hint: canVisit
                    ? "Within the selected period"
                    : "No visit access",
                  icon: Clock3,
                  tone: "violet",
                },
                {
                  label: "Overdue follow-ups",
                  value: data.tasks?.overdue ?? "—",
                  hint: data.tasks
                    ? `${data.tasks.open} open follow-ups`
                    : "No task access",
                  icon: CheckCheck,
                  tone: "amber",
                },
              ].map(({ icon: Icon, ...m }) => (
                <article className="metric-card" key={m.label}>
                  <div className="metric-top">
                    <span>{m.label}</span>
                    <span className={`metric-icon ${m.tone}`}>
                      <Icon size={19} />
                    </span>
                  </div>
                  <strong className="metric-value">{m.value}</strong>
                  <small>{m.hint}</small>
                </article>
              ))}
            </div>
            <div className="dashboard-grid">
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h2>Engagement activity</h2>
                    <p className="muted">
                      Planned and completed visits over time
                    </p>
                  </div>
                  <span className="chart-legend">
                    <i />
                    Completed <i className="pale" />
                    Planned
                  </span>
                </div>
                {data.trend.length ? (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.trend}
                        margin={{ top: 10, right: 15, bottom: 0, left: -25 }}
                      >
                        <defs>
                          <linearGradient
                            id="activity-fill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--accent-ink)"
                              stopOpacity={0.22}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--accent-ink)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          stroke="var(--line)"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "var(--muted)" }}
                          tickFormatter={(value) =>
                            new Date(value + "T12:00:00").toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )
                          }
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "var(--muted)" }}
                        />
                        <Tooltip
                          labelFormatter={(value) => String(value)}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid var(--line)",
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="planned"
                          name="Planned"
                          stroke="var(--chart-planned)"
                          strokeDasharray="4 4"
                          fill="transparent"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          name="Completed"
                          stroke="var(--accent-ink)"
                          fill="url(#activity-fill)"
                          strokeWidth={2.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Empty
                    title={
                      canVisit
                        ? "Your activity will take shape here"
                        : "Visit metrics are unavailable for your role"
                    }
                    description={
                      canVisit
                        ? "Metrics are calculated from your team's recorded visits."
                        : "Use the workflow guide for your permitted features."
                    }
                  />
                )}
              </section>
              <section className="panel completion-panel">
                <div className="section-heading">
                  <h2>Visit completion</h2>
                  <CalendarCheck2 size={18} />
                </div>
                <div
                  className="completion-ring"
                  style={{
                    background: `conic-gradient(var(--accent-ink) ${rate * 3.6}deg, var(--surface-muted) 0deg)`,
                  }}
                >
                  <div>
                    <strong>{canVisit ? `${rate}%` : "—"}</strong>
                    <span>visits completed</span>
                  </div>
                </div>
                <p>
                  <strong>{data.counts.completed}</strong> completed of{" "}
                  <strong>{data.counts.planned}</strong> planned
                </p>
                <div className="mini-stat">
                  <span>Learning reviewed</span>
                  <strong>
                    {data.training.completed} / {data.training.assigned}
                  </strong>
                </div>
                <div className="mini-stat">
                  <span>Assessments awaiting review</span>
                  <strong>{data.training.awaitingReview}</strong>
                </div>
                {data.content && (
                  <div className="mini-stat">
                    <span>Content awaiting review</span>
                    <strong>{data.content.pending}</strong>
                  </div>
                )}
              </section>
            </div>
            {analytics ? (
              <section className="panel">
                <div className="section-heading">
                  <h2>Representative activity</h2>
                  <span className="muted">Within your authorised scope</span>
                </div>
                {data.team.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Team member</th>
                          <th>Planned visits</th>
                          <th>Completed visits</th>
                          <th>Completion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.team.map((rep) => (
                          <tr key={rep.id}>
                            <td>
                              <span className="person-cell">
                                <span className="avatar teal">
                                  {initials(rep.name)}
                                </span>
                                <strong>{rep.name}</strong>
                              </span>
                            </td>
                            <td>{rep.planned}</td>
                            <td>{rep.completed}</td>
                            <td>
                              <div className="progress">
                                <span
                                  style={{
                                    width: `${rep.planned ? (rep.completed / rep.planned) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title="No activity in this period"
                    description="Choose another date range or start recording visits."
                  />
                )}
              </section>
            ) : (
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="section-heading">
                    <div>
                      <h2>Coming up next</h2>
                      <p className="muted">Your team's next seven days</p>
                    </div>
                    {canVisit && (
                      <Link className="text-button" to="/engagements">
                        View planner
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                  <ErrorMessage error={upcoming.error} />
                  {upcoming.data?.items.filter((v) =>
                    ["scheduled", "rescheduled"].includes(v.status),
                  ).length ? (
                    upcoming.data.items
                      .filter((v) =>
                        ["scheduled", "rescheduled"].includes(v.status),
                      )
                      .sort((a, b) =>
                        a.scheduledStart.localeCompare(b.scheduledStart),
                      )
                      .slice(0, 5)
                      .map((v) => (
                        <div className="activity-row" key={v.id}>
                          <div className="person-cell">
                            <span className="avatar teal">
                              {initials(v.hcpName)}
                            </span>
                            <div>
                              <strong>{v.hcpName}</strong>
                              <small>{v.subject}</small>
                              <small>{dateTime(v.scheduledStart)}</small>
                            </div>
                          </div>
                          <Status value={v.status} />
                        </div>
                      ))
                  ) : (
                    <Empty
                      title={
                        canVisit
                          ? "Time for your next connection"
                          : "Visit planning is unavailable for your role"
                      }
                      description={
                        canVisit
                          ? "Your scheduled visits will appear here."
                          : "See your workflow guide for available features."
                      }
                    />
                  )}
                </section>
                <section className="panel">
                  <div className="section-heading">
                    <h2>Next actions</h2>
                    {canTask && (
                      <Link className="text-button" to="/tasks">
                        All tasks
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                  <ErrorMessage error={tasks.error} />
                  {tasks.data?.items.length ? (
                    tasks.data.items.map((t) => (
                      <div className="activity-row" key={t.id}>
                        <div>
                          <strong>{t.title}</strong>
                          <small>{t.hcpName ?? "General follow-up"}</small>
                          <small>Due {dateTime(t.dueAt)}</small>
                        </div>
                        <span className={`priority priority-${t.priority}`}>
                          {t.priority === 1 ? "High" : "Normal"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <Empty
                      title={
                        canTask
                          ? "You're up to date"
                          : "Task access is unavailable for your role"
                      }
                      description={
                        canTask
                          ? "New follow-ups will appear here."
                          : "See your workflow guide for available features."
                      }
                    />
                  )}
                </section>
              </div>
            )}
            <div className="data-freshness">
              <span className="live-dot" />
              Calculated from authorised database records · Updated{" "}
              {dateTime(data.generatedAt)}
            </div>
          </>
        )}
      </QueryState>
    </>
  );
}
