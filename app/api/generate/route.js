import { NextResponse } from "next/server";

export async function POST() {
  const key = String(process.env.GEMINI_API_KEY || "").trim();
  return NextResponse.json({
    ok: true,
    hasKey: Boolean(key),
    keyPrefix: key ? key.slice(0, 4) : "none",
    topic: "Test API",
    angle: "Verifica connessione",
    title: "Connessione API attiva",
    hook: "La rotta /api/generate risponde in JSON",
    caption: "Test completato @opposite_trades #trading #orderflow #propfirm #quant #discipline",
    slides: [
      {
        badge: "01 / TEST",
        headline: "API COLLEGATA CORRETTAMENTE",
        body: "Il backend ora risponde in formato JSON valido senza errori HTML.",
        statLabel: "CHIAVE GEMINI",
        statValue: key ? key.slice(0, 6) + "..." : "MANCANTE",
      },
    ],
    scenes: [
      {
        badge: "01 // TEST",
        headline: "BACKEND OPERATIVO",
        subtext: "Pronto per il collegamento AI",
        ticker: "NQ",
        primaryMetric: "200 OK",
        secondaryMetric: "JSON READY",
        dataPoints: [25, 45, 38, 70, 62, 85, 78, 92],
      },
    ],
  });
}
