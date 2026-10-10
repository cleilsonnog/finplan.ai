// Guides are plain data rendered by app/guias/[slug]/page.tsx — no markdown pipeline needed.
// Inline **bold** is supported in text.

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "tip"; title: string; text: string }
  /** Call to action pointing to the app feature that solves what the section describes */
  | { type: "cta"; title: string; text: string };

export interface Guide {
  slug: string;
  title: string;
  /** Meta description (~150 chars) */
  description: string;
  /** Short line under the title on the index */
  excerpt: string;
  keywords: string[];
  published: string; // YYYY-MM-DD
  updated: string; // YYYY-MM-DD
  readingMinutes: number;
  blocks: GuideBlock[];
}
