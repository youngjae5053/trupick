import { getSupabaseBrowserClient } from "@/app/supabaseBrowser";

export type AnalyticsEventName =
  | "page_view"
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

export async function trackAnalyticsEvent({
  eventName,
  page,
  metadata = {},
}: {
  eventName: AnalyticsEventName;
  page: string;
  metadata?: AnalyticsMetadata;
}) {
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
