import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY mancante su Vercel." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const format = body?.format === "carousel" ? "carousel" : "reel";
    const topic = String(body?.topic || "").trim();
    const webSearch = body?.webSearch !== false;

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Sei il direttore creativo di "Opposite Trades Studio", un brand di trading sistematico, orderflow, prop firm, gestione del rischio e disciplina operativa.
Genera UN concept unico in italiano per il formato: ${format === "reel" ? "Reel 9:16" : "Carosello 4:5"}.
Argomento richiesto: ${topic || "scegli tu un trend attuale ad alto valore sul trading / prop firm / risk management / esecuzione disciplinata"}.
Ricerca web attiva: ${webSearch ? "SÌ — usa dati e trend recenti pertinenti" : "NO — usa principi evergreen di mercato e disciplina"}.

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido (senza markdown, senza \`\`\`json e senza testo extra) con questa struttura esatta:
{
  "topic": "argomento sintetico",
  "angle": "angolo contrarian o insight chiave",
  "title": "titolo breve del concept",
  "hook": "frase di apertura fortissima nei primi 2 secondi",
  "caption": "caption Instagram in italiano con call to action e 5-6 hashtag mirati",
  "slides": [
    {
      "badge": "01 / HOOK",
      "headline": "TITOLO BREVE IN MAIUSCOLO",
      "body": "Testo sintetico e incisivo per la slide.",
      "statLabel": "METRICA",
      "statValue": "VALORE"
    }
  ],
  "scenes": [
    {
      "badge": "01 // SCENA",
      "headline": "TITOLO SCENA",
      "subtext": "Testo a schermo o voce fuori campo",
      "ticker": "NQ",
      "primaryMetric": "VALORE 1",
      "secondaryMetric": "VALORE 2",
      "dataPoints": [28, 42, 35, 64, 58, 81, 74, 90]
    }
  ]
}`;

    const config = {
      temperature: 0.85,
      responseMimeType: "application/json",
      ...(webSearch ? { tools: [{ googleSearch: {} }] } : {}),
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config,
    });

    const rawText = String(response?.text || "").trim();
    const cleanedJson = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedJson);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Errore /api/generate:", err);
    return NextResponse.json(
      { error: err?.message || "Errore durante la generazione con Gemini." },
      { status: 500 }
    );
  }
}
