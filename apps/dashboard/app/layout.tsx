import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AicoreLink",
  description: "Plataforma agentica multicanal de Aicore Agency",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
