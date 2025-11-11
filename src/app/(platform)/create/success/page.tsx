"use client";

import { Suspense } from "react";
import SuccessPage from "./SuccessPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-6">Loading...</div>}>
      <SuccessPage />
    </Suspense>
  );
}
