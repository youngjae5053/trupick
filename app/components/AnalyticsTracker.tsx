"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/app/analytics";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryString = searchParams.toString();
    const page = queryString ? `${pathname}?${queryString}` : pathname;

    void trackAnalyticsEvent({
      eventName: "page_view",
      page,
      metadata: {
        pathname,
      },
    });
  }, [pathname, searchParams]);

  return null;
}
