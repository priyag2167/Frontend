import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, params } from "@/shared/api/client";
import { useDebounced } from "@/shared/hooks/useDebounced";
import type { Hcp, Page } from "@/shared/types/contracts";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";

export function HcpSelect({
  value,
  onChange,
  optional = false,
  contactRequired = false,
  excludeId,
  onSelect,
}: {
  value: string;
  onChange: (id: string) => void;
  optional?: boolean;
  contactRequired?: boolean;
  excludeId?: string;
  onSelect?: (hcp: Hcp) => void;
}) {
  const [search, setSearch] = useState("");
  const term = useDebounced(search);
  const hcps = useQuery({
    queryKey: ["hcps", "picker", term, contactRequired],
    queryFn: ({ signal }) =>
      api<Page<Hcp>>(
        "/hcps" +
          params({
            search: term,
            pageSize: 30,
            contactAllowed: contactRequired ? true : undefined,
          }),
        {
          signal,
        },
      ),
  });
  const selected = useQuery({
    queryKey: ["hcps", value],
    queryFn: ({ signal }) => api<Hcp>(`/hcps/${value}`, { signal }),
    enabled: !!value,
  });
  const options = [
    ...(selected.data ? [selected.data] : []),
    ...(hcps.data?.items.filter((h) => h.id !== value) ?? []),
  ].filter(
    (hcp) => hcp.id !== excludeId && (!contactRequired || hcp.contactAllowed),
  );
  return (
    <Field
      label={`Healthcare professional${optional ? " (optional)" : ""}`}
      hint={
        contactRequired
          ? "Choose an HCP with contact permission recorded. The visit representative will be filtered to people who can access this HCP."
          : "Search to find an HCP in your authorised directory."
      }
    >
      <input
        aria-label="Search healthcare professionals"
        placeholder="Search name, institution or specialty"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        required={!optional}
        aria-label={`Healthcare professional${optional ? " (optional)" : ""}`}
        value={options.some((hcp) => hcp.id === value) ? value : ""}
        onChange={(e) => {
          onChange(e.target.value);
          const hcp = options.find((h) => h.id === e.target.value);
          if (hcp) onSelect?.(hcp);
        }}
      >
        <option value="">
          {hcps.isPending ? "Loading…" : "Select an HCP"}
        </option>
        {options.map((h) => (
          <option key={h.id} value={h.id}>
            {h.fullName} · {h.institutionName}
          </option>
        ))}
      </select>
      {hcps.data && (
        <small>
          {hcps.data.total === 0
            ? "No matching HCPs. Try another search or check contact permission."
            : hcps.data.total > 30
              ? "Showing up to 30 matches. Refine the search to find another HCP."
              : `${hcps.data.total} matching HCPs`}
        </small>
      )}
      <ErrorMessage error={hcps.error || selected.error} />
    </Field>
  );
}
