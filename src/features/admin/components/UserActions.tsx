import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useSession } from "@/features/auth/hooks/useSession";
import { useAction } from "@/shared/hooks/useAction";
import type { AdminUser } from "@/shared/types/contracts";
import { ReasonDialog } from "@/shared/components/ui/ReasonDialog";
import { UserAccessForm } from "./UserAccessForm";
import { UserProfileForm } from "./UserProfileForm";

export function UserActions({
  account,
  canManage = true,
}: {
  account: AdminUser;
  canManage?: boolean;
}) {
  const [dialog, setDialog] = useState<
    "profile" | "access" | "status" | "revoke" | null
  >(null);
  const session = useSession();
  const nextStatus = account.status === "active" ? "deactivated" : "active";
  const status = useAction(
    `/admin/users/${account.id}/status`,
    [["admin"], ["lookups"], ["audit"]],
    "PUT",
    nextStatus === "active"
      ? "User reactivated."
      : "User deactivated and sessions revoked.",
  );
  const revoke = useAction(
    `/admin/users/${account.id}/revoke-sessions`,
    [["admin"], ["audit"]],
    "POST",
    "User sessions revoked.",
  );
  if (account.id === session.data?.user.id)
    return <span className="muted">Your account</span>;
  if (!canManage)
    return <span className="muted">Outside your administrative access</span>;
  const close = () => setDialog(null);
  return (
    <>
      <div className="row-actions user-actions">
        <button
          className="btn small secondary"
          onClick={() => setDialog("profile")}
        >
          Edit user
        </button>
        <button
          className="btn small secondary"
          onClick={() => setDialog("access")}
        >
          Manage access
        </button>
        <button
          className={`btn small secondary ${nextStatus === "deactivated" ? "danger" : ""}`}
          onClick={() => {
            status.reset();
            setDialog("status");
          }}
        >
          {nextStatus === "active" ? "Reactivate" : "Deactivate"}
        </button>
        <button
          className="icon-button"
          title="Revoke active sessions"
          aria-label={`Revoke sessions for ${account.displayName}`}
          onClick={() => {
            revoke.reset();
            setDialog("revoke");
          }}
        >
          <KeyRound size={16} />
        </button>
      </div>
      {dialog === "profile" && (
        <UserProfileForm id={account.id} onClose={close} />
      )}
      {dialog === "access" && (
        <UserAccessForm account={account} onClose={close} />
      )}
      {dialog === "status" && (
        <ReasonDialog
          title={
            nextStatus === "active" ? "Reactivate user" : "Deactivate user"
          }
          description={
            nextStatus === "active"
              ? `${account.displayName} can sign in again with their existing roles and password.`
              : `${account.displayName} will be signed out and unable to sign in. Their records and role assignments are preserved.`
          }
          onClose={close}
          pending={status.isPending}
          error={status.error}
          confirm={(reason) =>
            status.mutateAsync({ status: nextStatus, reason })
          }
        />
      )}
      {dialog === "revoke" && (
        <ReasonDialog
          title="Revoke active sessions"
          description={`${account.displayName} will need to sign in again.`}
          onClose={close}
          pending={revoke.isPending}
          error={revoke.error}
          confirm={(reason) => revoke.mutateAsync({ reason })}
        />
      )}
    </>
  );
}
