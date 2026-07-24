import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  generateBlogPost,
  generateRedditPost,
  generateFacebookPost,
  generateG2Response,
} from "@/lib/content-gen"

/**
 * Vercel Cron Job: generates 1 SEO blog + 1 Reddit + 1 Facebook + 1 G2 response daily
 * Triggered by vercel.json cron config
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const results = {
      blog: null as any,
      reddit: null as any,
      facebook: null as any,
      g2: null as any,
      errors: [] as string[],
    }

    // 1. SEO Blog Post
    const blog = await generateBlogPost()
    if (blog) {
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
        results.errors.push(`Blog insert failed: ${error.message}`)
      } else {
        results.blog = { title: blog.title, slug: blog.slug }
      }
    } else {
      results.errors.push("Blog generation returned null")
    }

    // 2. Reddit Post
    const reddit = await generateRedditPost()
    if (reddit) {
      const { error } = await supabase.from("social_posts").insert({
        platform: reddit.platform,
        subreddit: reddit.subreddit,
        title: reddit.title,
        content: reddit.content,
        target_keyword: reddit.target_keyword,
      })
      if (error) results.errors.push(`Reddit insert failed: ${error.message}`)
      else results.reddit = { title: reddit.title, subreddit: reddit.subreddit }
    }

    // 3. Facebook Post
    const facebook = await generateFacebookPost()
    if (facebook) {
      const { error } = await supabase.from("social_posts").insert({
        platform: facebook.platform,
        title: facebook.title,
        content: facebook.content,
        target_keyword: facebook.target_keyword,
      })
      if (error) results.errors.push(`Facebook insert failed: ${error.message}`)
      else results.facebook = { content: facebook.content.slice(0, 50) + "..." }
    }

    // 4. G2 Response Template
    const g2 = await generateG2Response()
    if (g2) {
      const { error } = await supabase.from("social_posts").insert({
        platform: g2.platform,
        title: g2.title,
        content: g2.content,
        target_keyword: g2.target_keyword,
      })
      if (error) results.errors.push(`G2 insert failed: ${error.message}`)
      else results.g2 = { content: g2.content.slice(0, 50) + "..." }
    }

    return NextResponse.json(results)
  } catch (err: any) {
    console.error("Content generator cron error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}