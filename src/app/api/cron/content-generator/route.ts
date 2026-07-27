import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import {
  generateBlogPost,
  generateRedditPost,
  generateFacebookPost,
  generateG2Response,
} from "@/lib/content-gen"

type ContentType = "blog" | "reddit" | "facebook" | "g2"

/**
 * Vercel Cron Job: generates 1 piece of content per call
 * Split into 4 separate cron schedules to stay under Vercel Hobby 10s limit
 * Triggered by vercel.json cron config with ?type=blog|reddit|facebook|g2
 */
export async function GET(request: NextRequest) {
  // Force CRON_SECRET verification — reject if not configured
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const type = (searchParams.get("type") || "blog") as ContentType

  try {
    const supabase = await createServiceClient()

    switch (type) {
      case "blog": {
        const blog = await generateBlogPost()
        if (!blog) {
          return NextResponse.json({ error: "Blog generation returned null" }, { status: 500 })
        }
        const { error } = await supabase.from("blog_posts").insert({
          slug: blog.slug,
          title: blog.title,
          excerpt: blog.excerpt,
          content: blog.content,
          keywords: blog.keywords,
          meta_description: blog.meta_description,
          status: "published",
          reading_time_minutes: Math.ceil(blog.content.length / 1500),
        })
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ type: "blog", title: blog.title, slug: blog.slug })
      }

      case "reddit": {
        const reddit = await generateRedditPost()
        if (!reddit) {
          return NextResponse.json({ error: "Reddit generation returned null" }, { status: 500 })
        }
        const { error } = await supabase.from("social_posts").insert({
          platform: reddit.platform,
          subreddit: reddit.subreddit,
          title: reddit.title,
          content: reddit.content,
          target_keyword: reddit.target_keyword,
        })
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ type: "reddit", title: reddit.title, subreddit: reddit.subreddit })
      }

      case "facebook": {
        const facebook = await generateFacebookPost()
        if (!facebook) {
          return NextResponse.json({ error: "Facebook generation returned null" }, { status: 500 })
        }
        const { error } = await supabase.from("social_posts").insert({
          platform: facebook.platform,
          title: facebook.title,
          content: facebook.content,
          target_keyword: facebook.target_keyword,
        })
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ type: "facebook", content: facebook.content.slice(0, 50) + "..." })
      }

      case "g2": {
        const g2 = await generateG2Response()
        if (!g2) {
          return NextResponse.json({ error: "G2 generation returned null" }, { status: 500 })
        }
        const { error } = await supabase.from("social_posts").insert({
          platform: g2.platform,
          title: g2.title,
          content: g2.content,
          target_keyword: g2.target_keyword,
        })
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ type: "g2", content: g2.content.slice(0, 50) + "..." })
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error(`Content generator [${type}] cron error:`, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
