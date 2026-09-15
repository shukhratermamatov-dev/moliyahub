import { Suspense } from "react";
import { FinancingPageClient } from "./financing-page-client";

export default function FinancingPage() {
  return (
    <Suspense fallback={null}>
      <FinancingPageClient />
    </Suspense>
  );
}
