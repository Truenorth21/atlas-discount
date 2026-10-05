import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.atlasdiscount.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1 },
    { path: "/catalog", priority: 0.9 },
    { path: "/sell", priority: 0.7 },
    { path: "/playbooks", priority: 0.5 },
    { path: "/register/buyer", priority: 0.7 },
    { path: "/register/supplier", priority: 0.6 },
    { path: "/register/route-seller", priority: 0.5 },
    { path: "/login", priority: 0.4 },
    { path: "/terms", priority: 0.3 },
    { path: "/privacy", priority: 0.3 }
  ];
  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route.priority
  }));
}
