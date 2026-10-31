import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_URL } from "@/lib/marketing/site";

/**
 * Social share card (1200x630), generated with next/og instead of shipping a
 * binary asset so a copy change re-renders it at build time.
 *
 * Deliberate constraints:
 * - Only accent-free Spanish is used here. ImageResponse ships a single Latin
 *   subset font and we do not add a network font fetch, so accented glyphs are
 *   the one thing that could render as tofu.
 * - Everything is an inline-styled div: satori has no CSS engine and supports no
 *   Tailwind classes.
 * - No `runtime = "edge"`: Next 16 resolves next/og's bundled font and wasm
 *   platform-safely on Node, so the image is prerendered to a static PNG during
 *   the build (it used to need the edge runtime to sidestep a Windows-only
 *   `TypeError: Invalid URL` in Next 14).
 */

export const alt = "AicoreLink — sitios web con IA para negocios de servicios";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HOST = SITE_URL.replace(/^https?:\/\//, "");

const PILLS = [
  "Web que convierte",
  "WhatsApp que responde",
  "IA que agenda",
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#0F172A",
          backgroundImage:
            "linear-gradient(135deg, #0F172A 0%, #16264A 55%, #12495A 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              backgroundImage: "linear-gradient(135deg, #2563EB 0%, #0D9488 100%)",
              color: "#FFFFFF",
              fontSize: 34,
            }}
          >
            A
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 20,
              color: "#FFFFFF",
              fontSize: 34,
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              width: 200,
              height: 8,
              borderRadius: 999,
              marginBottom: 32,
              backgroundImage: "linear-gradient(90deg, #2563EB 0%, #5EEAD4 100%)",
            }}
          />
          <div
            style={{
              display: "flex",
              color: "#5EEAD4",
              fontSize: 26,
              letterSpacing: 4,
              marginBottom: 20,
            }}
          >
            SITIOS WEB CON IA PARA NEGOCIOS DE SERVICIOS
          </div>
          <div
            style={{
              display: "flex",
              color: "#FFFFFF",
              fontSize: 62,
              lineHeight: 1.12,
            }}
          >
            Tu negocio atiende y capta clientes las 24 horas
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {PILLS.map((pill) => (
            <div
              key={pill}
              style={{
                display: "flex",
                marginRight: 16,
                padding: "12px 26px",
                borderRadius: 999,
                border: "1px solid rgba(148, 163, 184, 0.4)",
                color: "#CBD5E1",
                fontSize: 24,
              }}
            >
              {pill}
            </div>
          ))}
          <div style={{ display: "flex", marginLeft: "auto", color: "#94A3B8", fontSize: 24 }}>
            {HOST}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
