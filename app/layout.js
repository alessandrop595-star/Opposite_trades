import "./globals.css";

export const metadata = {
  title: "Opposite Trades Studio",
  description: "AI Content Engine & Cloud Memory for @opposite_trades",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#07070c" />
      </head>
      <body>{children}</body>
    </html>
  );
}
