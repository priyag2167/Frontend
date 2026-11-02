import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import type { Branding } from "../types/branding";

export function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: ({ signal }) =>
      api<Branding | null>("/organisation/branding", { signal }),
  });
}
