import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useAction } from "@/shared/hooks/useAction";
import { useSession } from "@/features/auth/hooks/useSession";
import { api, resetCsrf } from "@/shared/api/client";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { QueryState } from "@/shared/components/ui/QueryState";
import { Submit } from "@/shared/components/ui/Submit";
import { useUiStore } from "@/shared/stores/uiStore";

export default function Settings() {
  const session = useSession().data!;
  const client = useQueryClient();
  const navigate = useNavigate();
  const [currentPassword, setCurrent] = useState(""),
    [newPassword, setNew] = useState(""),
    [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const change = useAction("/auth/password", [], "PUT", "");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    change.reset();
    if (newPassword.length < 12 || newPassword.length > 256) {
      setError("Your new password must be between 12 and 256 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    try {
      await change.mutateAsync({ currentPassword, newPassword });
      resetCsrf();
      await client.cancelQueries();
      useUiStore.getState().reset();
      useUiStore
        .getState()
        .setSignInNotice(
          "Password updated. Sign in with your new password. All previous sessions have ended.",
        );
      client.setQueryData(["auth", "me"], null);
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      navigate("/login", { replace: true });
    } catch {
      /* shown below */
    }
  }
  return (
    <>
      <PageHeader
        title="My settings"
        description="Your identity, access, and account security."
      />
      <div className="two-columns">
        <section className="panel">
          <div className="section-heading">
            <h2>Account details</h2>
            <ShieldCheck size={20} />
          </div>
          <dl className="details-list">
            <dt>Name</dt>
            <dd>{session.user.displayName}</dd>
            <dt>Email</dt>
            <dd>{session.user.email}</dd>
            <dt>Time zone</dt>
            <dd>{session.user.timeZone}</dd>
            <dt>Roles</dt>
            <dd>
              {session.roles.map((r) => r.replaceAll("_", " ")).join(", ")}
            </dd>
            <dt>Device time zone</dt>
            <dd>{Intl.DateTimeFormat().resolvedOptions().timeZone} (device)</dd>
          </dl>
          <p className="muted">
            Your administrator manages role and reporting assignments.
          </p>
          {session.permissions.includes("admin.manage") && (
            <Link className="text-button" to="/organisation">
              Manage company name & logo
            </Link>
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Change password</h2>
            <LockKeyhole size={20} />
          </div>
          <p className="muted">
            Changing your password ends all active sessions. Sign in again with
            your new password.
          </p>
          <form className="form-stack" onSubmit={submit}>
            <Field label="Current password">
              <input
                type="password"
                required
                maxLength={256}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </Field>
            <Field
              label="New password"
              hint="Use between 12 and 256 characters."
            >
              <input
                type="password"
                required
                minLength={12}
                maxLength={256}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNew(e.target.value)}
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                required
                minLength={12}
                maxLength={256}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            <ErrorMessage
              error={change.error || (error ? new Error(error) : null)}
            />
            <Submit pending={change.isPending}>Update password</Submit>
          </form>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Display & reminder preferences</h2>
        </div>
        <Preferences />
      </section>
    </>
  );
}

interface PreferencesData {
  timeZone: string;
  locale: string;
  remindersEnabled: boolean;
}
function Preferences() {
  const query = useQuery({
    queryKey: ["preferences"],
    queryFn: ({ signal }) =>
      api<PreferencesData>("/auth/preferences", { signal }),
  });
  return (
    <QueryState
      pending={query.isPending}
      error={query.error}
      retry={() => void query.refetch()}
    >
      {query.data && <PreferencesForm value={query.data} />}
    </QueryState>
  );
}
function PreferencesForm({ value }: { value: PreferencesData }) {
  const [timeZone, setZone] = useState(value.timeZone),
    [locale, setLocale] = useState(value.locale),
    [remindersEnabled, setReminders] = useState(value.remindersEnabled);
  const save = useAction(
    "/auth/preferences",
    [["preferences"], ["auth", "me"], ["audit"]],
    "PUT",
    "Your preferences were saved.",
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate({ timeZone, locale, remindersEnabled });
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid">
        <Field
          label="Display time zone"
          hint="Use an IANA identifier, for example Asia/Kolkata."
        >
          <input
            required
            maxLength={80}
            value={timeZone}
            onChange={(e) => setZone(e.target.value)}
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
      <label className="check-field">
        <input
          type="checkbox"
          checked={remindersEnabled}
          onChange={(e) => setReminders(e.target.checked)}
        />
        Show appointment, overdue-task, course and document-expiry reminders
      </label>
      <p className="muted">
        Assignment and review notices remain available in your inbox.
        Appointment input fields use the device time zone shown in the visit
        form.
      </p>
      <ErrorMessage error={save.error} />
      <Submit pending={save.isPending}>Save preferences</Submit>
    </form>
  );
}
