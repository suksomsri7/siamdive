import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const shortId = req.nextUrl.searchParams.get("id");
  if (!shortId) {
    return new Response("Missing id", { status: 400 });
  }

  const plan = await prisma.itinerary.findUnique({ where: { shortId } });

  const title = plan?.title || "Dive Trip Plan";
  const days = plan?.durationDays || 0;
  const dives = plan?.totalDives || 0;
  const tours = plan?.totalTours || 0;
  const areas = plan?.areas || [];

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0a0a1a 0%, #0d1526 40%, #0a0f1a 100%)",
          fontFamily: "sans-serif",
          color: "#e5e5e5",
          position: "relative",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            display: "flex",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "40px 60px 0",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            🤿
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em" }}>
              <span style={{ color: "#fff" }}>SIAM</span>
              <span style={{ color: "#3b82f6" }}>DIVE</span>
            </span>
            <span style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Ark AI Trip Plan
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 60px",
          }}
        >
          <h1
            style={{
              fontSize: 56,
              fontWeight: 900,
              lineHeight: 1.2,
              maxWidth: 900,
              color: "#f5f5f5",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>

          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 32,
            }}
          >
            {days > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.06)",
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span style={{ fontSize: 20 }}>📅</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#e5e5e5" }}>
                  {days} Days
                </span>
              </div>
            )}
            {dives > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(59,130,246,0.1)",
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <span style={{ fontSize: 20 }}>🤿</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#60a5fa" }}>
                  {dives} Dives
                </span>
              </div>
            )}
            {tours > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(74,222,128,0.1)",
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid rgba(74,222,128,0.2)",
                }}
              >
                <span style={{ fontSize: 20 }}>🌴</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#4ade80" }}>
                  {tours} Tours
                </span>
              </div>
            )}
          </div>

          {areas.length > 0 && (
            <p style={{ fontSize: 22, color: "#888", marginTop: 20 }}>
              {areas.join(" • ")}
            </p>
          )}
        </div>

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 60px 40px",
          }}
        >
          <span style={{ fontSize: 16, color: "#555" }}>
            siamdive.com/plan/{shortId}
          </span>
          <span style={{ fontSize: 14, color: "#3b82f6", fontWeight: 600 }}>
            Powered by Ark AI
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
