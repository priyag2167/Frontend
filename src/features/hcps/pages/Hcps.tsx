import { UserSelect } from "@/shared/components/UserSelect";
import { useState, type FormEvent } from "react";
import { HcpChatAccess } from "../components/HcpChatAccess";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Download,
  UploadCloud,
  GitMerge,
  ArrowUpRight,
  Building2,
  CalendarPlus,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { api, params, download } from "@/shared/api/client";
import { useAction } from "@/shared/hooks/useAction";
import { useCan, useSession } from "@/features/auth/hooks/useSession";
import { useDebounced } from "@/shared/hooks/useDebounced";
import { useUiStore } from "@/shared/stores/uiStore";
import type {
  Engagement,
  FollowUp,
  Hcp,
  Lookup,
  Page,
} from "@/shared/types/contracts";
import { Dialog } from "@/shared/components/ui/Dialog";
import { Empty } from "@/shared/components/ui/Empty";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Pagination } from "@/shared/components/ui/Pagination";
import { QueryState } from "@/shared/components/ui/QueryState";
import { ReasonDialog } from "@/shared/components/ui/ReasonDialog";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { Status } from "@/shared/components/ui/Status";
import { Submit } from "@/shared/components/ui/Submit";
import { dateTime, initials } from "@/shared/utils/format";

import { CsvImportDialog } from "@/shared/components/CsvImportDialog";
import { MergeDialog } from "@/features/hcps/components/MergeDialog";

