import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError, resetCsrf } from "@/shared/api/client";
import type { Session } from "@/shared/types/contracts";

export const WorkspaceSessionContext = createContext<Session | null>(null);

export function useSession() {
  const workspaceSession = useContext(WorkspaceSessionContext);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async ({ signal }) => {
      try {
        return await api<Session>("/auth/me", { signal });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          resetCsrf();
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60000,
    // The layout handles session loss. Its children keep the same authenticated
    // snapshot until they unmount, including during concurrent navigation.
    select: (session) => workspaceSession ?? session,
  });
}
export function useCan(permission: string) {
  return useSession().data?.permissions.includes(permission) ?? false;
}
