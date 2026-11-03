import { useState } from "react";
import { Activity } from "lucide-react";
import { apiAssetUrl } from "@/shared/api/client";

export function BrandLogo({
  url,
  companyName,
  preview = false,
  onImageError,
  onImageLoad,
}: {
  url: string | null | undefined;
  companyName?: string;
  preview?: boolean;
  onImageError?: (url: string) => void;
  onImageLoad?: () => void;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(url && failedUrl !== url);
  const imageUrl =
    url && /^https:\/\//i.test(url)
      ? apiAssetUrl(
          preview
            ? `/organisation/branding/logo-preview?url=${encodeURIComponent(url)}`
            : `/organisation/branding/logo?v=${encodeURIComponent(url)}`,
        )
      : url;
  return (
    <span className={`brand-symbol${showImage ? " has-logo" : ""}`}>
      {showImage ? (
        <img
          src={imageUrl!}
          alt={`${companyName || "Company"} logo`}
          referrerPolicy="no-referrer"
          onError={() => {
            setFailedUrl(url!);
            onImageError?.(url!);
          }}
          onLoad={() => {
            setFailedUrl(null);
            onImageLoad?.();
          }}
        />
      ) : (
        <Activity size={25} aria-hidden="true" />
      )}
    </span>
  );
}
