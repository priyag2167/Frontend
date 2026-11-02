import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";

export function useUnreadMessages(enabled: boolean) {
  return useQuery({
    queryKey: ["chat", "unread"],
    queryFn: ({ signal }) => api<{ count: number }>("/chat/unread", { signal }),
    enabled,
    refetchInterval: 15000,
    staleTime: 5000,
  });
}
