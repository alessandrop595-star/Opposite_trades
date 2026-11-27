import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      format = "reel",
      topic = "",
      duration = 15,
      useWebSearch = true,
    } = body;

    const geminiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY mancante su Vercel" },
        { status: 500 }
      );
    }

    const supabase =
      supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    // 1. Legge gli ultimi 40 concept salvati su Supabase per impedire ripetizioni
    let historyList = [];
    if (supabase) {
      const { data } = await supabase
        .from("opposite_concepts")
        .select("title, topic, angle, hook")
        .order("created_at", { ascending: false })
        .limit(40);
      if (data) historyList = data;
    }

    const historySummary =
      historyList.length > 0
        ? historyList
            .map((h, i) => `${i + 1}. [${h.topic}] ${h.title} — ${h.hook}`)
            .join("\n")
        : "Nessun contenuto precedente.";

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const entropySeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const prompt = `Sei il direttore creativo e quant analyst di @opposite_trades (brand trading istituzionale, orderflow, prop firm reality, disciplina 1 trade al giorno, psicologia contrarian).
Seed univoco di questa generazione: ${entropySeed}
Formato richiesto: ${format === "carousel" ? "Carosello Instagram 4:5 (6 slide)" : `Reel Motion Graphics 9:16 (${duration} secondi, 4 scene)`}
Argomento richiesto dall'utente: ${topic.trim() ? topic.trim() : "Scegli autonomamente un trend attuale, dato macro o dibattito caldo nel mondo trading / prop firm / orderflow cercando sul web"}

STORICO CONTENUTI GIÀ CREATI (VIETATO RIPETERE QUESTI ANGOLI, TITOLI O HOOK):
${historySummary}

REGOLE CREATIVE OBBLIGATORIE:
- Ragiona completamente da zero: NON usare mai schemi ripetitivi. Anche se l'argomento è simile a uno passato (es. Prop Firm o Volume POC), inventa un micro-concetto nuovo, una metafora visiva diversa, numeri/ticker/percentuali reali e nuovi.
- Lingua: Italiano moderno, diretto, autorevole e ad alta retention (stile institutional trader, zero fuffa).
- Restituisci SOLO un oggetto JSON valido (senza markdown \`\`\`json) con questa esatta struttura:
{
  "topic": "Argomento sintetico",
  "angle": "Angolo psicologico/tecnico scelto",
  "title": "Titolo breve del progetto",
  "hook": "Frase gancio esplosiva",
  "caption": "Caption Instagram completa pronta da copiare con CTA a @opposite_trades e 5 hashtag mirati",
  "theme": {
    "bgPrimary": "#07070c",
    "accentPrimary": "#8b5cf6",
    "accentSecondary": "#eab308",
    "accentAlert": "#ef4444",
    "bgArchitecture": "Scegli liberamente tra: vault_lasers | orderflow_matrix | radar_pulse | holo_candles | energy_rift | neural_nodes | killzone_orbit | liquidity_blocks | seismic_waves"
  },
  "slides": [
    {
      "badge": "01 / HOOK",
      "headline": "TITOLO SLIDE IMPATTANTE (MAX 7 PAROLE)",
      "body": "Spiegazione chiara e concreta (max 22 parole)",
      "statLabel": "METRICA CHIAVE",
      "statValue": "ES. -4.2% TRAILING DD"
    }
  ],
  "scenes": [
    {
      "badge": "01 // REALITY",
      "headline": "TESTO GRANDE A SCHERMO (MAX 6 PAROLE)",
      "subtext": "Sottotitolo tecnico breve (max 12 parole)",
      "visualType": "Scegli una grafica diversa per ogni scena tra: candles_sweep | drawdown_gauge | equity_race | volume_poc | rr_builder | discipline_grid | dom_ladder | revenge_spiral | opposite_stat",
      "ticker": "NQ / ES / XAU / PROP",
      "primaryMetric": "ES. 91.4%",
      "secondaryMetric": "ES. $150K EVAL",
      "dataPoints": [22, 48, 35, 76, 64, 92, 58, 88]
    }
  ]
}
Assicurati che "slides" abbia esattamente 6 elementi e "scenes" abbia esattamente 4 elementi con "visualType" tutti diversi tra loro.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 1.15,
        tools: useWebSearch ? [{ googleSearch: {} }] : [],
      },
    });

    const rawText = response.text || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Risposta AI non valida, riprova.");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // 2. Salva il nuovo concept su Supabase per la memoria infinita
    let savedId = crypto.randomUUID();
    if (supabase) {
      const { data: inserted } = await supabase
        .from("opposite_concepts")
        .insert([
          {
            format,
            topic: parsed.topic || topic || "Trading Reality",
            angle: parsed.angle || "Contrarian",
            title: parsed.title || "Opposite Concept",
            hook: parsed.hook || "",
            caption: parsed.caption || "",
            visual_spec: parsed,
          },
        ])
        .select("id")
        .single();
      if (inserted?.id) savedId = inserted.id;
    }

    return NextResponse.json({
      id: savedId,
      created_at: new Date().toISOString(),
      format,
      ...parsed,
    });
  } catch (err) {
    console.error("Errore API generate:", err);
    return NextResponse.json(
      { error: err.message || "Errore durante la generazione AI" },
      { status: 500 }
    );
  }
}
