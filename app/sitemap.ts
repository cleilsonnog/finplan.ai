import { MetadataRoute } from "next";
import { SITE_URL } from "./_lib/site";
import { GUIDES } from "./guias/_content/guides";
import { LEGAL } from "./_lib/legal";

// Only public pages: the app itself redirects visitors to the landing page
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/guias`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/privacidade`, lastModified: new Date(`${LEGAL.updated}T12:00:00`), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/termos`, lastModified: new Date(`${LEGAL.updated}T12:00:00`), changeFrequency: "yearly", priority: 0.3 },
    ...GUIDES.map((g) => ({
      url: `${SITE_URL}/guias/${g.slug}`,
      lastModified: new Date(`${g.updated}T12:00:00`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
