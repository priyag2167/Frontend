import { AlertCircle } from "lucide-react";

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div className="error-message" role="alert">
      <AlertCircle size={17} />
      <span>
        {error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."}
      </span>
    </div>
  );
}
