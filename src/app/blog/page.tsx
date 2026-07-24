import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowRight, Sparkles, PawPrint } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

async function getBlogPosts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, keywords, reading_time_minutes, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50)
  return data || []
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <PawPrint className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg">GroomingPro</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
          <Sparkles className="h-3 w-3" /> AI-curated insights
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Pet Grooming Tips & Guides
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Actionable advice to help your salon grow — written for groomers, by AI trained on real salon workflows.
        </p>
      </section>

      {/* Posts Grid */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary/50" />
            <p className="font-medium">No blog posts yet</p>
            <p className="text-sm mt-1">Check back soon — fresh content daily.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.keywords?.slice(0, 2).map((kw: string) => (
                        <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                    <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time_minutes} min
                        </span>
                      </div>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export const metadata = {
  title: "Pet Grooming Tips, Guides & AI Insights | GroomingPro",
  description: "Actionable advice to help pet grooming salon owners grow revenue, retain customers, and run their business smarter.",
}