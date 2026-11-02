import { useQuery } from "@tanstack/react-query";
import { api, params } from "@/shared/api/client";
import { Field } from "./ui/Field";
import { ErrorMessage } from "./ui/ErrorMessage";

export type UserPurpose =
  | "hcp-owner"
  | "visit-owner"
  | "task-assignee"
  | "training-learner"
  | "reporting-manager"
  | "territory-owner";
type UserOption = { id: string; displayName: string; roles: string[] };
const explanations: Record<UserPurpose, string> = {
  "hcp-owner":
    "Active staff who can access healthcare contacts and conduct visits, within your scope.",
  "visit-owner": "Staff who can conduct visits and access the selected HCP.",
  "task-assignee":
    "Staff who can view and complete tasks. Linked HCPs must also be in their scope.",
  "training-learner":
    "Learners in your scope who can access training. Existing active assignments are excluded for this course.",
  "reporting-manager":
    "Active administrators and managers with team or organisation access. The user and their reporting descendants are excluded.",
  "territory-owner":
    "Active field staff who can access healthcare contacts and conduct visits.",
};

export function UserSelect({
  purpose,
  value,
  onChange,
  label,
  optional = false,
  hcpId,
  excludeUserId,
  courseVersionId,
  waitForContext = false,
}: {
  purpose: UserPurpose;
  value: string;
  onChange: (id: string) => void;
  label: string;
  optional?: boolean;
  hcpId?: string;
  excludeUserId?: string;
  courseVersionId?: string;
  waitForContext?: boolean;
}) {
  const users = useQuery({
    queryKey: [
      "lookups",
      "users",
      purpose,
      hcpId,
      excludeUserId,
      courseVersionId,
    ],
    queryFn: ({ signal }) =>
      api<UserOption[]>(
        "/lookups/users" +
          params({ purpose, hcpId, excludeUserId, courseVersionId }),
        { signal },
      ),
    enabled: !waitForContext,
  });
  const valid = users.data?.some((user) => user.id === value) ?? false;
  const unavailable = !!value && !!users.data && !valid;
  return (
    <Field label={label} hint={explanations[purpose]}>
      <select
        value={valid ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        required={!optional || unavailable}
        aria-busy={users.isFetching}
      >
        <option value="">
          {waitForContext
            ? "Choose the related record first"
            : users.isPending
              ? "Loading eligible users…"
              : optional
                ? "No manager"
                : `Choose ${label.toLowerCase()}`}
        </option>
        {users.data?.map((user) => (
          <option key={user.id} value={user.id}>
            {user.displayName} ·{" "}
            {user.roles.map((role) => role.replaceAll("_", " ")).join(", ")}
          </option>
        ))}
      </select>
      {unavailable && (
        <small role="status">
          The previous selection is no longer eligible. Choose another user
          {optional ? " or No manager" : ""}.
        </small>
      )}
      {unavailable && optional && (
        <button
          type="button"
          className="text-button"
          onClick={() => onChange("")}
        >
          Clear previous manager
        </button>
      )}
      {!waitForContext && users.data?.length === 0 && (
        <small role="status">
          No eligible users. Check the user's active status, permissions and
          reporting scope
          {courseVersionId ? ", or choose a different course" : ""}.
        </small>
      )}
      <ErrorMessage error={users.error} />
      {users.error && (
        <button
          className="text-button"
          type="button"
          onClick={() => void users.refetch()}
        >
          Retry loading users
        </button>
      )}
    </Field>
  );
}
