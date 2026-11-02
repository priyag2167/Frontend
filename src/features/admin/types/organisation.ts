import type { Branding } from "@/features/branding/types/branding";

export interface OrganisationData {
  branding:
    | (Branding & {
        supportEmail: string | null;
      })
    | null;
  settings: { timeZone: string; locale: string } | null;
}
