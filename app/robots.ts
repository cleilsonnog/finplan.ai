import { MetadataRoute } from "next";
import { SITE_URL } from "./_lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // App pages require login — nothing there for crawlers
      disallow: ["/api/", "/login", "/transactions", "/credit-cards", "/budget", "/recurring", "/import", "/settings", "/shopping-list", "/subscription"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
