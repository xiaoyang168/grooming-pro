"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink, Sparkles, MessageCircle, MessageSquare, Star, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SocialPost {
  id: string
  platform: "reddit" | "facebook" | "g2" | "twitter" | "linkedin"
  subreddit?: string
  title?: string
  content: string
  target_keyword?: string
  used: boolean
  created_at: string
}

const platformMeta: Record<string, { icon: any; label: string; color: string }> = {
  reddit: { icon: MessageCircle, label: "Reddit", color: "text-orange-600 bg-orange-100" },
  facebook: { icon: MessageSquare, label: "Facebook", color: "text-blue-600 bg-blue-100" },
  g2: { icon: Star, label: "G2 Review Response", color: "text-red-600 bg-red-100" },
  twitter: { icon: MessageCircle, label: "Twitter", color: "text-sky-600 bg-sky-100" },
  linkedin: { icon: MessageCircle, label: "LinkedIn", color: "text-indigo-600 bg-indigo-100" },
}

export default function MarketingPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    const supabase = createClient()
    const { data } = await supabase
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
    setPosts(data || [])
    setLoading(false)
  }

  async function copyPost(post: SocialPost) {
    const text = post.title ? `${post.title}\n\n${post.content}` : post.content
    await navigator.clipboard.writeText(text)
    setCopiedId(post.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function markUsed(post: SocialPost) {
    const supabase = createClient()
    await supabase
      .from("social_posts")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", post.id)
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, used: true } : p)))
  }

  function getRedirectUrl(post: SocialPost): string {
    if (post.platform === "reddit" && post.subreddit) {
      return `https://www.reddit.com/${post.subreddit}/submit`
    }
    if (post.platform === "facebook") {
      return "https://www.facebook.com/groups/feed/"
    }
    if (post.platform === "g2") {
      return "https://www.g2.com/search?utf8=%E2%9C%93&query=pet+grooming+software"
    }
    return "#"
  }

  const unusedCount = posts.filter((p) => !p.used).length
  const usedCount = posts.filter((p) => p.used).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketing Hub</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI-generated social posts ready to publish — save hours of marketing work daily.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Drafts Ready</p>
            <p className="text-2xl font-bold mt-1">{unusedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Posted</p>
            <p className="text-2xl font-bold mt-1">{usedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Auto-Generated</p>
            <p className="text-2xl font-bold mt-1">{posts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ready to Post
          </CardTitle>
          <CardDescription>
            Copy, paste, and post — AI drafts for Reddit, Facebook groups, and G2 review replies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading drafts...</p>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No drafts yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drafts are auto-generated daily. Check back tomorrow or trigger manually.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const meta = platformMeta[post.platform] || platformMeta.reddit
                const Icon = meta.icon
                return (
                  <div
                    key={post.id}
                    className={`rounded-xl border p-4 transition-all ${post.used ? "bg-muted/30 opacity-60" : "bg-card hover:shadow-md"}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{meta.label}</p>
                          {post.subreddit && (
                            <p className="text-xs text-muted-foreground">{post.subreddit}</p>
                          )}
                        </div>
                        {post.used && (
                          <Badge variant="secondary" className="text-xs">Used</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {post.title && (
                      <h4 className="font-semibold text-sm mb-2">{post.title}</h4>
                    )}
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap mb-3 leading-relaxed">
                      {post.content}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyPost(post)}>
                        {copiedId === post.id ? (
                          <>
                            <Check className="h-3 w-3 mr-1.5" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1.5" /> Copy
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={getRedirectUrl(post)} target="_blank" rel="noopener">
                          <ExternalLink className="h-3 w-3 mr-1.5" /> Open Platform
                        </a>
                      </Button>
                      {!post.used && (
                        <Button size="sm" variant="ghost" onClick={() => markUsed(post)}>
                          <Check className="h-3 w-3 mr-1.5" /> Mark Posted
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}