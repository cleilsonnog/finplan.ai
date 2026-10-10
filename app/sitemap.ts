import { MetadataRoute } from "next";
import { SITE_URL } from "./_lib/site";

// Only public pages: everything else redirects visitors to the landing page
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
