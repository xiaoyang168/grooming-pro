# Deployment & Promotion Playbook

> GroomingPro (https://www.petsalonos.com) — 单一可信清单，跟着做完即"上线且能被人发现"。
> 最后更新：2026-07-29

---

## ✅ 当前已确认状态（线上实测）

| 项 | 状态 | 验证方式 |
|---|---|---|
| 域名 `https://www.petsalonos.com` | ✅ 200 | curl 实测 |
| 非 www → www 自动重定向 | ✅ 已做 | curl 实测 |
| `https://www.petsalonos.com/blog` | ✅ 200，公开显示文章 | curl 实测 |
| 博客文章页（正文 + canonical + title） | ✅ 完整渲染 | curl 实测 |
| `https://www.petsalonos.com/sitemap.xml` | ✅ 200 | curl 实测 |
| `https://www.petsalonos.com/robots.txt` | ✅ 200 | curl 实测 |
| Google Search Console Submit | ✅ 已提交 sitemap.xml，状态"成功" | 截图确认 |
| GSC 已发现 URL | 6（修复 sitemap 后会再增加） | 截图确认 |
| DeepSeek 自动博客生成 | ✅ 在跑（已生成多篇） | 之前 cron 实测 |
| 自动发布的社媒草稿 | ✅ 在跑（Reddit/FB/G2） | Supabase 数据 |
| 域名 `petsalonos.com` 在 Vercel | ✅ 已解析 | 用户确认 |
| Vercel 自动部署 | ✅ 已部署 | 用户确认 |

---

## 🔴 必做（让博客 SEO 真正"能被人找到"）— 4 步

### Step 1 — Vercel 环境变量：`NEXT_PUBLIC_APP_URL` 改成 www

**为什么**：你当前 Vercel 上这个变量是 `https://petsalonos.com`（非 www），但站点实际重定向到 www，会导致 canonical、sitemap、OG 分享卡、邮件预约链接全都用错域名。截图（GSC property 是 www）也证明 www 才是品牌主域名。

**操作**：
1. 打开 Vercel → 项目 `grooming-pro` → **Settings** → **Environment Variables**
2. 找到 `NEXT_PUBLIC_APP_URL` → 编辑 → 值改为 **`https://www.petsalonos.com`**
3. 部署环境选 **Production**（勾选全部环境更省心）
4. 保存 → 触发 **Redeploy**（顶部 Deployments → 最新一次 → 三个点 → Redeploy）

> 此修改**只需 1 次**，以后每次部署都会自动注入新值。

### Step 2 — 推送这次本地代码 → 触发 Vercel 重新部署

**为什么**：上一步会把环境变量重新构建进新部署；连带的，这次本地还有几个 SEO 类代码改动需要推到远端才会生效。

**待推送的本地 commit**（已提交到本地，但因 GitHub token 暴露需换新 token 后再推）：

| commit | 作用 |
|---|---|
| `f8e26e8` (sitemap) | 修复 sitemap 收录博客文章（之前只 6 个静态页） |
| `content-gen.ts` | 选题轮换确定性化 + 博客去重守卫 + Facebook 标题兜底 |
| `creem/payment-link` | 域名统一到 www |
| `layout.tsx` / `appointments/route.ts` / `settings/page.tsx` | 6 处硬编码域名统一到 `NEXT_PUBLIC_APP_URL` |

**操作**：
1. 去 GitHub → 头像 → **Settings** → **Developer settings** → **Personal access tokens** → 把之前暴露的 `ghp_...` token **立即 Delete / Revoke**
2. 生成**新 token**（至少 `repo` 权限，30 天有效即可）
3. 把新 token 告诉我，我用 `git -c` 临时注入推一次（不会写进任何配置文件、不入库）；如果你熟 git 也可自己推

**推送后，Vercel 会自动检测到 main 分支更新并自动部署**（约 1-2 分钟）。部署完成后访问 `/sitemap.xml` 应该能看到博客文章 `/blog/{slug}` 出现在里面。

### Step 3 — 强制 GSC 重新抓取 sitemap

GSC 截图显示上次抓取是 2026-07-28，缓存的还是 6 个 URL。修复上线后：

1. Google Search Console → 你的 `https://www.petsalonos.com` 资源
2. 左侧 **站点地图** → 点 `/sitemap.xml` 那一行右侧的三个点
3. **重新抓取站点地图** → 等 5-15 分钟
4. 验证："已发现的网址" 数量从 6 → 增长（每天 1 篇博客会持续增加）

### Step 4 — 让 Google 真收录（一次性 10 分钟）

即使 sitemap 提交了，Google 也不会马上索引所有页面。**主动请求收录**排行最高优先的 5 个页面：

1. GSC → 顶部搜索框 → 输入每个 URL → 回车
2. 然后点 **请求编入索引**
3. 建议首批请求索引：
   - `https://www.petsalonos.com/`（首页）
   - `https://www.petsalonos.com/blog`（博客列表）
   - `https://www.petsalonos.com/blog/best-pet-grooming-software-2026-1785245488961`（当前唯一已发布文章）
   - `https://www.petsalonos.com/login`

> 不需要每天请求，Google 后续会通过 sitemap 自动发现新博客。

---

## 📣 推广飞轮（上线后真正"有人看"）

### 自动层（已经在跑，不用管）

| 内容 | 频率 | 入口 | 状态 |
|---|---|---|---|
| DeepSeek 自动写 SEO 博客 | 每天 UTC 13:00 | `/blog` | ✅ 已验证 |
| 自动生成 Reddit 草稿 | 每天 UTC 14:00 | `/marketing` | ✅ 已验证 |
| 自动生成 Facebook 草稿 | 每天 UTC 15:00 | `/marketing` | ✅ 已验证 |
| 自动生成 G2 评测草稿 | 每天 UTC 16:00 | `/marketing` | ✅ 已验证 |

### 人工层（这是 90% 推广效果的来源）

**⏰ 每天 5 分钟（早晚各 1 次）**：

1. **早上**：登录 `/marketing` → 复制昨天的 Reddit 草稿 → 用你的真人账号发到 `r/doggrooming` / `r/smallbusiness`（软推，别硬广）
2. **早上**：登录 `/marketing` → 复制 FB 草稿 → 发到 "Professional Pet Groomers" / "GroomerTalk" 群组
3. **晚上**：登录 `/marketing` → 看今天是否生成了 G2 草稿 → 写完注册 G2 账号后提交

**关键原则**：
- **不要全自动群发**——Reddit/FB 反垃圾机制会立刻封号
- 必须用**真人账号**发出，AI 写的草稿是起点，你的"人味"是终点
- 失败 5 次以上的群组别挣扎，直接换下一个

### 内容侧每周加量（1 小时/周）

- 浏览 `/blog` 看本周自动生成的文章，挑 1-2 篇感觉可以扩写的，**人工加 200-300 字补充真实案例/数据**（DeepSeek 偶尔会写虚的）
- 选题会按"按天确定性"轮换，但只有 10 个选题。**建议每月手动扩展 5-10 个新选题**（编辑 `src/lib/content-gen.ts` 的 `SEO_TOPICS` 数组），每个新选题围绕一个痛点长尾词

### 冷启动（第 1-2 周手动触达）

- 在 `r/doggrooming`、`r/smallbusiness` 主动答题/帮人解决美容店问题（10-15 分钟/天），积累信誉后再发产品
- 在 IndieHackers 发 **Build in Public** 系列：每周更新"我们这周做了什么 + 增长数字"（美国创业圈最爱）
- Product Hunt 首发：你 `US_PROMOTION_PLAN.md` 里有完整方案，建议在凑齐 3-5 个真实用户证言后再发（社交证明为 0 的话上 PH 会被踩）

---

## 🎯 多周里程碑

| 周 | 目标 | 关键指标 |
|---|---|---|
| W1（上线周） | 推送代码 + GSC 抓取 + 每日发社媒草稿 | 博客索引数 ≥ 1 |
| W2 | 累计 5-10 篇博客 + 第一次 IndieHackers 帖 | 自然搜索 PV ≥ 50 |
| W3 | 累计 15 篇博客 + 主动答 20+ Reddit/Facebook 题 | 仪表盘注册商家 ≥ 3 |
| W4 | 累计 25 篇博客 + Product Hunt 准备（筹证言） | PH 首发预约日 |
| W5+ | 看数据决定是否投 Google Ads ($200 小额测试) | CAC 数字 |

**注**：W2-W3 自然搜索数字预期较低（SEO 慢热），主要看 W4 起飞。

---

## 🛠 已知问题 / 限制

1. **AI 自动博客无审核闸门** —— 偶尔会写质量不稳的内容。如果文章明显跑题，记得去 Supabase `blog_posts` 表手动改 `status` 为 `draft`。
2. **Next.js `NEXT_PUBLIC_*` 环境变量是构建时注入**——线上变量改了必须 Redeploy 才会生效，不是热更新。
3. **本地 `http://localhost:8888` 与生产 `https://www.petsalonos.com` 是两套环境**——本地测完记得推线上再测。

---

## 🆘 出问题回滚

- **博客发布闸了？** → 改 `src/app/api/cron/content-generator/route.ts` 把 `insert` 改为 `console.log` + 写日志，发新版不真发
- **流量统计挂了？** → Supabase `page_views` 表是按日志型表设计，单条失败不影响整体；< 501 错误再查
- **sitemap 重新没数据？** → `node_modules/typescript/bin/tsc --noEmit` 先确认无类型错误；再看 `migrations/002_ai_marketing.sql` 是否已建表
- **Vercel 部署失败？** → 看 Deployments → 失败那条 → Functions 日志；最常见是 env 变量缺失
- **完全想退回某次改动？** → `git revert <commit>` 然后推

---

## 📋 单页速查（做完打勾）

- [ ] **必做**：Vercel `NEXT_PUBLIC_APP_URL` → `https://www.petsalonos.com` → Redeploy
- [ ] **必做**：撤销旧 GitHub token + 生成新 token
- [ ] **必做**：把本地 4 个 commit 推到 GitHub
- [ ] **必做**：GSC 重新抓取 sitemap，验证"已发现网址" > 6
- [ ] **必做**：GSC 主动索引首页 + /blog + 当前博客文章
- [ ] **每日**：去 `/marketing` 发 AI 草稿（Reddit + Facebook）
- [ ] **每周**：加 1-2 篇博客拓展 + 每月加 5-10 个新选题
- [ ] **每周**：去 Supabase `blog_posts` 抽查本周文章质量
- [ ] **W4**：凑齐 3-5 个真实用户证言 → Product Hunt 首发

---

## 📚 相关文档

- `US_PROMOTION_PLAN.md` — 美国市场推广方案（Phase 1-3 渠道策略）
- `COMPETITIVE_ANALYSIS.md` — 竞品对比 + 功能路线图
- `README.md` — 项目原始说明
- `.workbuddy/memory/2026-07-29.md` — 本次会话决策日志（可选）