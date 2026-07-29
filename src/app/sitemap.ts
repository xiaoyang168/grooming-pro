import { MetadataRoute } from "next"
import { createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.petsalonos.com"

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/refund`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  // Dynamic blog posts
  try {
    const supabase = createServiceClient()
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(200)

    if (error) {
      console.error("[sitemap] blog_posts query failed:", error.message)
      return staticPages
    }

    const blogPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))

    return [...staticPages, ...blogPages]
  } catch (err) {
    console.error("[sitemap] unexpected error:", err)
    return staticPages
  }
}
