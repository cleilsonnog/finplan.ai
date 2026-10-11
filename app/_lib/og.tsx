// Shared pieces for the generated brand images: Open Graph (app/opengraph-image.tsx, guides) and
// the social media formats (app/social/[format]). Drawn in code, like the landing previews, so
// they never go stale like screenshots.
// next/og renders a subset of CSS: flexbox only, every element with children needs display:flex.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

// next/og's built-in font has no bold; ship both weights (read at build time, images are static)
export const ogFonts = async () => {
  const dir = join(process.cwd(), "app/_lib/fonts");
  const [regular, bold] = await Promise.all([
    readFile(join(dir, "NotoSans-Regular.ttf")),
    readFile(join(dir, "NotoSans-Bold.ttf")),
  ]);
  return [
    { name: "Noto Sans", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Noto Sans", data: bold, weight: 700 as const, style: "normal" as const },
  ];
};

// Dark theme values from globals.css (--background, --primary, --viz-*)
export const OG_COLORS = {
  background: "#0c0a09",
  card: "#1c1917",
  border: "#292524",
  foreground: "#fafafa",
  muted: "#a8a29e",
  primary: "#4cb22e",
  income: "#199e70",
  expense: "#e66767",
};

export const ogBackground = (glowAt = "85% 20%") =>
  `radial-gradient(circle at ${glowAt}, #14301a 0%, ${OG_COLORS.background} 55%)`;

export const OG_HEADLINE = "Saiba hoje se vai sobrar dinheiro no fim do mês";
export const OG_FEATURES = ["Importa extrato e fatura", "Cartão por fatura", "Lançamentos pelo WhatsApp"];

// Example data, same as the landing's projection preview
const PROJECTION = [
  { label: "Nov", value: 1240 },
  { label: "Dez", value: 860 },
  { label: "Jan", value: -320 },
  { label: "Fev", value: 410 },
  { label: "Mar", value: 980 },
  { label: "Abr", value: 1350 },
];

export const OgLogo = ({ size = 1 }: { size?: number }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14 * size }}>
    <svg width={56 * size} height={56 * size} viewBox="0 0 60 60">
      <path d="M10 30 L30 12 L50 30 V50 H10 Z" stroke={OG_COLORS.primary} strokeWidth="3.5" fill="none" />
      <rect x="18" y="35" width="5" height="10" fill={OG_COLORS.primary} />
      <rect x="26" y="30" width="5" height="15" fill={OG_COLORS.primary} />
      <rect x="34" y="25" width="5" height="20" fill={OG_COLORS.primary} />
    </svg>
    <div style={{ display: "flex", fontSize: 40 * size, fontWeight: 700, letterSpacing: -1 }}>
      <span style={{ color: OG_COLORS.foreground }}>finplan</span>
      <span style={{ color: OG_COLORS.primary }}>.ai</span>
    </div>
  </div>
);

export const OgFeatures = ({ size = 1 }: { size?: number }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 * size }}>
    {OG_FEATURES.map((f) => (
      <div
        key={f}
        style={{
          display: "flex",
          fontSize: 22 * size,
          padding: `${8 * size}px ${16 * size}px`,
          borderRadius: 999,
          border: `1px solid ${OG_COLORS.border}`,
          background: OG_COLORS.card,
          color: OG_COLORS.muted,
        }}
      >
        {f}
      </div>
    ))}
  </div>
);

/**
 * "Previsão dos próximos 6 meses" card. `scale` sizes text and spacing, `barArea` is the chart
 * height above zero — kept apart so tall formats don't get a card taller than the canvas.
 */
export const OgProjectionCard = ({
  width = 440,
  scale: s = 1,
  barArea = 150,
}: {
  width?: number;
  scale?: number;
  barArea?: number;
}) => {
  const max = Math.max(...PROJECTION.map((p) => Math.abs(p.value)));
  const belowArea = barArea / 3;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        padding: 28 * s,
        borderRadius: 24 * s,
        border: `1px solid ${OG_COLORS.border}`,
        background: OG_COLORS.card,
        boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", fontSize: 22 * s, fontWeight: 700 }}>Previsão dos próximos 6 meses</div>
      <div style={{ display: "flex", fontSize: 17 * s, color: OG_COLORS.muted, marginTop: 4 * s }}>
        Saldo previsto com faturas e contas fixas
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 * s, marginTop: 24 * s }}>
        {PROJECTION.map((p) => {
          const h = Math.max(6 * s, (Math.abs(p.value) / max) * barArea);
          const positive = p.value >= 0;
          return (
            <div key={p.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "flex-end", height: barArea, width: "100%" }}>
                {positive && (
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: h,
                      borderRadius: `${6 * s}px ${6 * s}px 0 0`,
                      background: OG_COLORS.income,
                    }}
                  />
                )}
              </div>
              <div style={{ display: "flex", width: "100%", height: 2, background: OG_COLORS.border }} />
              <div style={{ display: "flex", alignItems: "flex-start", height: belowArea, width: "100%" }}>
                {!positive && (
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: Math.min(h, belowArea),
                      borderRadius: `0 0 ${6 * s}px ${6 * s}px`,
                      background: OG_COLORS.expense,
                    }}
                  />
                )}
              </div>
              <div style={{ display: "flex", fontSize: 16 * s, color: OG_COLORS.muted, marginTop: 6 * s }}>
                {p.label}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 18 * s,
          padding: `${12 * s}px ${14 * s}px`,
          borderRadius: 12 * s,
          background: "rgba(230,103,103,0.12)",
          fontSize: 18 * s,
        }}
      >
        <span style={{ color: OG_COLORS.muted }}>Atenção em janeiro</span>
        <span style={{ color: OG_COLORS.expense, fontWeight: 700 }}>−R$ 320</span>
      </div>
    </div>
  );
};
