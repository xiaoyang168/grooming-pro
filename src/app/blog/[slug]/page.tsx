import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowLeft, PawPrint } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

async function getBlogPost(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()
  return data
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <PawPrint className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg">GroomingPro</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-1" /> All posts
            </Link>
          </Button>
        </div>
      </header>

      {/* Article */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {/* Keywords */}
        {post.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.keywords.map((kw: string) => (
              <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-6 mb-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.published_at).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {post.reading_time_minutes} min read
          </span>
        </div>

        {/* Content (markdown rendered as HTML, simple version) */}
        <div
          className="prose prose-lg max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-4
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-ul:my-4 prose-li:my-1
            prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        {/* CTA */}
        <div className="mt-16 p-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-amber-400/5 to-primary/5 text-center">
          <h3 className="text-2xl font-bold">Ready to grow your grooming business?</h3>
          <p className="mt-2 text-muted-foreground">
            GroomingPro is a free AI-powered salon management platform — appointment scheduling, automated reminders, before/after photos, smart analytics.
          </p>
          <Button variant="gradient" size="lg" className="mt-4" asChild>
            <Link href="/login">Try GroomingPro Free →</Link>
          </Button>
        </div>
      </article>
    </div>
  )
}

// Simple markdown → HTML (handles ## / ### / **bold** / paragraphs / lists)
// Not full-featured but enough for AI-generated content
function renderMarkdown(md: string): string {
  let html = md
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>")
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>")
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>")

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>")

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>")
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")

  // Paragraphs
  html = html.split(/\n\n+/).map((para) => {
    if (para.startsWith("<h") || para.startsWith("<ul>") || para.startsWith("<li>")) {
      return para
    }
    return `<p>${para.replace(/\n/g, "<br/>")}</p>`
  }).join("\n")

  return html
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) return { title: "Post not found" }
  return {
    title: `${post.title} | GroomingPro Blog`,
    description: post.meta_description || post.excerpt,
    keywords: post.keywords?.join(", "),
  }
}