import { ImageResponse } from "next/og";
import {
  OG_COLORS,
  OG_HEADLINE,
  OG_SIZE,
  OgFeatures,
  OgLogo,
  OgProjectionCard,
  ogBackground,
  ogFonts,
} from "./_lib/og";

export const alt = `FinPlan.ai — ${OG_HEADLINE}`;
export const size = OG_SIZE;
export const contentType = "image/png";

const Image = async () =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 48,
          padding: "0 64px",
          background: ogBackground(),
          color: OG_COLORS.foreground,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 28 }}>
          <OgLogo />
          <div style={{ display: "flex", fontSize: 58, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 }}>
            {OG_HEADLINE}
          </div>
          <OgFeatures />
        </div>
        <OgProjectionCard />
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );

export default Image;
