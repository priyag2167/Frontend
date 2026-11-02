import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "@/features/auth/hooks/useSession";
import { workflows } from "@/shared/workflows";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  const { pathname } = useLocation();
  const permissions = useSession().data?.permissions ?? [];
  const workflow = workflows.find(
    (flow) => flow.path === pathname && permissions.includes(flow.permission),
  );
  return (
    <>
      <header className="page-heading">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions && <div className="heading-actions">{actions}</div>}
      </header>
      {workflow && (
        <details className="workflow-help">
          <summary>How to use this page</summary>
          <ol>
            {workflow.steps
              .filter(
                (step) =>
                  !step.permission || permissions.includes(step.permission),
              )
              .map((step) => (
                <li key={step.text}>{step.text}</li>
              ))}
          </ol>
          <Link className="text-button" to="/guide">
            View your complete workflow guide
          </Link>
        </details>
      )}
    </>
  );
}
