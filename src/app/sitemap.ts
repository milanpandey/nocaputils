import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blogPosts";
import { ALL_TOOLS, CATEGORIES } from "@/lib/toolRegistry";

export const dynamic = "force-static";

const BASE_URL = "https://nocaputils.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const coreRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${BASE_URL}${cat.href}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const seenHrefs = new Set<string>();
  const toolRoutes: MetadataRoute.Sitemap = ALL_TOOLS.filter(
    (tool) => tool.status === "Live" && !seenHrefs.has(tool.href) && Boolean(seenHrefs.add(tool.href))
  ).map((tool) => ({
    url: `${BASE_URL}${tool.href}`,
    lastModified: now,
    changeFrequency: tool.href === "/pii-shield" || tool.href === "/online-video-editor" ? "weekly" : "monthly",
    priority: tool.href === "/pii-shield" ? 0.95 : tool.href === "/online-video-editor" ? 0.9 : 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...coreRoutes, ...categoryRoutes, ...toolRoutes, ...blogRoutes];
}
