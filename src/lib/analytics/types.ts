// Client-side mirror of the Prisma AnalyticsEventType enum. Kept in sync
// manually — if you add a value here, add it to schema.prisma too.
export type AnalyticsEventType =
  | "PAGE_VIEW"
  | "ROW_CLICK"
  | "LANGUAGE_SWITCH"
  | "TRIP_VIEW"
  | "SCHEDULE_VIEW"
  | "SCHEDULE_SHARE"
  | "BLOG_VIEW"
  | "BLOG_READ_COMPLETE"
  | "SEARCH"
  | "SEARCH_RESULT_CLICK"
  | "FILTER_APPLY"
  | "BOOKING_INTENT_LINE"
  | "BOOKING_INTENT_WHATSAPP"
  | "BOOKING_INTENT_EMAIL"
  | "BOOKING_INTENT_CALL"
  | "BOOKING_INTENT_MESSENGER"
  | "BOOKING_INTENT_WECHAT"
  | "BOOKING_INTENT_KAKAO"
  | "SESSION_START"
  | "SESSION_END"
  | "ERROR"
  | "CHAT_OPEN"
  | "CHAT_MESSAGE"
  | "CHAT_FEEDBACK"
  | "CHAT_TRIP_CLICK"
  | "CHAT_ITINERARY_SAVE"
  | "CHAT_ITINERARY_SHARE"
  | "BOOKING_INTENT_KAKAO"
  | "PLAN_VIEW"
  | "PLAN_CREATE"
  | "PLAN_TRIP_ADD"
  | "PLAN_TRIP_REMOVE"
  | "PLAN_SHARE"
  | "PLAN_INVITE"
  | "PLAN_CONTACT"
  | "PLAN_EMAIL_LINK";

export type TrackEventInput = {
  type: AnalyticsEventType;
  path?: string;
  entityType?: string | null;
  entityId?: string | null;
  dwellMs?: number | null;
  scrollPct?: number | null;
  properties?: Record<string, unknown> | null;
};

export type TrackBatch = {
  sessionId: string;
  visitorId: string;
  lang?: string | null;
  viewportW?: number;
  viewportH?: number;
  startedAt?: string;                 // ISO
  firstUtm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  };
  lastUtm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
  };
  referrer?: string | null;
  landingPath?: string | null;
  events: Array<TrackEventInput & { ts: string }>;
};
