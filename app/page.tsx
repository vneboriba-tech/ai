// 📁 app/page.tsx
"use client";
import React, { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";

const ROLES = [
  { id: "journalist", title: "Журналист" },
  { id: "blogger", title: "Блоггер" },
  { id: "photographer", title: "Фотограф" },
];

export default function App() {
  const [role, setRole] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const assetsBase = "https://workerjs.vneboriba.workers.dev/"; // на Pages проставится через NEXT_PUBLIC_ASSETS_BASE из GitHub Actions

  const onFile = useCallback((f: File | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  async function handleGenerate() {
    if (!file) {
      setError("Загрузите Вашу фотографию (jpg/png/webp/heic)");
      return;
    }
    if (!role) {
      setError("Выберите героя: журналист / блоггер / фотограф");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("role", role);

      const apiBase = ""; // на Pages проставится через NEXT_PUBLIC_API_BASE из GitHub Actions
      const res = await fetch(`${apiBase}/api/generate`, { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("UnsupportedHttpVerb") || text.includes("<Error>")) {
          throw new Error("Этот хостинг не принимает POST — нужен внешний API. Укажи NEXT_PUBLIC_API_BASE на URL Cloudflare Worker.");
        }
        throw new Error(text);
      }
      const data = await res.json();

      const stamped = await applyClientWatermark(`data:image/png;base64,${data.imageBase64}`, `${assetsBase}/ЛОГО.png`);
      const finalDataUrl = stamped || `data:image/png;base64,${data.imageBase64}`;
      setResult(finalDataUrl.replace(/^data:image\/png;base64,/, ""));
      try { window.open(finalDataUrl, "_blank"); } catch {}
    } catch (e: any) {
      setError(e.message || "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 md:p-10">
      <style>{`
        @font-face { font-family: 'Avenir Next'; src: local('Avenir Next'), local('AvenirNext-DemiBold'); font-weight: 600; font-style: normal; }
        .brand-title { font-family: 'Avenir Next', Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif; }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-8 text-center">
        <header className="relative flex items-center justify-center">
          <h1 className="brand-title text-center text-3xl md:text-5xl font-semibold tracking-tight">почувствуй медиа</h1>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:block">
            <video
              src={assetsBase + "/Логовидео.webm"}
              autoPlay
              loop
              muted
              playsInline
              className="w-24 h-24 object-contain"
            />
          </div>
        </header>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            onFile(f || null);
          }}
          className="cursor-pointer rounded-3xl border-2 border-dashed border-gray-300 p-10 md:p-16 bg-gray-50 text-center hover:border-blue-500 hover:bg-blue-50 transition"
        >
          <div className="flex flex-col items-center gap-4">
            <img src={assetsBase + "/ЛОГО.png"} alt="Логотип" className="w-16 h-16 object-contain opacity-90" />
            <div className="text-xl md:text-2xl font-medium">Загрузите фотографию</div>
            <div className="text-sm text-gray-600">Ваша фотография · поддерживаются JPG, PNG, WEBP, HEIC</div>
            {file && (
              <div className="text-xs text-gray-500">Вы выбрали: <b>{file.name}</b></div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="space-y-3">
          <div className="font-bold text-lg text-center">Выберите героя 👉</div>
          <div className="grid md:grid-cols-3 gap-4 justify-center">
            {ROLES.map((r) => (
              <motion.button
                key={r.id}
                whileHover={{ scale: file ? 1.02 : 1.0 }}
                onClick={() => file && setRole(r.id)}
                className={`rounded-2xl border p-5 text-center shadow-sm transition ${
                  role === r.id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
                } ${!file ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}`}
              >
                <div className="text-lg font-medium">{r.title}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || !file || !role}
            className="px-6 py-3 rounded-2xl bg-blue-600 text-white disabled:opacity-50"
          >
            {loading ? "Генерация…" : "Сгенерировать образ"}
          </button>
          {result && (
            <a
              download={`image-${role}.png`}
              href={`data:image/png;base64,${result}`}
              className="px-5 py-3 rounded-2xl border"
            >Скачать PNG</a>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        {result && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">Результат</div>
            <img
              src={`data:image/png;base64,${result}`}
              alt="Результат"
              className="w-full max-w-3xl rounded-2xl border mx-auto"
            />
          </div>
        )}

        <footer className="text-xs text-gray-500 space-y-1 text-center">
          <div className="text-sm text-gray-800">факультет журналистики МГУ</div>
          <div className="text-sm text-gray-800">с любовью КМ</div>
        </footer>
      </div>
    </div>
  );
}

async function applyClientWatermark(srcDataUrl: string, logoUrl: string): Promise<string | null> {
  try {
    const [img, logo] = await Promise.all([loadImage(srcDataUrl), loadImage(logoUrl)]);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const targetW = Math.round(canvas.width * 0.12);
    const ratio = (logo.width || 1) / (logo.height || 1);
    const targetH = Math.round(targetW / ratio);
    const x = Math.round((canvas.width - targetW) / 2);
    const y = Math.round(canvas.height - targetH - canvas.height * 0.03);
    ctx.globalAlpha = 0.92;
    ctx.drawImage(logo, x, y, targetW, targetH);
    ctx.globalAlpha = 1;
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
}
