import { useState, type FormEvent } from "react";
import { Download, UploadCloud } from "lucide-react";
import { Dialog } from "@/shared/components/ui/Dialog";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Field } from "@/shared/components/ui/Field";
import { Submit } from "@/shared/components/ui/Submit";
import { useAction } from "@/shared/hooks/useAction";
import { useUiStore } from "@/shared/stores/uiStore";

export function CsvImportDialog({
  title,
  path,
  headers,
  limit,
  invalidate,
  onClose,
}: {
  title: string;
  path: string;
  headers: string[];
  limit: number;
  invalidate: string[][];
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const save = useAction<FormData, { imported: number }>(
    path,
    invalidate,
    "POST",
    "",
  );
  function template() {
    const url = URL.createObjectURL(
      new Blob([headers.join(",") + "\r\n"], { type: "text/csv" }),
    );
    const link = Object.assign(document.createElement("a"), {
      href: url,
      download: "import-template.csv",
    });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    try {
      const result = await save.mutateAsync(form);
      useUiStore.getState().notify(`${result.imported} records imported.`);
      onClose();
    } catch {
      /* preserve the selected file for correction */
    }
  }
  return (
    <Dialog
      title={title}
      description={`UTF-8 CSV · up to ${limit} rows · maximum 1 MB`}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <div className="notice">
          <UploadCloud size={19} />
          <p>
            The whole file is validated in one transaction. Invalid or duplicate
            rows prevent all rows from being imported.
          </p>
        </div>
        <button className="btn secondary" type="button" onClick={template}>
          <Download size={15} />
          Download header template
        </button>
        <p className="muted">Columns: {headers.join(", ")}.</p>
        {path.includes("users") && (
          <p className="muted">
            Each account requires a unique email and a password of at least 12
            characters. Keep the source CSV in your approved secure location.
          </p>
        )}
        <Field label="Choose CSV file">
          <input
            type="file"
            required
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>
        <ErrorMessage error={save.error} />
        <div className="form-actions">
          <button
            type="button"
            className="btn secondary"
            disabled={save.isPending}
            onClick={onClose}
          >
            Cancel
          </button>
          <Submit pending={save.isPending}>Validate & import</Submit>
        </div>
      </form>
    </Dialog>
  );
}
