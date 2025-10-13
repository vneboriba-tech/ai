export const metadata = {
  title: "почувствуй медиа",
  description: "Мини-сайт: Журналист / Блоггер / Фотограф",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
      <body>{children}</body>
    </html>
  );
}
