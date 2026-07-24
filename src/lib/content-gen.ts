// ============================================================
// GroomingPro — AI Content Generator (DeepSeek)
// Used by /api/cron/content-generator for daily SEO + social posts
// ============================================================

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

async function callDeepSeek(messages: ChatMessage[], temperature = 0.7): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return JSON.stringify({ error: "DEEPSEEK_API_KEY not configured" })

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    return JSON.stringify({ error: `DeepSeek API error: ${response.status}` })
  }

  const data = await response.json()
  return data.choices[0].message.content
}

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

// ── SEO Topic Rotation ────────────────────────────
// Cycled through daily to cover different keywords
const SEO_TOPICS = [
  { keyword: "pet grooming software", angle: "comparison", title: "Best Pet Grooming Software 2026" },
  { keyword: "how to reduce no-shows grooming", angle: "how-to", title: "5 Ways to Reduce No-Shows in Your Grooming Salon" },
  { keyword: "pet grooming KPIs", angle: "guide", title: "5 KPIs Every Pet Groomer Should Track" },
  { keyword: "free grooming salon software", angle: "guide", title: "Is Free Pet Grooming Software Worth It?" },
  { keyword: "ai pet grooming", angle: "trend", title: "How AI is Changing the Pet Grooming Industry" },
  { keyword: "moego alternative", angle: "comparison", title: "MoeGo Alternatives: Best Pet Grooming Software 2026" },
  { keyword: "pet grooming business tips", angle: "guide", title: "10 Tips to Grow Your Pet Grooming Business" },
  { keyword: "pet grooming before and after photos", angle: "guide", title: "Why Before & After Photos Win More Bookings" },
  { keyword: "customer retention grooming", angle: "guide", title: "Customer Retention: The Key to a Profitable Grooming Salon" },
  { keyword: "pet grooming scheduling", angle: "how-to", title: "Smart Scheduling: How to Fill Empty Slots in Your Salon" },
]

let seoIndex = 0
function getNextTopic() {
  const topic = SEO_TOPICS[seoIndex % SEO_TOPICS.length]
  seoIndex++
  return topic
}

// ── Blog Post Generation ────────────────────────────
export async function generateBlogPost(): Promise<{
  title: string
  slug: string
  excerpt: string
  content: string
  keywords: string[]
  meta_description: string
} | null> {
  const topic = getNextTopic()

  const systemPrompt = `You are an expert pet grooming industry content writer.
Write helpful, SEO-optimized blog posts that genuinely help groomers run better businesses.
Tone: friendly, professional, jargon-free. Target audience: independent pet grooming salon owners in the US.

IMPORTANT RULES:
- Do NOT make up statistics. Use approximate language like "studies suggest", "many groomers report".
- Do NOT mention specific competitors by name.
- Mention GroomingPro (https://petsalonos.com) naturally 1-2 times as a free AI-powered alternative if relevant.
- Output ONLY valid JSON, no markdown wrapping, no prose.`

  const userPrompt = `Write a blog post titled "${topic.title}".

Topic keyword: ${topic.keyword}
Angle: ${topic.angle}

The post should be 800-1200 words, well-structured with H2/H3 headings, actionable tips, and a soft mention of modern AI tools.

Return ONLY valid JSON with this exact structure:
{
  "title": "...",
  "excerpt": "1-2 sentence summary (max 200 chars)",
  "content": "full markdown content with ## headings",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "meta_description": "SEO meta description 150-160 chars"
}`

  try {
    const raw = await callDeepSeek([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ])

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()
    const parsed = JSON.parse(cleaned)

    const slug = parsed.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80)

    return {
      title: parsed.title,
      slug: `${slug}-${Date.now()}`,
      excerpt: parsed.excerpt,
      content: parsed.content,
      keywords: parsed.keywords || [topic.keyword],
      meta_description: parsed.meta_description || parsed.excerpt,
    }
  } catch (err) {
    console.error("Blog post generation failed:", err)
    return null
  }
}

// ── Social Post Generation ────────────────────────────
const SUBREDDITS = ["r/doggrooming", "r/Pets", "r/smallbusiness", "r/SaaS", "r/SideProject"]
const FB_GROUPS = ["GroomerTalk", "Professional Pet Groomers", "Pet Grooming Business Owners"]

