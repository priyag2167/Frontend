import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { useUiStore } from "@/shared/stores/uiStore";

export function Toast() {
  const toast = useUiStore((s) => s.toast);
  const clearToast = useUiStore((s) => s.clearToast);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 4500);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);
  return (
    <>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast.message}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={clearToast}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
