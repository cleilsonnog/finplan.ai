import { ImageResponse } from "next/og";
import {
  OG_COLORS,
  OG_HEADLINE,
  OgFeatures,
  OgLogo,
  OgProjectionCard,
  ogBackground,
  ogFonts,
} from "@/app/_lib/og";
import { SITE_URL } from "@/app/_lib/site";

// Brand images for social media posts (/social/feed, /social/story). Not linked anywhere:
// open, save the PNG and post. Same pieces as the Open Graph image.
const FORMATS = {
  // Instagram/Facebook feed (4:5)
  feed: { width: 1080, height: 1350, padding: "80px 80px", headline: 76, scale: 1.25, card: 1.4, bars: 170 },
  // Stories/Reels (9:16) — top and bottom ~250px stay clear of the app's own UI
  story: { width: 1080, height: 1920, padding: "250px 80px 240px", headline: 92, scale: 1.4, card: 1.6, bars: 210 },
};

type Format = keyof typeof FORMATS;

export const generateStaticParams = () => Object.keys(FORMATS).map((format) => ({ format }));

export const GET = async (_req: Request, { params }: { params: Promise<{ format: string }> }) => {
  const { format } = await params;
  if (!(format in FORMATS)) return new Response("Formato inválido: use feed ou story", { status: 404 });
  const f = FORMATS[format as Format];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: f.padding,
          background: ogBackground("90% 8%"),
          color: OG_COLORS.foreground,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <OgLogo size={f.scale} />
          <div style={{ display: "flex", fontSize: f.headline, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>
            {OG_HEADLINE}
          </div>
          <OgFeatures size={f.scale} />
        </div>
        <OgProjectionCard width={920} scale={f.card} barArea={f.bars} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: OG_COLORS.primary }}>
            Comece grátis
          </div>
          <div style={{ display: "flex", fontSize: 28, color: OG_COLORS.muted }}>
            {SITE_URL.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    { width: f.width, height: f.height, fonts: await ogFonts() },
  );
};
