import { NextRequest, NextResponse } from "next/server";

/**
 * Simple shared-secret auth for cron endpoints. Scheduled agents pass the
 * secret in the `X-Cron-Secret` header (or `?secret=` query for convenience).
 * Keep CRON_SECRET in .env on both the server and the scheduled agent runtime.
 */
export function requireCronSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on the server" },
      { status: 500 },
    );
  }
  const provided = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
