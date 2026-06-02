"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/app/analytics";

export default function ExpertViewAnalytics({
  expertId,
  expertName,
  category,
}: {
  expertId: number;
  expertName: string;
  category: string;
}) {
  useEffect(() => {
    let isCancelled = false;

    const trackExpertView = () => {
      if (isCancelled) {
        return;
      }

      void trackAnalyticsEvent({
        eventName: "expert_view",
        page: `/experts/${expertId}`,
        metadata: {
          expert_id: expertId,
          expert_name: expertName,
          category,
        },
      }).catch((error: unknown) => {
        console.warn("Expert view analytics failed:", error);
      });
    };

    const timeoutId = globalThis.setTimeout(trackExpertView, 0);

    return () => {
      isCancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, [category, expertId, expertName]);

  return null;
}
