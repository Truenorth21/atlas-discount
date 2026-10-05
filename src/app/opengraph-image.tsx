import { ImageResponse } from "next/og";

export const alt = "Atlas Discount — Florida Wholesale Marketplace";
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
          background: "linear-gradient(135deg, #10194A 0%, #0A63B0 140%)",
          color: "#ffffff",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 20,
              background: "#ffffff",
              color: "#10194A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 62,
              fontWeight: 900
            }}
          >
            A
          </div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 900, letterSpacing: -1 }}>
            <span>Atlas&nbsp;</span>
            <span style={{ color: "#7Fc2ff" }}>Discount</span>
          </div>
        </div>
        <div style={{ marginTop: 40, fontSize: 60, fontWeight: 900, lineHeight: 1.05, maxWidth: 900 }}>
          Buy wholesale products for your store — online.
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#c7dbff", maxWidth: 860 }}>
          A members-only wholesale marketplace for verified Florida businesses. Case & pallet pricing, pickup or delivery.
        </div>
      </div>
    ),
    size
  );
}
