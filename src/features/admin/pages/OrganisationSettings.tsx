import type { OrganisationData } from "../types/organisation";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, ShieldCheck } from "lucide-react";
import { api } from "@/shared/api/client";
import { BrandLogo } from "@/features/branding/components/BrandLogo";
import { useAction } from "@/shared/hooks/useAction";
import { Dialog } from "@/shared/components/ui/Dialog";
import { Empty } from "@/shared/components/ui/Empty";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { QueryState } from "@/shared/components/ui/QueryState";
import { Submit } from "@/shared/components/ui/Submit";

interface Unit {
  id: string;
  name: string;
  code: string;
  unitType: string;
  parentId: string | null;
  isActive: boolean;
}
interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  permissions: string[];
}
export default function OrganisationSettings() {
  const [newUnit, setNewUnit] = useState(false),
    [role, setRole] = useState<Role | null | undefined>(undefined);
  const company = useQuery({
    queryKey: ["organisation"],
    queryFn: ({ signal }) => api<OrganisationData>("/organisation", { signal }),
  });
  const units = useQuery({
    queryKey: ["admin", "units"],
    queryFn: ({ signal }) =>
      api<Unit[]>("/admin/organisation-units", { signal }),
  });
  const roles = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: ({ signal }) => api<Role[]>("/admin/roles", { signal }),
  });
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE ADMINISTRATION"
        title="Organisation & roles"
        description="Company identity, team structure, and carefully scoped access."
      />
      <div className="two-columns">
        <section className="panel">
          <div className="section-heading">
            <h2>Organisation identity</h2>
            <Building2 size={19} />
          </div>
          <QueryState
            pending={company.isPending}
            error={company.error}
            retry={() => void company.refetch()}
          >
            {company.data && <BrandForm value={company.data} />}
          </QueryState>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Departments & teams</h2>
            <button className="text-button" onClick={() => setNewUnit(true)}>
              <Plus size={15} />
              Add unit
            </button>
          </div>
          <QueryState
            pending={units.isPending}
            error={units.error}
            retry={() => void units.refetch()}
          >
            {units.data?.length ? (
              units.data.map((unit) => (
                <div className="activity-row" key={unit.id}>
                  <div>
                    <strong>{unit.name}</strong>
                    <small>
                      {unit.code} · {unit.unitType}
                    </small>
                  </div>
                  <small>
                    {units.data.find((parent) => parent.id === unit.parentId)
                      ?.name ?? "Root unit"}
                  </small>
                </div>
              ))
            ) : (
              <Empty
                title="Give your teams a home"
                description="Create departments, teams, offices and company units, then assign users from People & access."
              />
            )}
          </QueryState>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Role permissions</h2>
            <p className="muted">
              System roles provide the baseline. Custom roles let you grant only
              the access a team needs.
            </p>
          </div>
          <button className="btn secondary" onClick={() => setRole(null)}>
            <Plus size={15} />
            Create role
          </button>
        </div>
        <QueryState
          pending={roles.isPending}
          error={roles.error}
          retry={() => void roles.refetch()}
        >
          <div className="training-grid">
            {roles.data?.map((r) => (
              <article className="training-card" key={r.id}>
                <div className="section-heading">
                  <h3>{r.name.replaceAll("_", " ")}</h3>
                  <ShieldCheck size={17} />
                </div>
                <p>
                  {r.description ??
                    (r.isSystemRole
                      ? "Protected system role"
                      : "Custom organisation role")}
                </p>
                <details>
                  <summary className="text-button">
                    View {r.permissions.length} permissions
                  </summary>
                  <ul className="permission-list">
                    {r.permissions.map((permission) => (
                      <li key={permission}>
                        {permission.replaceAll(".", " · ").replaceAll("_", " ")}
                      </li>
                    ))}
                  </ul>
                </details>
                {!r.isSystemRole && (
                  <button
                    className="btn small secondary"
                    onClick={() => setRole(r)}
                  >
                    Edit permissions
                  </button>
                )}
              </article>
            ))}
          </div>
        </QueryState>
      </section>
      {newUnit && (
        <UnitForm units={units.data ?? []} onClose={() => setNewUnit(false)} />
      )}
      {role !== undefined && (
        <RoleForm role={role} onClose={() => setRole(undefined)} />
      )}
    </>
  );
}
function BrandForm({ value }: { value: OrganisationData }) {
  const [companyName, setCompany] = useState(value.branding?.companyName ?? ""),
    [logoUrl, setLogoUrl] = useState(value.branding?.logoUrl ?? ""),
    [productName, setProduct] = useState(
      value.branding?.productName ?? "Pharma VRM",
    ),
    [primaryColor, setColor] = useState(
      value.branding?.primaryColor ?? "#117b67",
    ),
    [supportEmail, setEmail] = useState(value.branding?.supportEmail ?? ""),
    [timeZone, setZone] = useState(
      value.settings?.timeZone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
    [locale, setLocale] = useState(value.settings?.locale ?? "en-IN");
  const save = useAction(
    "/organisation",
    [["organisation"], ["branding"], ["audit"]],
    "PUT",
    "Organisation settings saved.",
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate({
      companyName,
      productName,
      logoUrl: logoUrl.trim() || null,
      primaryColor,
      supportEmail: supportEmail || null,
      timeZone,
      locale,
    });
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="brand brand-preview" aria-label="Brand preview">
        <BrandLogo url={logoUrl.trim()} companyName={companyName} />
        <div>
          {productName || "Pharma VRM"}
          <span>{companyName || "Your company"}</span>
        </div>
      </div>
      <Field label="Company name">
        <input
          required
          maxLength={180}
          value={companyName}
          onChange={(e) => setCompany(e.target.value)}
        />
      </Field>
      <Field label="Product name">
        <input
          required
          maxLength={120}
          value={productName}
          onChange={(e) => setProduct(e.target.value)}
        />
      </Field>
      <Field
        label="Company logo URL (optional)"
        hint="Use an HTTPS image URL or a path such as /company-logo.png. Clear this field to use the default logo."
      >
        <input
          type="text"
          maxLength={2048}
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://your-company.com/logo.png"
        />
      </Field>
      <div className="form-grid">
        <Field label="Primary colour">
          <input
            type="color"
            required
            value={primaryColor}
            onChange={(e) => setColor(e.target.value)}
          />
        </Field>
        <Field label="Support email (optional)">
          <input
            type="email"
            maxLength={254}
            value={supportEmail}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Organisation time zone">
          <input
            required
            maxLength={80}
            value={timeZone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="Asia/Kolkata"
          />
        </Field>
        <Field label="Locale">
          <input
            required
            maxLength={35}
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            placeholder="en-IN"
          />
        </Field>
      </div>
      <ErrorMessage error={save.error} />
      <Submit pending={save.isPending}>Save organisation</Submit>
    </form>
  );
}
function UnitForm({ units, onClose }: { units: Unit[]; onClose: () => void }) {
  const [name, setName] = useState(""),
    [code, setCode] = useState(""),
    [unitType, setType] = useState("team"),
    [parentId, setParent] = useState("");
  const save = useAction(
    "/admin/organisation-units",
    [["admin", "units"], ["audit"]],
    "POST",
    "Organisation unit created.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        name,
        code,
        unitType,
        parentId: parentId || null,
      });
      onClose();
    } catch {
      /* show error */
    }
  }
  return (
    <Dialog
      title="Add organisation unit"
      description="Build a company, department, office or team hierarchy."
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <Field label="Name">
          <input
            required
            maxLength={160}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Unique code">
          <input
            required
            maxLength={80}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>
        <Field label="Unit type">
          <select value={unitType} onChange={(e) => setType(e.target.value)}>
            {["company", "department", "office", "team"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Parent unit">
          <select value={parentId} onChange={(e) => setParent(e.target.value)}>
            <option value="">Root unit</option>
            {units
              .filter((u) => u.isActive)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </Field>
        <ErrorMessage error={save.error} />
        <Submit pending={save.isPending}>Create unit</Submit>
      </form>
    </Dialog>
  );
}
function RoleForm({
  role,
  onClose,
}: {
  role: Role | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []),
    [reason, setReason] = useState("");
  const options = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: ({ signal }) =>
      api<{ key: string }[]>("/admin/permissions", { signal }),
  });
  const save = useAction(
    role ? `/admin/roles/${role.id}/permissions` : "/admin/roles",
    [["admin", "roles"], ["audit"]],
    role ? "PUT" : "POST",
    role
      ? "Permissions updated and affected sessions revoked."
      : "Custom role created.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync(
        role
          ? { permissions, reason }
          : { name, description: description || null, permissions },
      );
      onClose();
    } catch {
      /* show error */
    }
  }
  return (
    <Dialog
      title={role ? "Edit role permissions" : "Create a custom role"}
      description={
        role
          ? role.name
          : "Choose the least access required for the responsibility."
      }
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        {!role && (
          <>
            <Field
              label="Role key"
              hint="Lowercase letters, numbers and underscores; 3–80 characters."
            >
              <input
                required
                minLength={3}
                maxLength={80}
                pattern="[a-z][a-z0-9_]{2,79}"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Responsibility / description">
              <textarea
                maxLength={2000}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </>
        )}
        <fieldset>
          <legend>Permissions</legend>
          {options.data?.map((p) => (
            <label className="check-field" key={p.key}>
              <input
                type="checkbox"
                checked={permissions.includes(p.key)}
                onChange={(e) =>
                  setPermissions((prev) =>
                    e.target.checked
                      ? [...prev, p.key]
                      : prev.filter((key) => key !== p.key),
                  )
                }
              />
              {p.key.replaceAll(".", " · ").replaceAll("_", " ")}
            </label>
          ))}
        </fieldset>
        {role && (
          <Field label="Reason for access change">
            <textarea
              required
              maxLength={2000}
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        )}
        <ErrorMessage error={save.error || options.error} />
        <Submit pending={save.isPending}>
          {role ? "Update permissions" : "Create role"}
        </Submit>
      </form>
    </Dialog>
  );
}
