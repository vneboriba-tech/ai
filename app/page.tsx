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

  // адрес API (Cloudflare Worker)
  const apiBase = (process?.env?.NEXT_PUBLIC_API_BASE as string) || "";

  const onFile = useCallback((f: File | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  async function handleGenerate() {
    if (!file) { setError("Загрузите Вашу фотографию (JPG/PNG/WEBP/HEIC)"); return; }
    if (!role) { setError("Выберите героя: журналист / блоггер / фотограф"); return; }
    if (!apiBase) { setError("API не настроено (NEXT_PUBLIC_API_BASE)."); return; }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("role", role);

      const res = await fetch(`${apiBase}/api/generate`, { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("UnsupportedHttpVerb") || text.includes("<Error>")) {
          throw new Error("Хостинг API не принимает POST. Проверьте URL в NEXT_PUBLIC_API_BASE.");
        }
        throw new Error(text || "Ошибка ответа API");
      }
      const data = await res.json();
      const stamped = await applyClientWatermark(
        `data:image/png;base64,${data.imageBase64}`,
        `/logo.png`
      );
      const finalDataUrl = stamped || `data:image/png;base64,${data.imageBase64}`;
      setResult(finalDataUrl.replace(/^data:image\/png;base64,/, ""));
      try { window.open(finalDataUrl, "_blank"); } catch {}
    } catch (e: any) {
      setError(e?.message || "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <style>{`
        :root { --bg:#ffffff; --fg:#111827; --muted:#6b7280; --brand:#1d4ed8; --border:#e5e7eb; }
        * { box-sizing: border-box; }
        body { margin:0; background:var(--bg); color:var(--fg); }
        .brand-title { font-family: 'Avenir Next', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .container { max-width: 1040px; margin: 0 auto; padding: 24px 20px 48px; }
        header { display:flex; align-items:center; justify-content:center; position:relative; padding: 8px 0 24px; }
        .tiny-logo { position:absolute; left:0; top:50%; transform: translateY(-50%); width:48px; height:48px; object-fit:contain; opacity:.95; }
        .title { font-size: clamp(28px, 4vw, 48px); font-weight:600; letter-spacing:-0.02em; margin:0; text-align:center; }
        .video-logo { position:absolute; right:0; top:50%; transform: translateY(-50%); width:96px; height:96px; object-fit:contain; display:none; }
        @media (min-width: 900px) { .video-logo { display:block; } }

        .uploader { border:2px dashed var(--border); background:#f9fafb; border-radius:24px; padding:40px 24px; text-align:center; transition: .2s ease; }
        .uploader:hover { border-color:#93c5fd; background:#f0f9ff; }
        .uploader .logo { width:64px; height:64px; object-fit:contain; opacity:.9; margin:0 auto 12px; display:block; }
        .uploader .headline { font-size: clamp(18px, 2.4vw, 22px); font-weight:600; }
        .uploader .sub { font-size:14px; color: var(--muted); margin-top:6px; }
        .uploader .picked { margin-top:8px; font-size:12px; color:#6b7280; }

        .roles { margin-top:22px; }
        .roles-title { text-align:center; font-weight:800; font-size:18px; }
        .roles-grid { display:grid; grid-template-columns: 1fr; gap:12px; margin-top:10px; }
        @media (min-width: 820px) { .roles-grid { grid-template-columns: repeat(3, 1fr); } }
        .role { border:1px solid var(--border); border-radius:16px; padding:18px; background:white; cursor:pointer; transition:.15s; }
        .role:hover { box-shadow: 0 6px 18px rgba(0,0,0,.06); }
        .role.active { border-color:#3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,.2); }
        .role:disabled { opacity:.55; cursor:not-allowed; }

        .actions { margin-top:18px; display:flex; flex-direction:column; align-items:center; gap:12px; }
        .btn { appearance:none; border:0; border-radius:14px; padding:12px 18px; background:#2563eb; color:#fff; font-weight:600; cursor:pointer; }
        .btn:disabled { opacity:.55; cursor:not-allowed; }
        .link { display:inline-block; border:1px solid var(--border); border-radius:14px; padding:10px 16px; text-decoration:none; color:inherit; }

        .result { margin-top:18px; text-align:center; }
        .result img { width:100%; max-width:860px; border-radius:18px; border:1px solid var(--border); }

        footer { margin-top:24px; text-align:center; color:#111827; font-size:14px; }
      `}</style>

      <div className="container">
        <header>
          <img className="tiny-logo" src="/logo.png" alt="Логотип" />
          <h1 className="brand-title title">почувствуй медиа</h1>
          <video className="video-logo" src="/logo-video.webm" autoPlay loop muted playsInline />
        </header>

        <div
          className="uploader"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; onFile(f || null); }}
        >
          <img className="logo" src="/logo.png" alt="Логотип" />
          <div className="headline">Загрузите фотографию</div>
          <div className="sub">Ваша фотография · поддерживаются JPG, PNG, WEBP, HEIC</div>
          {file && <div className="picked">Вы выбрали: <b>{file.name}</b></div>}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
            style={{ display: "none" }}
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
        </div>

        <section className="roles">
          <div className="roles-title">Выберите героя 👉</div>
          <div className="roles-grid">
            {ROLES.map((r) => (
              <motion.button
                key={r.id}
                whileHover={{ scale: file ? 1.02 : 1 }}
                onClick={() => file && setRole(r.id)}
                className={`role ${role === r.id ? "active" : ""}`}
                disabled={!file}
              >
                <div style={{ fontSize: 16, fontWeight: 600 }}>{r.title}</div>
              </motion.button>
            ))}
          </div>
        </section>

        <div className="actions">
          <button className="btn" onClick={handleGenerate} disabled={loading || !file || !role}>
            {loading ? "Генерация…" : "Сгенерировать образ"}
          </button>

          {result && (
            <a className="link" download={`image-${role}.png`} href={`data:image/png;base64,${result}`}>
              Скачать PNG
            </a>
          )}

          {error && <div style={{ fontSize: 14, color: "#dc2626" }}>{error}</div>}
        </div>

        {result && (
          <div className="result">
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Результат</div>
            <img src={`data:image/png;base64,${result}`} alt="Результат" />
          </div>
        )}

        <footer>
          <div>факультет журналистики МГУ</div>
          <div>с любовью КМ</div>
        </footer>
      </div>
    </div>
  );
}

// === helpers ===
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
