import LiffMyPlanGate from "@/components/LiffMyPlanGate";

export const dynamic = "force-dynamic";

/**
 * LINE LIFF entry point for "My Plan". Configured in the LINE Developers
 * Console as the endpoint of LIFF ID `process.env.NEXT_PUBLIC_LIFF_ID_MYPLAN`,
 * which is what the LINE OA rich-menu button links to via
 * `https://liff.line.me/{LIFF_ID}`.
 *
 * The actual handshake (liff.init → getProfile → POST /api/plans/line-link →
 * write deviceId to localStorage → redirect to /{lang}?menu=myplan) happens
 * client-side in LiffMyPlanGate.
 */
export default async function MyPlanLiffPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return <LiffMyPlanGate lang={lang} />;
}
