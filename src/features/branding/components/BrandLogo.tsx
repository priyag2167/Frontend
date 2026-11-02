import { useState } from "react";
import { Activity } from "lucide-react";

export function BrandLogo({
  url,
  companyName,
}: {
  url: string | null | undefined;
  companyName?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <span className="brand-symbol">
      {url && failedUrl !== url ? (
        <img
          src={url}
          alt={`${companyName || "Company"} logo`}
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
          onLoad={() => setFailedUrl(null)}
        />
      ) : (
        <Activity size={25} aria-hidden="true" />
      )}
    </span>
  );
}
