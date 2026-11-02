import { useState, type FormEvent } from "react";
import { Dialog } from "./Dialog";
import { Field } from "./Field";
import { ErrorMessage } from "./ErrorMessage";
import { Submit } from "./Submit";

export function ReasonDialog({
  title,
  description,
  confirm,
  onClose,
  pending,
  error,
}: {
  title: string;
  description: string;
  confirm: (reason: string) => Promise<unknown>;
  onClose: () => void;
  pending: boolean;
  error: unknown;
}) {
  const [reason, setReason] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await confirm(reason);
      onClose();
    } catch {
      /* Mutation error is displayed below. */
    }
  }
  return (
    <Dialog title={title} description={description} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <Field label="Reason / review comments">
          <textarea
            required
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </Field>
        <ErrorMessage error={error} />
        <div className="form-actions">
          <button
            type="button"
            className="btn secondary"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </button>
          <Submit pending={pending}>Confirm</Submit>
        </div>
      </form>
    </Dialog>
  );
}
