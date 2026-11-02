import { Link } from "react-router-dom";
import { useSession } from "@/features/auth/hooks/useSession";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { scopeDescription, workflows } from "@/shared/workflows";

export default function Guide() {
  const session = useSession().data!;
  const visible = workflows.filter((flow) =>
    session.permissions.includes(flow.permission),
  );
  return (
    <>
      <PageHeader
        eyebrow="GETTING STARTED"
        title="Your workflow guide"
        description="Follow the steps for the features available to your account."
      />
      <section className="panel workflow-intro">
        <h2>{session.user.displayName}</h2>
        <p>
          <strong>Your roles:</strong>{" "}
          {session.roles.map((role) => role.replaceAll("_", " ")).join(", ") ||
            "No role assigned"}
        </p>
        <p>{scopeDescription(session.permissions)}</p>
        <p>
          Start with a feature below. Each page also has a “How to use this
          page” guide. Dropdowns show active people who have the permissions and
          record access needed for that action.
        </p>
        {!visible.length && (
          <p>
            No work modules are assigned yet. Contact your administrator to
            request access.
          </p>
        )}
      </section>
      <div className="workflow-grid">
        {visible.map((flow) => (
          <section className="panel workflow-card" key={flow.path}>
            <h2>{flow.title}</h2>
            <ol>
              {flow.steps
                .filter(
                  (step) =>
                    !step.permission ||
                    session.permissions.includes(step.permission),
                )
                .map((step) => (
                  <li key={step.text}>{step.text}</li>
                ))}
            </ol>
            <Link className="btn secondary" to={flow.path}>
              Open {flow.title.toLowerCase()}
            </Link>
          </section>
        ))}
        <section className="panel workflow-card">
          <h2>Account and troubleshooting</h2>
          <ol>
            <li>
              Use My settings to change your password, time zone, locale and
              reminder preference.
            </li>
            <li>
              If a dropdown is empty, select its related HCP or course first.
              Ask an administrator to check the person's status, permissions and
              reporting manager.
            </li>
            <li>
              A conflict means the record changed or the action is no longer
              available. Refresh and review the current status before retrying.
            </li>
            <li>
              If your session ends after an access change, sign in again.
              Deactivated accounts need an administrator to reactivate them.
            </li>
          </ol>
          <Link className="btn secondary" to="/settings">
            Open my settings
          </Link>
        </section>
      </div>
    </>
  );
}
