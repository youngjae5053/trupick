import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

export type AnalyticsEventName =
  | "page_view"
  | "signup"
  | "login"
  | "expert_register"
  | "expert_view"
  | "consultation_request"
  | "review_created"
  | "ai_match_started"
  | "ai_match_completed"
  | "feedback_submitted";

export type AnalyticsMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

type GtagCommand = "config" | "event" | "js";

declare global {
  interface Window {
    gtag?: (
      command: GtagCommand,
      eventNameOrTarget: string | Date,
      params?: Record<string, unknown>
    ) => void;
  }
}

const gaEventNameMap: Partial<Record<AnalyticsEventName, string>> = {
  ai_match_started: "ai_match_start",
  ai_match_completed: "ai_match_complete",
};

function trackGoogleAnalyticsEvent({
  eventName,
  page,
  metadata,
}: {
  eventName: AnalyticsEventName;
  page: string;
  metadata: AnalyticsMetadata;
}) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  const gaEventName = gaEventNameMap[eventName] ?? eventName;

  window.gtag("event", gaEventName, {
    page_path: page,
    page_location: window.location.href,
    ...metadata,
  });
}

export async function trackAnalyticsEvent({
  eventName,
  page,
  metadata = {},
}: {
  eventName: AnalyticsEventName;
  page: string;
  metadata?: AnalyticsMetadata;
}) {
  trackGoogleAnalyticsEvent({ eventName, page, metadata });

  try {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const { data } = await supabase.auth.getUser();

    await supabase.from("analytics_events").insert([
      {
        user_id: data.user?.id ?? null,
        event_name: eventName,
        page,
        metadata,
      },
    ]);
  } catch (error) {
    console.warn("Analytics event failed:", error);
  }
}
