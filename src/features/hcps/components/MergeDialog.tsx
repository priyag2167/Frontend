import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitMerge } from "lucide-react";
import { api } from "@/shared/api/client";
import { useAction } from "@/shared/hooks/useAction";
import type { Hcp } from "@/shared/types/contracts";
import { Dialog } from "@/shared/components/ui/Dialog";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { Submit } from "@/shared/components/ui/Submit";
import { HcpSelect } from "@/features/hcps/components/HcpSelect";

export function MergeDialog({
  source,
  onClose,
}: {
  source: Hcp;
  onClose: () => void;
}) {
  const [targetId, setTarget] = useState(""),
    [reason, setReason] = useState("");
  const target = useQuery({
    queryKey: ["hcps", targetId],
    queryFn: ({ signal }) => api<Hcp>(`/hcps/${targetId}`, { signal }),
    enabled: !!targetId,
  });
  const save = useAction(
    `/hcps/${source.id}/merge`,
    [["hcps"], ["engagements"], ["tasks"], ["audit"], ["dashboard"]],
    "POST",
    "HCP records merged. The source is archived with its audit history.",
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!target.data) return;
    try {
      await save.mutateAsync({
        targetId,
        sourceVersion: source.version,
        targetVersion: target.data.version,
        reason,
      });
      onClose();
    } catch {
      /* show conflict for review */
    }
  }
  return (
    <Dialog
      title="Merge duplicate HCP records"
      description="Review the surviving profile before confirming."
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <div className="notice">
          <GitMerge size={18} />
          <p>
            <strong>{source.fullName}</strong> at {source.institutionName} will
            be archived. Its visits, reports and tasks will link to the selected
            profile. The surviving profile's name and contact details are
            retained.
          </p>
        </div>
        <HcpSelect
          value={targetId}
          onChange={setTarget}
          excludeId={source.id}
        />
        {target.data && (
          <dl className="details-list">
            <dt>Surviving profile</dt>
            <dd>{target.data.fullName}</dd>
            <dt>Institution</dt>
            <dd>{target.data.institutionName}</dd>
            <dt>Representative</dt>
            <dd>{target.data.assignedRepName}</dd>
            <dt>Registration</dt>
            <dd>{target.data.professionalRegistrationId ?? "Not recorded"}</dd>
          </dl>
        )}
        <p className="muted">
          Both records must have the same owner and contact permission.
          Conflicting registration IDs require manual identity resolution.
        </p>
        <Field label="Reason for merging">
          <textarea
            required
            maxLength={2000}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <ErrorMessage error={save.error || target.error} />
        <Submit pending={save.isPending}>Confirm controlled merge</Submit>
      </form>
    </Dialog>
  );
}
