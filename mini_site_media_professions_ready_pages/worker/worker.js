// worker/worker.js — Cloudflare Worker для /api/generate
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        const form = await request.formData();
        const role = String(form.get("role") || "journalist");
        const file = form.get("image");
        if (!file || typeof file === "string") {
          return json({ error: "NO_FILE" }, 400, request);
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const b64 = btoa(binary);
        const mimeType = (file.type || "image/png").toLowerCase();

        const ROLE_PROMPTS = {
          journalist:
            "Сохрани личность. Российская медиасреда: редакция/пресс-зона, бейдж 'Пресса' (кириллица), микрофон без логотипов. Портрет по грудь, деловой casual. Нейтральный свет.",
          blogger:
            "Сохрани личность. Российская реальность: домашняя студия, кольцевая лампа, смартфон на штативе, стиль smart-casual. Мягкий свет, немного глянца, без брендов.",
          photographer:
            "Сохрани личность. Российская уличная/бекстейдж-сцена: на плече камера без логотипов, ремень камеры, естественный свет, честная фактура кожи. Портрет по грудь.",
        };

        const base = ROLE_PROMPTS[role] || ROLE_PROMPTS.journalist;
        const diversity = Math.random().toString(36).slice(2, 8);
        const userPrompt =
          `${base} Сохраняй одинаковую композицию (портрет по грудь), ` +
          `но делай уникальные микровариации фона и света. Вариант №${diversity}.`;

        const systemGuard =
          "Ты — фоторедактор. Измени входное фото, сохранив личность и биометрию. " +
          "Не добавляй логотипы, бренды, политические символы и текстовые водяные знаки. " +
          "Российский контекст и надписи — только кириллицей.";

        const model = "gemini-2.5-flash-image";
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

        const payload = {
          contents: [
            { role: "user", parts: [{ text: systemGuard }, { text: userPrompt }] },
            { role: "user", parts: [{ inlineData: { data: b64, mimeType } }] },
          ],
          generationConfig: { responseMimeType: "image/png", temperature: 0.55 },
        };

        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await r.json();
        const imgPart = data?.candidates?.[0]?.content?.parts?.find?.(p => p?.inlineData?.data);
        if (!imgPart) {
          const maybeText = data?.candidates?.[0]?.content?.parts
            ?.map?.(p => p?.text)
            ?.filter(Boolean)
            ?.join("\n");
          return json({ error: "NO_IMAGE", details: maybeText || "Модель не вернула картинку" }, 500, request);
        }

        return json({ imageBase64: imgPart.inlineData.data }, 200, request);
      } catch (e) {
        return json({ error: String(e) }, 500, request);
      }
    }

    if (url.pathname === "/") return new Response("OK");
    return new Response("Not Found", { status: 404 });
  },
};

function json(obj, status = 200, request) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
