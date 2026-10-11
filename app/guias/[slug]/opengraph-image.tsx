import { ImageResponse } from "next/og";
import { OG_COLORS, OG_SIZE, OgLogo, ogFonts } from "@/app/_lib/og";
import { GUIDES } from "@/app/guias/_content/guides";

export const alt = "Guia FinPlan.ai";
export const size = OG_SIZE;
export const contentType = "image/png";

export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

const Image = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  const title = guide?.title ?? "Guias de finanças pessoais";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: `radial-gradient(circle at 90% 10%, #14301a 0%, ${OG_COLORS.background} 50%)`,
          color: OG_COLORS.foreground,
        }}
      >
        <OgLogo size={0.9} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              fontSize: 22,
              fontWeight: 700,
              padding: "6px 16px",
              borderRadius: 999,
              color: OG_COLORS.primary,
              border: `1px solid ${OG_COLORS.primary}`,
            }}
          >
            Guia
          </div>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 70 ? 54 : 62,
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: -1.5,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: OG_COLORS.muted }}>
          Controle financeiro com importação de extrato, cartão e WhatsApp
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
};

export default Image;
