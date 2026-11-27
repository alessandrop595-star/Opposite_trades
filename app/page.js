"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Sparkles,
  Film,
  Layers,
  Globe,
  History,
  Copy,
  Check,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react";

const supabaseUrl = "https://xlmfpbgelkzbrrvdwwkb.supabase.co";
const supabaseKey = "sb_publishable_mTMPdoGODnpNCwzw0Y15tA_MKyamvAV";

const supabase = createClient(supabaseUrl, supabaseKey);

export default function OppositeTradesStudio() {
  const [format, setFormat] = useState("reel");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(15);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentItem, setCurrentItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  // Stato player & export Reel 9:16
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedElapsedRef = useRef(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [exportUrl, setExportUrl] = useState("");
  const [exportExt, setExportExt] = useState("mp4");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const { data, error } = await supabase
        .from("opposite_concepts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data && data.length > 0) {
        const normalized = data.map((row) => ({
          id: row.id,
          created_at: row.created_at,
          format: row.format,
          ...(row.visual_spec || {}),
          title: row.visual_spec?.title || row.title,
          topic: row.visual_spec?.topic || row.topic,
          angle: row.visual_spec?.angle || row.angle,
          hook: row.visual_spec?.hook || row.hook,
          caption: row.visual_spec?.caption || row.caption,
        }));
        setHistory(normalized);
        if (!currentItem) {
          setCurrentItem(normalized[0]);
        }
      }
    } catch (err) {
      console.error("Errore caricamento storico:", err);
    }
  }

  async function handleGenerate(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setExportUrl("");
    setSlideIdx(0);
    pausedElapsedRef.current = 0;
    setProgress(0);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          topic: topic.trim(),
          duration,
          useWebSearch,
        }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Risposta server non valida: ${rawText.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Errore di generazione");
      }

      setCurrentItem(data);
      setHistory((prev) => [data, ...prev.filter((x) => x.id !== data.id)]);
      setIsPlaying(true);
    } catch (err) {
      setErrorMsg(err.message || "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  function selectFromHistory(item) {
    setCurrentItem(item);
    if (item.format) setFormat(item.format);
    setSlideIdx(0);
    setExportUrl("");
    pausedElapsedRef.current = 0;
    setProgress(0);
    setIsPlaying(true);
  }

  function copyCaption() {
    if (!currentItem?.caption) return;
    navigator.clipboard?.writeText(currentItem.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  // Disegno dinamico su Canvas 9:16 (540x960)
  useEffect(() => {
    if (!currentItem || format !== "reel") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = 540;
    const height = 960;
    canvas.width = width;
    canvas.height = height;

    const totalMs = (currentItem.duration || duration || 15) * 1000;
    const scenes =
      Array.isArray(currentItem.scenes) && currentItem.scenes.length > 0
        ? currentItem.scenes
        : [
            {
              badge: "01 // OPPOSITE",
              headline: currentItem.hook || "NON SEGUIRE LA MASSA",
              subtext: currentItem.angle || "Esecuzione disciplinata",
              ticker: "NQ",
              primaryMetric: "1:3.4 R:R",
              secondaryMetric: "1 TRADE / DAY",
              dataPoints: [24, 52, 40, 78, 66, 91, 74, 95],
            },
          ];

    const theme = currentItem.theme || {};
    const bgPrimary = theme.bgPrimary || "#07070c";
    const accentPrimary = theme.accentPrimary || "#8b5cf6";
    const accentSecondary = theme.accentSecondary || "#eab308";
    const accentAlert = theme.accentAlert || "#ef4444";

    startTimeRef.current = performance.now() - pausedElapsedRef.current;

    function renderFrame(now) {
      if (!isPlaying) {
        startTimeRef.current = now - pausedElapsedRef.current;
      }
      const elapsed = isPlaying ? now - startTimeRef.current : pausedElapsedRef.current;
      pausedElapsedRef.current = elapsed;

      const loopElapsed = elapsed % totalMs;
      const pct = loopElapsed / totalMs;
      setProgress(pct);

      const sceneCount = scenes.length;
      const sceneDuration = totalMs / sceneCount;
      const activeIndex = Math.min(
        sceneCount - 1,
        Math.floor(loopElapsed / sceneDuration)
      );
      const localT = (loopElapsed % sceneDuration) / sceneDuration;
      const scene = scenes[activeIndex];

      // Sfondo procedurale animato
      ctx.fillStyle = bgPrimary;
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createRadialGradient(
        width * (0.3 + 0.4 * Math.sin(elapsed * 0.0008 + activeIndex)),
        height * 0.25,
        30,
        width * 0.5,
        height * 0.4,
        620
      );
      grad.addColorStop(0, `${accentPrimary}44`);
      grad.addColorStop(0.55, `${accentSecondary}18`);
      grad.addColorStop(1, "rgba(7,7,12,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Griglia tecnica dinamica
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 1;
      const gridStep = 54;
      const offsetX = (elapsed * 0.02) % gridStep;
      for (let x = -offsetX; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Header brand @opposite_trades
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      roundRect(ctx, 36, 46, width - 72, 54, 16);
      ctx.fill();

      ctx.fillStyle = accentSecondary;
      ctx.beginPath();
      ctx.arc(64, 73, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f4f4f8";
      ctx.font = "700 18px sans-serif";
      ctx.fillText("@OPPOSITE_TRADES", 84, 79);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = "600 14px monospace";
      ctx.fillText(scene.ticker || "MARKET", width - 145, 79);

      // Badge scena
      const slideIn = Math.min(1, localT * 4);
      ctx.fillStyle = `${accentPrimary}33`;
      roundRect(ctx, 36, 136, 230, 38, 12);
      ctx.fill();
      ctx.strokeStyle = accentPrimary;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#e9d5ff";
      ctx.font = "700 15px monospace";
      ctx.fillText(scene.badge || `0${activeIndex + 1} // INSIGHT`, 50, 161);

      // Headline principale
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 38px sans-serif";
      const headlineLines = wrapText(
        ctx,
        (scene.headline || currentItem.hook || "").toUpperCase(),
        width - 72,
        3
      );
      let textY = 232 + (1 - slideIn) * 20;
      headlineLines.forEach((line) => {
        ctx.fillText(line, 36, textY);
        textY += 46;
      });

      // Subtext
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "500 20px sans-serif";
      const subLines = wrapText(ctx, scene.subtext || "", width - 72, 2);
      let subY = textY + 12;
      subLines.forEach((line) => {
        ctx.fillText(line, 36, subY);
        subY += 28;
      });

      // Box grafico & dati animati al centro
      const boxTop = Math.max(430, subY + 28);
      const boxHeight = 320;
      ctx.fillStyle = "rgba(15, 15, 26, 0.88)";
      roundRect(ctx, 36, boxTop, width - 72, boxHeight, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Metriche in alto dentro il box
      ctx.fillStyle = accentSecondary;
      ctx.font = "800 32px sans-serif";
      ctx.fillText(scene.primaryMetric || "+24.8%", 62, boxTop + 56);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 15px monospace";
      ctx.fillText(scene.secondaryMetric || "RISK ENGINE ACTIVE", 62, boxTop + 82);

      // Grafico a barre/linea animato con i dataPoints generati dall'AI
      const pts =
        Array.isArray(scene.dataPoints) && scene.dataPoints.length > 0
          ? scene.dataPoints
          : [30, 55, 45, 80, 62, 88, 70, 94];

      const chartLeft = 64;
      const chartRight = width - 64;
      const chartBottom = boxTop + boxHeight - 36;
      const chartTop = boxTop + 115;
      const chartW = chartRight - chartLeft;
      const chartH = chartBottom - chartTop;

      const barGap = 12;
      const barW = (chartW - barGap * (pts.length - 1)) / pts.length;

      pts.forEach((val, idx) => {
        const norm = Math.max(0.08, Math.min(1, Number(val) / 100));
        const animFactor = Math.min(1, Math.max(0.15, localT * 1.4 - idx * 0.06));
        const h = chartH * norm * animFactor;
        const x = chartLeft + idx * (barW + barGap);
        const y = chartBottom - h;

        const isLast = idx === pts.length - 1;
        ctx.fillStyle = isLast
          ? accentSecondary
          : idx % 2 === 0
          ? accentPrimary
          : `${accentPrimary}99`;
        roundRect(ctx, x, y, barW, h, 8);
        ctx.fill();
      });

      // Linea trend sopra le barre
      ctx.beginPath();
      pts.forEach((val, idx) => {
        const norm = Math.max(0.08, Math.min(1, Number(val) / 100));
        const animFactor = Math.min(1, Math.max(0.15, localT * 1.4 - idx * 0.06));
        const h = chartH * norm * animFactor;
        const x = chartLeft + idx * (barW + barGap) + barW / 2;
        const y = chartBottom - h - 10;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = accentAlert;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Barra avanzamento temporale in basso
      const barY = height - 88;
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      roundRect(ctx, 36, barY, width - 72, 8, 4);
      ctx.fill();

      ctx.fillStyle = accentSecondary;
      roundRect(ctx, 36, barY, (width - 72) * pct, 8, 4);
      ctx.fill();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 14px monospace";
      ctx.fillText(
        `SCENA ${activeIndex + 1}/${sceneCount} • ${Math.round(pct * 100)}%`,
        36,
        height - 52
      );

      animRef.current = requestAnimationFrame(renderFrame);
    }

    animRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [currentItem, format, duration, isPlaying]);

  function startExportVideo() {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === "undefined") {
      setErrorMsg("Esportazione video non supportata su questo browser.");
      return;
    }

    setExportUrl("");
    setIsRecording(true);
    pausedElapsedRef.current = 0;
    setIsPlaying(true);
    chunksRef.current = [];

    const stream = canvas.captureStream(30);
    let mimeType = "";
    let ext = "mp4";

    if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
      ext = "mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mimeType = "video/webm;codecs=vp9";
      ext = "webm";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
      ext = "webm";
    }

    setExportExt(ext);
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mimeType || "video/mp4",
      });
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      setIsRecording(false);
    };

    recorder.start();
    const recordMs = (currentItem?.duration || duration || 15) * 1000;
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, recordMs);
  }

  const slides = Array.isArray(currentItem?.slides) ? currentItem.slides : [];

  return (
    <div className="min-h-screen bg-[#07070c] text-[#f4f4f8] pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#07070c]/85 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">
              OPPOSITE TRADES STUDIO
            </h1>
            <p className="text-[11px] text-zinc-400">
              AI + Web Search + Cloud Memory
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadHistory}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 active:scale-95"
          title="Aggiorna storico"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-5 space-y-6">
        {/* Controlli Generazione */}
        <form
          onSubmit={handleGenerate}
          className="rounded-2xl bg-[#10101a] border border-white/10 p-4 space-y-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormat("reel")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition ${
                format === "reel"
                  ? "bg-violet-600 border-violet-400 text-white"
                  : "bg-white/5 border-white/10 text-zinc-300"
              }`}
            >
              <Film className="w-4 h-4" />
              Reel 9:16
            </button>
            <button
              type="button"
              onClick={() => setFormat("carousel")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition ${
                format === "carousel"
                  ? "bg-violet-600 border-violet-400 text-white"
                  : "bg-white/5 border-white/10 text-zinc-300"
              }`}
            >
              <Layers className="w-4 h-4" />
              Carosello 4:5
            </button>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              Argomento o concept (lascia vuoto per trend web automatico)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Es. Prop Firm Reality, Volume POC, 1 Trade a Day..."
              className="w-full rounded-xl bg-[#090910] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setUseWebSearch((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
                useWebSearch
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-white/5 border-white/10 text-zinc-400"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Ricerca Web: {useWebSearch ? "ON" : "OFF"}
            </button>

            {format === "reel" && (
              <div className="flex items-center gap-1.5">
                {[15, 20].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDuration(sec)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                      duration === sec
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-white/5 border-white/10 text-zinc-400"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            {loading
              ? "Ragionamento AI & ricerca in corso..."
              : "Genera Nuovo Concept Unico"}
          </button>
        </form>

        {/* Anteprima Contenuto Generato */}
        {currentItem && (
          <section className="rounded-2xl bg-[#10101a] border border-white/10 p-4 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
                  {currentItem.angle || "Concept Dinamico"}
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">
                  {currentItem.title}
                </h2>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                {currentItem.topic}
              </span>
            </div>

            {format === "reel" ? (
              <div className="space-y-3">
                <div className="mx-auto max-w-[300px] rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto block aspect-[9/16]"
                  />
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pausa
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Play
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={startExportVideo}
                    disabled={isRecording}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-xs font-semibold disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isRecording ? "Registrazione..." : "Esporta Video"}
                  </button>
                </div>

                {exportUrl && (
                  <div className="text-center">
                    <a
                      href={exportUrl}
                      download={`opposite-reel-${Date.now()}.${exportExt}`}
                      className="inline-block text-xs font-semibold text-emerald-400 underline"
                    >
                      Scarica video generato
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {slides.length > 0 && slides[slideIdx] && (
                  <div className="rounded-2xl bg-gradient-to-br from-[#17152b] to-[#0a0a12] border border-violet-500/30 p-5 min-h-[320px] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-violet-300 font-mono">
                      <span>{slides[slideIdx].badge}</span>
                      <span>
                        {slideIdx + 1} / {slides.length}
                      </span>
                    </div>

                    <div className="my-4 space-y-2.5">
                      <h3 className="text-xl font-extrabold text-white leading-snug">
                        {slides[slideIdx].headline}
                      </h3>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {slides[slideIdx].body}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/40 border border-white/10 p-3 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 uppercase">
                        {slides[slideIdx].statLabel || "METRICA"}
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        {slides[slideIdx].statValue}
                      </span>
                    </div>
                  </div>
                )}

                {slides.length > 1 && (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIdx((i) =>
                          i === 0 ? slides.length - 1 : i - 1
                        )
                      }
                      className="p-2.5 rounded-xl bg-white/10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-zinc-400">
                      Slide {slideIdx + 1} di {slides.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIdx((i) => (i + 1) % slides.length)
                      }
                      className="p-2.5 rounded-xl bg-white/10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Caption */}
            {currentItem.caption && (
              <div className="rounded-xl bg-[#090910] border border-white/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">
                    Caption Instagram
                  </span>
                  <button
                    type="button"
                    onClick={copyCaption}
                    className="flex items-center gap-1 text-xs text-violet-400 font-semibold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copiata
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copia
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-zinc-400 whitespace-pre-line leading-relaxed">
                  {currentItem.caption}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Storico Persistente da Supabase */}
        <section className="rounded-2xl bg-[#10101a] border border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold">
              Memoria Cloud ({history.length})
            </h2>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Nessun concept ancora salvato su Supabase. Genera il tuo primo
              contenuto qui sopra.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectFromHistory(item)}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {item.topic} • {item.angle}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 shrink-0">
                    {item.format || "reel"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}
