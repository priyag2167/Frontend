import type { ReactNode } from "react";
import { useCan } from "@/features/auth/hooks/useSession";
import { Empty } from "@/shared/components/ui/Empty";

export function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const allowed = useCan(permission);
  return allowed ? (
    children
  ) : (
    <div className="panel">
      <Empty
        title="Access restricted"
        description="Your account does not have permission to open this workspace."
      />
    </div>
  );
}
