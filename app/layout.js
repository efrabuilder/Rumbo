import "./globals.css";

export const metadata = {
  title: "Rumbo — clima y moneda para tu viaje",
  description: "Consulta el clima de tu destino y convierte tu dinero a la moneda local.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="font-sans bg-canvas text-ink">
        {children}
        <footer className="text-center text-xs text-ink/60 py-4">
          © 2026 All rights reserved · Designed &amp; built by Efraín Sebastián Rojas Artavia
        </footer>
      </body>
    </html>
  );
}
