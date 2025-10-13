# Почувствуй медиа — GitHub Pages

## Что внутри
- `app/page.tsx` — фронтенд
- `public/` — положите сюда **ЛОГО.png** и **Логовидео.webm**
- `next.config.js` — конфиг для Pages (basePath/assetPrefix ставятся автоматически)
- `.github/workflows/deploy.yml` — авто-деплой на GitHub Pages
- `worker/worker.js` — код Cloudflare Worker (API)

## Как запустить на GitHub Pages
1. Создайте Cloudflare Worker, вставьте код из `worker/worker.js`, добавьте секрет GEMINI_API_KEY. Возьмите URL вида `https://имя.workers.dev`.
2. Откройте `.github/workflows/deploy.yml` и замените `https://YOUR-WORKER.workers.dev` на ваш URL.
3. Загрузите в `public/` файлы `ЛОГО.png` и `Логовидео.webm`.
4. Сделайте commit в `main` — GitHub Action соберёт и выложит сайт на Pages.
5. Адрес сайта: `https://USERNAME.github.io/REPO`.