let redditIdx = 0
let fbIdx = 0

export async function generateRedditPost(): Promise<{
  platform: "reddit"
  subreddit: string
  title: string
  content: string
  target_keyword: string
} | null> {
  const subreddit = SUBREDDITS[redditIdx % SUBREDDITS.length]
  redditIdx++

  const systemPrompt = `You write helpful, authentic Reddit posts for the pet grooming industry.
CRITICAL: Reddit users hate self-promotion. Posts must be 90% helpful content, only 10% subtle product mention at the very end.
Use first-person casual tone. Do NOT use markdown formatting (Reddit renders it differently).`

  const userPrompt = `Write a Reddit post for ${subreddit} about a real problem pet groomers face (e.g., managing appointments, customer no-shows, scheduling chaos, pricing).

The post should:
- Tell a relatable story (fictional but realistic)
- Describe what you tried that didn't work
- Mention you eventually built/used an AI tool to help (DO NOT name a specific brand — say "an AI tool I built" or "a free AI dashboard I found")
- End with a question to invite comments

Title: max 200 chars, attention-grabbing but not clickbait.
Body: 100-200 words, no markdown, just plain text paragraphs.

Return ONLY valid JSON: { "title": "...", "content": "...", "target_keyword": "pet grooming" }`

  try {
    const raw = await callDeepSeek([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], 0.8)

    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()
    const parsed = JSON.parse(cleaned)

    return {
      platform: "reddit" as const,
      subreddit,
      title: parsed.title,
      content: parsed.content,
      target_keyword: parsed.target_keyword || "pet grooming",
    }
  } catch {
    return null
  }
}

export async function generateFacebookPost(): Promise<{
  platform: "facebook"
  title: string
  content: string
  target_keyword: string
} | null> {
  const group = FB_GROUPS[fbIdx % FB_GROUPS.length]
  fbIdx++

  const systemPrompt = `You write helpful Facebook group posts for pet groomers.
Tone: warm, conversational, like a salon owner sharing advice with peers.
NO self-promotion in the post body. Just pure value.
Format: 2-3 short paragraphs with line breaks.`

  const userPrompt = `Write a Facebook group post for the group "${group}" sharing one actionable tip about running a grooming business.

Example topics: how to handle difficult customers, how to upsell services naturally, when to send appointment reminders, how to take great before/after photos, how to retain clients.

Return ONLY valid JSON: { "title": null, "content": "post body 100-150 words with line breaks", "target_keyword": "..." }`

  try {
    const raw = await callDeepSeek([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], 0.7)

    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()
    const parsed = JSON.parse(cleaned)

    return {
      platform: "facebook" as const,
      title: parsed.title,
      content: parsed.content,
      target_keyword: parsed.target_keyword || "pet grooming",
    }
  } catch {
    return null
  }
}

export async function generateG2Response(): Promise<{
  platform: "g2"
  title: string
  content: string
  target_keyword: string
} | null> {
  const systemPrompt = `You write helpful responses to software reviews on G2.com.
The reviews are negative reviews of competing pet grooming software (MoeGo, GroomProPOS, Time To Pet, etc.).
The response should: (1) acknowledge the user's pain, (2) explain that alternative solutions exist, (3) NOT name any specific competitor negatively.
Tone: helpful, not salesy.`

  const userPrompt = `Write a G2 review response template that we can adapt for various competitor review threads.

Common pain points in pet grooming software reviews:
- Limited SMS costs extra
- Reporting features need improvement
- Mobile app is inconsistent
- Pricing feels high for what you get

Return ONLY valid JSON: { "title": "Review response", "content": "response template 80-120 words", "target_keyword": "pet grooming software" }`

  try {
    const raw = await callDeepSeek([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], 0.5)

    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()
    const parsed = JSON.parse(cleaned)

    return {
      platform: "g2" as const,
      title: parsed.title || "Review response",
      content: parsed.content,
      target_keyword: parsed.target_keyword || "pet grooming software",
    }
  } catch {
    return null
  }
}