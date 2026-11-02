import { useEffect } from "react";
import { useBranding } from "@/features/branding/hooks/useBranding";
import { getBrandTheme } from "@/features/branding/utils/theme";
import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./router/AppRouter";
import { ErrorBoundary } from "./ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <BrandedApp />
      </AppProviders>
    </ErrorBoundary>
  );
}
function BrandedApp() {
  const branding = useBranding().data;
  const productName = branding?.productName ?? "Pharma VRM";
  const color = branding?.primaryColor;
  useEffect(() => {
    const theme = getBrandTheme(color);
    const style = document.documentElement.style;
    for (const [property, value] of Object.entries(theme)) {
      style.setProperty(property, value);
    }
    return () => {
      for (const property of Object.keys(theme)) style.removeProperty(property);
    };
  }, [color]);
  return <AppRouter productName={productName} />;
}
