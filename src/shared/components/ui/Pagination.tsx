import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Page } from "@/shared/types/contracts";

export function Pagination({
  data,
  onPage,
  busy = false,
}: {
  data?: Pick<Page<unknown>, "total" | "page" | "pageSize">;
  onPage: (page: number) => void;
  busy?: boolean;
}) {
  if (!data?.total) return null;
  const pages = Math.ceil(data.total / data.pageSize);
  return (
    <div className="pagination">
      <span>
        {(data.page - 1) * data.pageSize + 1}–
        {Math.min(data.page * data.pageSize, data.total)} of {data.total}
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Previous page"
          disabled={data.page <= 1 || busy}
          onClick={() => onPage(data.page - 1)}
        >
          <ArrowLeft size={16} />
        </button>
        <span>
          Page {data.page} of {pages}
        </span>
        <button
          className="icon-button"
          aria-label="Next page"
          disabled={data.page >= pages || busy}
          onClick={() => onPage(data.page + 1)}
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
