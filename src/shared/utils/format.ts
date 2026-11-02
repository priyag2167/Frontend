import { queryClient } from "@/shared/api/queryClient";
import type { Session } from "@/shared/types/contracts";
export function dateTime(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(
        queryClient.getQueryData<Session>(["auth", "me"])?.user.locale,
        {
          timeZone: queryClient.getQueryData<Session>(["auth", "me"])?.user
            .timeZone,
          dateStyle: "medium",
          timeStyle: "short",
        },
      ).format(new Date(value))
    : "—";
}
export function dateOnly(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(
        queryClient.getQueryData<Session>(["auth", "me"])?.user.locale,
        {
          dateStyle: "medium",
          timeZone: queryClient.getQueryData<Session>(["auth", "me"])?.user
            .timeZone,
        },
      ).format(new Date(value))
    : "—";
}
export function localInput(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}