export default function Hcps() {
  const [importing, setImporting] = useState(false),
    [merging, setMerging] = useState<Hcp | null>(null);
  const canExport = useCan("hcp.export"),
    canMerge = useCan("hcp.merge");
  const exportHcps = useMutation({
    mutationFn: () => download("/hcps/export", "healthcare-professionals.csv"),
  });
  const [page, setPage] = useState(1),
    [territory, setTerritory] = useState("");
  const search = useUiStore((s) => s.search),
    setSearch = useUiStore((s) => s.setSearch);
  const term = useDebounced(search);
  const [editing, setEditing] = useState<Hcp | null | undefined>(undefined),
    [selected, setSelected] = useState<string | null>(null),
    [archiving, setArchiving] = useState<Hcp | null>(null);
  const canWrite = useCan("hcp.write");
  const query = useQuery({
    queryKey: ["hcps", "list", term, territory, page],
    queryFn: ({ signal }) =>
      api<Page<Hcp>>(
        "/hcps" + params({ search: term, territoryId: territory, page }),
        { signal },
      ),
    placeholderData: keepPreviousData,
  });
  const territories = useQuery({
    queryKey: ["lookups", "territories"],
    queryFn: ({ signal }) => api<Lookup[]>("/lookups/territories", { signal }),
  });
  const archive = useAction(
    `/hcps/${archiving?.id}`,
    [["hcps"], ["lookups", "users"], ["dashboard"]],
    "DELETE",
    "HCP archived.",
  );
  return (
    <>
      <PageHeader
        eyebrow="RELATIONSHIPS"
        title="HCP directory"
        description="A clear view of your healthcare professional relationships."
        actions={
          <>
            {canExport && (
              <button
                className="btn secondary"
                disabled={exportHcps.isPending}
                onClick={() => exportHcps.mutate()}
              >
                <Download size={16} />
                Export CSV
              </button>
            )}
            {canWrite && (
              <>
                <button
                  className="btn secondary"
                  onClick={() => setImporting(true)}
                >
                  <UploadCloud size={16} />
                  Import CSV
                </button>
                <button
                  className="btn primary"
                  onClick={() => setEditing(null)}
                >
                  <Plus size={17} />
                  Add healthcare professional
                </button>
              </>
            )}
          </>
        }
      />
      <ErrorMessage error={exportHcps.error} />
      <div className="panel directory-panel">
        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by name, specialty or institution…"
          />
          <select
            aria-label="Filter by territory"
            value={territory}
            onChange={(e) => {
              setTerritory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All territories</option>
            {territories.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <span className="result-count">
            {query.data?.total ?? 0} professionals
          </span>
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
                    <th>Institution</th>
                    <th>Representative</th>
                    <th>Contact permission</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((h) => (
                    <tr key={h.id}>
                      <td>
                        <button
                          className="person-cell"
                          onClick={() => setSelected(h.id)}
                        >
                          <span className="avatar teal">
                            {initials(h.fullName)}
                          </span>
                          <span>
                            <strong>{h.fullName}</strong>
                            <small>{h.specialty}</small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <strong>{h.institutionName}</strong>
                        <small>
                          {h.territoryName ?? "No territory assigned"}
                        </small>
                      </td>
                      <td>{h.assignedRepName}</td>
                      <td>
                        <Status
                          value={h.contactAllowed ? "permitted" : "restricted"}
                        />
                      </td>
                      <td>
                        <div className="row-actions">
                          {canMerge && (
                            <button
                              className="icon-button"
                              aria-label={`Merge ${h.fullName}`}
                              onClick={() => setMerging(h)}
                            >
                              <GitMerge size={16} />
                            </button>
                          )}
                          <button
                            className="icon-button"
                            aria-label={`View ${h.fullName}`}
                            onClick={() => setSelected(h.id)}
                          >
                            <ArrowUpRight size={17} />
                          </button>
                          {canWrite && (
                            <>
                              <button
                                className="icon-button"
                                aria-label={`Edit ${h.fullName}`}
                                onClick={() => setEditing(h)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="icon-button"
                                aria-label={`Archive ${h.fullName}`}
                                onClick={() => setArchiving(h)}
                              >
                                <Trash2 size={16} />
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
              title={
                term
                  ? "No matching professionals"
                  : "Your relationships start here"
              }
              description={
                term
                  ? "Try another name, institution or specialty."
                  : "Add an HCP, record communication permission, and plan your first visit."
              }
              action={
                canWrite ? (
                  <button
                    className="btn primary"
                    onClick={() => setEditing(null)}
                  >
                    <Plus size={16} />
                    Add first HCP
                  </button>
                ) : undefined
              }
            />
          )}
          <Pagination
            data={query.data}
            onPage={setPage}
            busy={query.isFetching}
          />
        </QueryState>
      </div>
      {importing && (
        <CsvImportDialog
          title="Import healthcare professionals"
          path="/hcps/imports"
          headers={[
            "fullName",
            "specialty",
            "institutionName",
            "email",
            "phone",
            "professionalRegistrationId",
            "assignedRepEmail",
            "territoryCode",
            "contactAllowed",
            "communicationPreferences",
          ]}
          limit={500}
          invalidate={[["hcps"], ["dashboard"], ["audit"]]}
          onClose={() => setImporting(false)}
        />
      )}
      {merging && (
        <MergeDialog source={merging} onClose={() => setMerging(null)} />
      )}
      {editing !== undefined && (
        <HcpForm hcp={editing} onClose={() => setEditing(undefined)} />
      )}
      {selected && <Profile id={selected} onClose={() => setSelected(null)} />}
      {archiving && (
        <ReasonDialog
          title={`Archive ${archiving.fullName}?`}
          description="The profile will leave the active directory. Past visits and audit history are retained."
          onClose={() => setArchiving(null)}
          pending={archive.isPending}
          error={archive.error}
          confirm={(reason) => archive.mutateAsync({ reason })}
        />
      )}
    </>
  );
}

function HcpForm({ hcp, onClose }: { hcp: Hcp | null; onClose: () => void }) {
  const user = useSession().data!.user;
  const [form, setForm] = useState({
    fullName: hcp?.fullName ?? "",
    specialty: hcp?.specialty ?? "",
    institutionName: hcp?.institutionName ?? "",
    email: hcp?.email ?? "",
    phone: hcp?.phone ?? "",
    addressLine1: hcp?.addressLine1 ?? "",
    professionalRegistrationId: hcp?.professionalRegistrationId ?? "",
    assignedRepId: hcp?.assignedRepId ?? user.id,
    territoryId: hcp?.territoryId ?? "",
    contactAllowed: hcp?.contactAllowed ?? false,
    communicationPreferences:
      hcp?.consentMetadata?.communicationPreferences ?? "",
    version: hcp?.version ?? 1,
  });
  const territories = useQuery({
    queryKey: ["lookups", "territories", form.assignedRepId],
    queryFn: ({ signal }) =>
      api<Lookup[]>(
        "/lookups/territories" + params({ ownerUserId: form.assignedRepId }),
        { signal },
      ),
  });
  const save = useAction(
    hcp ? `/hcps/${hcp.id}` : "/hcps",
    [["hcps"], ["lookups", "users"], ["dashboard"]],
    hcp ? "PUT" : "POST",
    hcp ? "HCP details updated." : "Healthcare professional added.",
  );
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await save.mutateAsync({
        ...form,
        email: form.email || null,
        phone: form.phone || null,
        professionalRegistrationId: form.professionalRegistrationId || null,
        territoryId: form.territoryId || null,
      });
      onClose();
    } catch {
      /* keep input for correction */
    }
  }
  return (
    <Dialog
      title={
        hcp ? "Edit healthcare professional" : "Add healthcare professional"
      }
      description="Collect professional details needed for authorised engagement."
      onClose={onClose}
      wide
    >
      <form className="form-stack" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Full name">
            <input
              required
              maxLength={180}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Dr. Full name"
            />
          </Field>
          <Field label="Medical specialty">
            <input
              required
              maxLength={160}
              value={form.specialty}
              onChange={(e) => set("specialty", e.target.value)}
              placeholder="e.g. Cardiology"
            />
          </Field>
          <Field label="Hospital / institution">
            <input
              required
              maxLength={220}
              value={form.institutionName}
              onChange={(e) => set("institutionName", e.target.value)}
            />
          </Field>
          <Field label="Registration identifier (optional)">
            <input
              maxLength={120}
              value={form.professionalRegistrationId}
              onChange={(e) =>
                set("professionalRegistrationId", e.target.value)
              }
            />
          </Field>
          <Field label="Professional email (optional)">
            <input
              type="email"
              maxLength={254}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Professional phone (optional)">
            <input
              type="tel"
              maxLength={40}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <UserSelect
            label="Assigned representative"
            purpose="hcp-owner"
            value={form.assignedRepId}
            onChange={(id) =>
              setForm((prev) => ({
                ...prev,
                assignedRepId: id,
                territoryId: "",
              }))
            }
          />
          <Field
            label="Territory"
            hint="Territories are filtered to the selected representative. Changing the representative clears this selection."
          >
            <select
              value={form.territoryId}
              onChange={(e) => set("territoryId", e.target.value)}
            >
              <option value="">No territory</option>
              {territories.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Professional address (optional)">
          <input
            maxLength={220}
            value={form.addressLine1}
            onChange={(e) => set("addressLine1", e.target.value)}
          />
        </Field>
        <div className="notice">
          <ShieldCheck size={19} />
          <div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={form.contactAllowed}
                onChange={(e) => set("contactAllowed", e.target.checked)}
              />
              <strong>Professional contact is permitted</strong>
            </label>
            <small>
              Confirm permission under your organisation's approved consent
              policy before scheduling an interaction.
            </small>
          </div>
        </div>
        <Field label="Communication preferences / restrictions">
          <textarea
            rows={2}
            maxLength={1000}
            placeholder="Approved channels, preferred hours, or communication restrictions"
            value={form.communicationPreferences}
            onChange={(e) => set("communicationPreferences", e.target.value)}
          />
        </Field>
        <ErrorMessage error={save.error || territories.error} />
        <div className="form-actions">
          <button
            type="button"
            className="btn secondary"
            disabled={save.isPending}
            onClick={onClose}
          >
            Cancel
          </button>
          <Submit pending={save.isPending}>
            {hcp ? "Save profile" : "Create profile"}
          </Submit>
        </div>
      </form>
    </Dialog>
  );
}
function Profile({ id, onClose }: { id: string; onClose: () => void }) {
  const canVisit = useCan("engagement.read"),
    canTask = useCan("task.read"),
    canSchedule = useCan("engagement.write");
  const profile = useQuery({
    queryKey: ["hcps", id],
    queryFn: ({ signal }) => api<Hcp>(`/hcps/${id}`, { signal }),
  });
  const visits = useQuery({
    queryKey: ["engagements", "hcp", id],
    queryFn: ({ signal }) =>
      api<Page<Engagement>>(`/engagements?hcpId=${id}&pageSize=10`, { signal }),
    enabled: canVisit,
  });
  const tasks = useQuery({
    queryKey: ["tasks", "hcp", id],
    queryFn: ({ signal }) =>
      api<Page<FollowUp>>(`/follow-up-tasks?hcpId=${id}&pageSize=10`, {
        signal,
      }),
    enabled: canTask,
  });
  const h = profile.data;
  return (
    <Dialog
      title="Professional profile"
      description="Professional context and your team's recent engagement."
      onClose={onClose}
      wide
    >
      <QueryState
        pending={profile.isPending}
        error={profile.error}
        retry={() => void profile.refetch()}
      >
        {h && (
          <>
            <div className="profile-hero">
              <span className="avatar large teal">{initials(h.fullName)}</span>
              <div>
                <h2>{h.fullName}</h2>
                <p>
                  {h.specialty} · {h.institutionName}
                </p>
                <Status value={h.contactAllowed ? "permitted" : "restricted"} />
              </div>
            </div>
            <div className="contact-grid">
              <span>
                <Building2 size={16} />
                {h.institutionName}
              </span>
              <span>
                <Stethoscope size={16} />
                {h.assignedRepName}
              </span>
              <span>
                <Mail size={16} />
                {h.email || "No email recorded"}
              </span>
              <span>
                <Phone size={16} />
                {h.phone || "No phone recorded"}
              </span>
              <span>
                <MapPin size={16} />
                {h.addressLine1 || "No address recorded"}
              </span>
            </div>
            {h.consentMetadata?.communicationPreferences && (
              <div className="notice">
                <ShieldCheck size={17} />
                <p>{h.consentMetadata.communicationPreferences}</p>
              </div>
            )}
            {canSchedule && (
              <Link
                className="btn primary"
                to={`/engagements?hcp=${id}`}
                onClick={onClose}
              >
                <CalendarPlus size={16} />
                Schedule a visit
              </Link>
            )}
            <HcpChatAccess hcp={h} onClose={onClose} />
            {canVisit && (
              <>
                <h3 className="subheading">Recent & upcoming visits</h3>
                <ErrorMessage error={visits.error} />
                {visits.data?.items.length ? (
                  visits.data.items.map((v) => (
                    <div className="activity-row" key={v.id}>
                      <div>
                        <strong>{v.subject}</strong>
                        <small>
                          {dateTime(v.scheduledStart)} · {v.ownerName}
                        </small>
                      </div>
                      <Status value={v.status} />
                    </div>
                  ))
                ) : (
                  <p className="muted">No visits recorded.</p>
                )}
              </>
            )}
            {canTask && (
              <>
                <h3 className="subheading">Follow-up tasks</h3>
                <ErrorMessage error={tasks.error} />
                {tasks.data?.items.map((t) => (
                  <div className="activity-row" key={t.id}>
                    <div>
                      <strong>{t.title}</strong>
                      <small>Due {dateTime(t.dueAt)}</small>
                    </div>
                    <Status value={t.status} />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </QueryState>
    </Dialog>
  );
}
