"use client";

import { Suspense } from "react";
import PricingPage from "./PricingPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Pricing...</div>}>
      <PricingPage />
    </Suspense>
  );
}
