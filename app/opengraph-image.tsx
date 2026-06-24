import { ImageResponse } from "next/og";

export const alt = "Ozance — La plateforme qui pilote votre cabinet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0B1220",
          color: "#F5F5F4",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 9999,
              background: "#D9B27A",
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>
            Ozance
          </div>
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 900,
            color: "#D9B27A",
          }}
        >
          La plateforme qui pilote votre cabinet.
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#9aa6b8",
            marginTop: 28,
            maxWidth: 820,
          }}
        >
          Dossiers, agenda, temps, facturation — réunis pour les avocats.
        </div>
      </div>
    ),
    { ...size },
  );
}
