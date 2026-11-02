import type { ReactNode } from "react";
import { ErrorMessage } from "./ErrorMessage";
import { Loading } from "./Loading";

export function QueryState({
  pending,
  error,
  retry,
  children,
}: {
  pending: boolean;
  error: unknown;
  retry?: () => void;
  children: ReactNode;
}) {
  if (pending) return <Loading />;
  if (error)
    return (
      <div className="panel">
        <ErrorMessage error={error} />
        {retry && (
          <button className="btn secondary" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    );
  return children;
}
