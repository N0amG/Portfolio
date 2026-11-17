import { ImageResponse } from "next/og";

// Image de partage (WhatsApp, LinkedIn, Facebook, X…) générée au build, aux couleurs du site.
export const alt = "Noam Guez, développeur web freelance à Lyon : création de sites internet pour commerçants";
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
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#001219",
          color: "#faf5e8",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#94d2bd" }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#ee9b00" }} />
          noam-guez.com
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: -2 }}>Développeur web freelance</div>
          <div style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: -2, color: "#ee9b00", fontStyle: "italic" }}>à Lyon</div>
          <div style={{ marginTop: 28, fontSize: 34, color: "#e9d8a6", maxWidth: 900 }}>
            Création de sites internet pour restaurants, commerçants et artisans.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#94d2bd" }}>
          <span>Noam Guez</span>
          <span>Sites vitrines · Réservation en ligne · Applications web</span>
        </div>
      </div>
    ),
    size,
  );
}
