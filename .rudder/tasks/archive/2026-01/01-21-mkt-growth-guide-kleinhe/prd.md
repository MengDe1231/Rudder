# Rudder 开源增长执行指南

> 基于 Iris 的 Open-source Launch TODO 文档深度拆解
>
> 来源: https://tcnqbhfonfaj.feishu.cn/wiki/MxZawyR8WiLhYokTJnUcBxr6nrb

---

## 目录

1. [核心理念](#核心理念)
2. [时间线总览](#时间线总览)
3. [Phase 1: 前置准备 (T-14 到 T-7)](#phase-1-前置准备-t-14-到-t-7)
4. [Phase 2: 内容与渠道准备 (T-7 到 T-3)](#phase-2-内容与渠道准备-t-7-到-t-3)
5. [Phase 3: 预热期 (T-3 到 T-1)](#phase-3-预热期-t-3-到-t-1)
6. [Phase 4: Launch Day (T0)](#phase-4-launch-day-t0)
7. [Phase 5: 持续增长期 (T+1 onwards)](#phase-5-持续增长期-t1-onwards)
8. [渠道详细执行手册](#渠道详细执行手册)
9. [工具清单](#工具清单)
10. [预算规划](#预算规划)
11. [KPI 与追踪](#kpi-与追踪)

---

## 核心理念

### 开源产品的本质

> **请 Developer 贡献影响力，请 ToB 客户贡献钱**

这意味着：
- **影响力变现**: Developer 社区的 star、fork、PR 是最好的社会证明
- **商业化闭环**: DIY 的生态商业化需要两手抓、两手都要硬

### 成功公式

```
开源增长 = Value Proposition × 渠道覆盖 × 内容质量 × 执行频率
```

### 关键原则

1. **一句话介绍至关重要** - 必须能在 3 秒内让人明白产品价值
2. **所有渠道必须带 GitHub Link** - 这是唯一的转化入口
3. **Github Readme & Landing page & Community 要闭环** - 用户旅程要完整
4. **定每日目标，没达到就继续补渠道补流量** - 执行要有节奏

---

## 时间线总览

```
T-14 ─────────────────────────────────────────────────────> T+30
  │                                                           │
  ├─ T-14 ~ T-7: Phase 1 前置准备                              │
  │   ├─ Value Proposition 确认                                │
  │   ├─ Github Readme 完善                                    │
  │   ├─ Landing Page 上线                                     │
  │   └─ 竞品分析 (Week 1)                                     │
  │                                                           │
  ├─ T-7 ~ T-3: Phase 2 内容与渠道准备                          │
  │   ├─ Medium 账号准备                                       │
  │   ├─ Twitter KOL 建联                                      │
  │   ├─ Content Package 准备                                  │
  │   └─ 素材包准备 (Week 2)                                   │
  │                                                           │
  ├─ T-3 ~ T-1: Phase 3 预热期                                 │
  │   ├─ QA 话术准备                                           │
  │   ├─ Twitter 文案准备                                      │
  │   ├─ KOL 合作确认                                          │
  │   └─ Reddit 账号/策略准备                                   │
  │                                                           │
  ├─ T0: Phase 4 Launch Day                                   │
  │   ├─ Medium 文章发布                                       │
  │   ├─ 开源平台提交                                          │
  │   ├─ HackerNews 发布                                       │
  │   └─ 全渠道启动                                            │
  │                                                           │
  └─ T+1 ~ T+30: Phase 5 持续增长期                            │
      ├─ 每日 Star 追踪 (2次/天)                               │
      ├─ 每日渠道执行                                          │
      └─ 迭代优化                                              │
```

---

## Phase 1: 前置准备 (T-14 到 T-7)

### 1.1 Value Proposition 确认

**目标**: 确定一句话产品介绍

#### 执行步骤

- [ ] **Step 1**: 列出产品核心功能 (3-5 个)
- [ ] **Step 2**: 明确目标用户画像
- [ ] **Step 3**: 分析竞品定位 (Notion, Obsidian, etc.)
- [ ] **Step 4**: 撰写 3-5 个版本的一句话介绍
- [ ] **Step 5**: 内部投票选出最佳版本
- [ ] **Step 6**: 用户访谈验证 (至少 5 人)

#### 一句话介绍模板

```
[产品名] is [产品类型] that helps [目标用户] to [核心价值],
unlike [竞品], we [差异化优势].
```

**Rudder 示例**:
```
Rudder is a governance framework that helps AI development teams
maintain consistent code quality, unlike traditional linters,
we provide intelligent context-aware guidance for AI agents.
```

#### Checklist

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 一句话能在 3 秒内理解 | ⬜ | |
| 包含核心价值主张 | ⬜ | |
| 有明确差异化 | ⬜ | |
| 目标用户验证过 | ⬜ | |

---

### 1.2 Github Readme 完善

**目标**: 让 Readme 成为最佳销售页面

#### 必须包含的元素

- [ ] **Hero Section**
  - [ ] 产品 Logo
  - [ ] 一句话介绍
  - [ ] Badges (stars, license, version)
  - [ ] Demo GIF/截图 (15秒内展示核心功能)

- [ ] **Features Section**
  - [ ] 3-5 个核心功能
  - [ ] 每个功能配图或代码示例

- [ ] **Quick Start**
  - [ ] 安装命令 (一行)
  - [ ] 最简配置示例
  - [ ] 第一个成功运行的示例

- [ ] **Documentation Links**
  - [ ] 完整文档链接
  - [ ] API 参考
  - [ ] Examples 仓库

- [ ] **Community Section**
  - [ ] Discord/Slack 链接
  - [ ] Twitter 链接
  - [ ] Contributing 指南

- [ ] **CTA (Call to Action)**
  - [ ] Star 提示
  - [ ] 贡献邀请

#### Readme 质量检查

| 检查项 | 状态 |
|--------|------|
| 首屏有吸引力的视觉元素 | ⬜ |
| 30 秒内能理解产品用途 | ⬜ |
| Quick Start 可在 2 分钟内完成 | ⬜ |
| 所有链接都能正常访问 | ⬜ |
| 移动端显示正常 | ⬜ |

---

### 1.3 Landing Page 准备

**目标**: 与 Github Readme 形成闭环

#### 必须包含

- [ ] Hero Section (与 Readme 一致)
- [ ] Feature 介绍
- [ ] Use Cases / 用户故事
- [ ] Testimonials (如有)
- [ ] Pricing (如有商业版)
- [ ] CTA: **必须有 GitHub 链接**
- [ ] Email 订阅入口

#### 闭环检查

```
Landing Page ──[GitHub 按钮]──> GitHub Repo
     │                              │
     │                              │
     v                              v
Email 订阅 <──[Community 链接]── Discord/Slack
```

---

### 1.4 竞品分析 (Week 1)

**目标**: 了解竞品的用户渠道和官网构成

#### 分析维度

| 竞品 | 官网结构 | 主要渠道 | KOL 合作 | 内容策略 |
|------|----------|----------|----------|----------|
| 竞品 A | | | | |
| 竞品 B | | | | |
| 竞品 C | | | | |

#### 执行步骤

- [ ] 列出 3-5 个直接竞品
- [ ] 分析每个竞品的:
  - [ ] Landing Page 结构
  - [ ] GitHub Readme 结构
  - [ ] Twitter 账号内容策略
  - [ ] 合作过的 KOL
  - [ ] Reddit/HN 历史帖子
- [ ] 整理学习点和差异化机会

---

## Phase 2: 内容与渠道准备 (T-7 到 T-3)

### 2.1 素材包准备 (Week 2)

**目标**: 准备所有渠道需要的内容素材

#### Content Package 清单

| 素材类型 | 数量 | 状态 | 用途 |
|----------|------|------|------|
| 一句话介绍 | 3 版本 | ⬜ | 各渠道通用 |
| 产品截图 | 5-10 张 | ⬜ | 社交媒体、文章 |
| Demo GIF | 2-3 个 | ⬜ | Twitter、Readme |
| Demo 视频 | 1-2 个 | ⬜ | YouTube、Landing |
| Logo 套件 | 多尺寸 | ⬜ | 各渠道 |
| Banner 图 | 3-5 张 | ⬜ | Twitter Header 等 |
| Twitter Thread 模板 | 3-5 个 | ⬜ | KOL 合作 |
| 长文 (Medium/Blog) | 1-2 篇 | ⬜ | Medium、PR |

#### Twitter Thread 模板结构

```
Tweet 1: Hook + 一句话介绍
Tweet 2: 问题描述 (痛点)
Tweet 3: 解决方案 (产品)
Tweet 4: 核心功能 1 + 截图/GIF
Tweet 5: 核心功能 2 + 截图/GIF
Tweet 6: 核心功能 3 + 截图/GIF
Tweet 7: 用户评价/数据证明
Tweet 8: CTA + GitHub 链接
```

---

### 2.2 Medium 账号准备 (T-7)

#### 执行步骤

- [ ] 注册/确认 Medium 账号
- [ ] 完善 Profile (头像、简介、链接)
- [ ] 撰写 Launch 文章初稿
- [ ] 内部 Review
- [ ] 定时发布设置 (T0)

#### Medium 文章结构

```markdown
# [产品名]: [一句话价值主张]

## The Problem
- 痛点描述
- 现有解决方案的不足

## Our Solution
- 产品介绍
- 核心理念

## Key Features
- 功能 1 + 截图
- 功能 2 + 截图
- 功能 3 + 截图

## Getting Started
- 快速开始指南
- 代码示例

## What's Next
- Roadmap 预告

## Join Our Community
- GitHub 链接 ⭐
- Discord 链接
- Twitter 链接
```

**参考**: https://medium.com/@affineworkos/affine-the-next-gen-knowledge-base-to-notion-and-miro-403f0afd9fba

---

### 2.3 Twitter KOL 建联 (T-7 开始)

**目标**: 建联 20+ Twitter KOL

#### KOL 寻找策略

1. **竞品合作 KOL 挖掘**
   - 搜索 A-context 合作过的 KOL
   - 搜索 MemU 合作过的 KOL
   - 搜索 Vercel 合作过的 KOL
   - 搜索 Supabase 合作过的 KOL

2. **批量建联工具**
   | 工具 | 支持平台 | 链接 |
   |------|----------|------|
   | Noxinfluencer | IG, TikTok, YouTube, Twitter | noxinfluencer.com |
   | Intellifluence | 多平台 | intellifluence.com |
   | Heepsy | IG, YouTube, TikTok | heepsy.com |
   | Klear | 多平台 | klear.com |
   | BuzzSumo | Twitter, 内容发现 | buzzsumo.com |

#### KOL 信息收集模板

| KOL | 粉丝数 | 领域 | 历史合作 | 联系方式 | 报价 | 状态 |
|-----|--------|------|----------|----------|------|------|
| @xxx | 50K | Dev Tools | Vercel | DM/Email | $XX | ⬜ |

#### KOL 合作流程

```
1. 确认预算
   └─> 总预算: $____
   └─> 单个 KOL 预算: $300-500

2. 根据预算精准匹配 KOL
   └─> 目标数量: 5-10 个
   └─> 筛选标准: 粉丝量、互动率、领域相关性

3. KOL 询价 (发邮件/DM)
   └─> 模板: [见下方]

4. 确认价格 & 合作意向
   └─> 谈判要点: 合作形式、发布时间、修改次数

5. 准备 Content Package 并发送
   └─> 包含: 产品介绍、素材、关键信息点

6. KOL 准备 draft 并来回 argue 内容细节
   └─> 审核要点: GitHub 链接、核心信息、CTA

7. KOL 准备 invoice 并发给甲方
   └─> 确认付款方式: PayPal/Wire

8. 甲方给 KOL 打款

9. KOL 发布内容
   └─> 确认发布时间: T0 当天

10. 甲方追踪 KOL 的 performance
    └─> 追踪: 点击数、Star 增量、转化率
```

#### KOL 询价 DM 模板

```
Hi [Name],

I'm [Your Name] from [Company]. We're launching [Product] -
[一句话介绍].

We've been following your content on [specific topic] and
think you'd be a great fit to share [Product] with your audience.

Would you be interested in a paid collaboration? We're thinking:
- 1 Thread about [Product] (with GitHub link)
- 1 Single post
- 1 Quote of our launch tweet

Happy to share more details and discuss rates.

Best,
[Your Name]
```

#### KOL 合作报价参考

| 合作形式 | 价格范围 | 备注 |
|----------|----------|------|
| 转发一条 | $10-30 | 最基础 |
| 发布一条 Thread | ~$50 | 带 GitHub link |
| 完整合作包 | $300-500 | Thread + Post + Quote |

---

## Phase 3: 预热期 (T-3 到 T-1)

### 3.1 QA 话术准备 (T-3)

**目标**: 准备各渠道的回复话术

#### 为什么重要

> 通常早期都是通过 DM/Post 来进行引流，因此不同渠道的及时回复非常重要

#### 话术分类

| 场景 | 话术模板 |
|------|----------|
| 产品介绍询问 | [一句话介绍] + [GitHub 链接] |
| 功能咨询 | [功能说明] + [文档链接] |
| 对比竞品 | [差异化说明] + [具体场景] |
| Bug 反馈 | [感谢] + [Issue 链接邀请] |
| 合作咨询 | [合作方式] + [联系方式] |
| 负面评价 | [感谢反馈] + [改进计划] |

#### 话术准备 Checklist

- [ ] Twitter 回复话术 (5-10 条)
- [ ] Reddit 回复话术 (5-10 条)
- [ ] Discord 欢迎语
- [ ] GitHub Issue 回复模板
- [ ] 常见问题 FAQ

**参考**: AFFINE Operation reply (open source preparation)

---

### 3.2 Twitter 文案准备 (T-3)

#### Launch Tweet 模板

```
🚀 Introducing [Product Name]!

[一句话介绍]

✨ Key features:
• Feature 1
• Feature 2
• Feature 3

⭐ Star us on GitHub: [链接]

🧵 Thread below 👇
```

#### Thread 内容准备

- [ ] Thread 1: Launch 公告 (5-8 tweets)
- [ ] Thread 2: 技术深度解析 (备用)
- [ ] Thread 3: Use Case 展示 (备用)

---

### 3.3 Reddit 策略准备 (T-3)

#### 关键要点

> **找有老账号的人发帖子** - 这是最关键的！

新账号在大多数 subreddit 会被自动过滤或限制。

#### 执行步骤

- [ ] 整理目标 Subreddits 列表
- [ ] 确认发帖账号 (老账号)
- [ ] 准备帖子内容 (非广告风格)
- [ ] 准备 upvote 支持计划
- [ ] 准备回复话术

#### 目标 Subreddits

| Subreddit | 类型 | 发帖规则 | 优先级 |
|-----------|------|----------|--------|
| r/programming | 技术讨论 | 需要技术内容 | P0 |
| r/opensource | 开源项目 | Show HN 风格 | P0 |
| r/SideProject | 个人项目 | 允许推广 | P1 |
| r/webdev | Web 开发 | 技术相关 | P1 |
| r/devops | DevOps | 工具相关 | P1 |
| r/[specific] | 垂直领域 | 视产品定 | P2 |

#### Reddit 帖子模板

```
Title: I built [Product] to solve [Problem] - feedback welcome!

Body:
Hey r/[subreddit],

I've been working on [Product] for the past [time].

The Problem:
[描述痛点，用第一人称]

My Solution:
[介绍产品，强调开源]

Key Features:
- Feature 1
- Feature 2
- Feature 3

GitHub: [链接]

Would love to hear your feedback and suggestions!
```

#### 工具支持

- **idea-hunt.com**: 找核心帖子帮忙回复
- **后期**: 可以找人帮忙 upvote (谨慎使用)

---

## Phase 4: Launch Day (T0)

### Launch Day Checklist

#### 早晨 (9:00 AM)

- [ ] 发布 Medium 文章
- [ ] 发布官方 Twitter Thread
- [ ] 提交开源收录平台
- [ ] 发布 HackerNews (Show HN)
- [ ] KOL 内容发布 (协调时间)

#### 中午 (12:00 PM)

- [ ] Reddit 第一波发帖
- [ ] LinkedIn 发布
- [ ] Discord 公告
- [ ] 监控各渠道反馈

#### 下午 (3:00 PM)

- [ ] Reddit 第二波发帖
- [ ] 回复所有评论和问题
- [ ] 第一次 Star 数据记录

#### 晚上 (9:00 PM)

- [ ] 第二次 Star 数据记录
- [ ] 总结当日数据
- [ ] 规划次日行动

### 开源平台提交清单 (T0)

| 平台 | 链接 | 提交状态 |
|------|------|----------|
| DevHunt | https://devhunt.org/ | ⬜ |
| Product Hunt | producthunt.com | ⬜ |
| Hacker News | news.ycombinator.com | ⬜ |
| GitHub Trending | (自动) | ⬜ |
| 其他平台... | | ⬜ |

---

## Phase 5: 持续增长期 (T+1 onwards)

### 每日执行任务

#### Star 追踪 (每日 2 次)

```
日期: ____
上午 Star 数: ____
晚上 Star 数: ____
日增量: ____
目标达成: ⬜ (目标: 至少 100)
```

**追踪工具**:
- star-history.com
- GitHub API (按小时/分钟聚合)

#### 每日任务清单

| 任务 | 目标数量 | 实际完成 | 状态 |
|------|----------|----------|------|
| Twitter KOL 建联 | 3-5 个 | | ⬜ |
| Reddit 发帖 | 5 条 | | ⬜ |
| Group 发布 | 50-100 个 | | ⬜ |
| HackerNews 发帖 | 1 条 | | ⬜ |
| 群组发布 | 50 个 | | ⬜ |
| V2ex 发帖 | 1 条 | | ⬜ |
| Ambassador 分发 | 持续 | | ⬜ |

#### 增长策略

> **没达到目标就继续补渠道补流量**

如果当日 Star 增量未达目标:
1. 增加 Reddit 发帖数量
2. 联系更多 KOL
3. 在更多 Group 发布
4. 付费推广考虑

---

## 渠道详细执行手册

### Twitter 执行手册

#### 官方账号运营

| 内容类型 | 频率 | 示例 |
|----------|------|------|
| 产品更新 | 每周 1-2 | 新功能发布 |
| 技术分享 | 每周 2-3 | Tips、教程 |
| 用户故事 | 每周 1 | RT 用户推文 |
| 互动内容 | 每日 | 回复、点赞 |

#### KOL 合作执行

**每个 KOL 合作至少 3 个 action**:

1. **Thread** (sub-tweet 带 GitHub link)
   - 内容: 产品介绍 + 使用体验
   - 要求: 第一条推文带 GitHub 链接

2. **Single Post** (带 GitHub link)
   - 内容: 简短推荐
   - 要求: 必须带 GitHub 链接

3. **Quote 官推** (带 GitHub link)
   - 内容: 转发官方推文 + 评论
   - 要求: 添加个人观点

---

### Reddit 执行手册

#### 发帖策略

| 时间 | 行动 | 注意事项 |
|------|------|----------|
| T0 | 核心 subreddit 发帖 | 使用老账号 |
| T+1 ~ T+7 | 每天 5 条新帖 | 不同 subreddit |
| 持续 | 回复相关讨论 | 提供价值，非推广 |

#### 帖子类型

1. **Show HN 风格**: "I built X to solve Y"
2. **寻求反馈**: "Looking for feedback on my open source project"
3. **技术讨论**: "How I solved X using Y"
4. **比较文章**: "X vs Y: My experience"

---

### LinkedIn 执行手册

#### 工具设置

1. **PhantomBuster** (https://phantombuster.com/)
   - 功能: 自动化 LinkedIn 操作
   - 用途: 批量添加好友、发送消息

#### 执行步骤

1. **Keywords 搜索**
   - 搜索目标用户关键词
   - 导入 list (建议 500+)

2. **DM 文案准备**
   ```
   Hi [Name],

   I noticed you're working on [相关领域].

   We just launched [Product] - [一句话介绍].

   Would love to get your feedback: [GitHub 链接]

   Best,
   [Your Name]
   ```

3. **LinkedIn Premium**
   - 建议: 充值会员获得更多 InMail 配额
   - 考虑: 每个团队成员账号都 Setup

---

### HackerNews 执行手册

#### 发帖格式

```
Show HN: [Product Name] – [一句话介绍]
```

#### 最佳发帖时间

- 美国东部时间 上午 9-11 点
- 美国西部时间 上午 6-8 点

#### 注意事项

- 帖子需要 upvote 才能进入首页
- 需要积极回复评论
- 避免过度推广语气

---

### Medium 执行手册

#### 发布策略

| 时间节点 | 行动 |
|----------|------|
| T-7 | 账号准备、Profile 完善 |
| T-3 | 文章撰写完成 |
| T-1 | 内部 Review |
| T0 | 发布文章 |

#### 文章推广

- 在 Twitter 分享文章链接
- 在 Reddit 相关讨论中引用
- 提交到 Medium Publications

---

## 工具清单

### KOL 建联工具

| 工具 | 功能 | 链接 |
|------|------|------|
| Noxinfluencer | 多平台 KOL 搜索 | noxinfluencer.com |
| Intellifluence | 建联管理 | intellifluence.com |
| Heepsy | 网红搜索 | heepsy.com |
| Klear | 数据分析 | klear.com |
| BuzzSumo | 内容发现 | buzzsumo.com |

### LinkedIn 自动化

| 工具 | 功能 | 链接 |
|------|------|------|
| PhantomBuster | 自动化操作 | phantombuster.com |

### Reddit 工具

| 工具 | 功能 | 链接 |
|------|------|------|
| idea-hunt | 找帖子回复 | idea-hunt.com |

### 追踪工具

| 工具 | 功能 | 链接 |
|------|------|------|
| star-history | Star 趋势图 | star-history.com |
| GitHub API | 精细数据 | api.github.com |

---

## 预算规划

### 预算分配建议

| 项目 | 预算范围 | 备注 |
|------|----------|------|
| Twitter KOL | $1,500-3,000 | 5-10 个 KOL |
| LinkedIn Premium | $60-100/月 | 1-2 个账号 |
| 工具订阅 | $100-300/月 | PhantomBuster 等 |
| Paid Newsletter | $200-500 | 可选 |
| 总计 | $2,000-4,000 | 首月 Launch |

### 低预算策略

如果预算有限:
1. 专注免费渠道: Reddit, HN, Twitter (organic)
2. 寻找小 KOL 合作 (micro-influencers)
3. 依靠 Ambassador 和社区
4. 内容营销为主

---

## KPI 与追踪

### 核心 KPI

| 指标 | 目标 | 追踪频率 |
|------|------|----------|
| GitHub Stars | +100/天 | 每日 2 次 |
| GitHub Forks | - | 每日 |
| Website Traffic | - | 每日 |
| Discord 成员 | - | 每周 |
| Twitter 粉丝 | - | 每周 |

### 追踪表格

```
Week 1 追踪表

| 日期 | AM Stars | PM Stars | 日增量 | 目标 | Reddit | Twitter | HN |
|------|----------|----------|--------|------|--------|---------|-----|
| T0   |          |          |        | 100  |   ⬜   |    ⬜   | ⬜  |
| T+1  |          |          |        | 100  |   ⬜   |    ⬜   | ⬜  |
| T+2  |          |          |        | 100  |   ⬜   |    ⬜   | ⬜  |
| T+3  |          |          |        | 100  |   ⬜   |    ⬜   | ⬜  |
| T+4  |          |          |        | 100  |   ⬜   |    ⬜   | ⬜  |
| T+5  |          |          |        | 100  |   ⬜   |    ⬜   | ⬜  |
| T+6  |          |          |        | 100  |   ⬜   |    ⬜   | ⬜  |
```

---

## 附录

### A. 参考资料

- Iris 原始文档: [飞书链接]
- AFFINE Operation reply (open source preparation)
- 出海SaaS如何0-1做冷启/增长.pdf
- AI ToB 出海增长方法论.pdf

### B. 相关文档

- Potential KOL List
- Content Package Template
- 海外群 (汇总 list)
- roadmap

### C. Launch 经验数据

**AFFINE Launch 数据参考** (来自文档):
```
1/5 10pm: 3190 stars
1/6 10:30am: 3292 (+102)
1/6 10pm: 3375 (+83)
1/7 10am: 3410 (+35)
1/7 10pm: 3462 (+52)
1/8 12am: 3509 (+47)
1/8 9pm: 3591 (+82)
1/9 10am: 3832 (+241)
```

---

## Changelog

| 日期 | 修改内容 | 作者 |
|------|----------|------|
| 2026-01-21 | 初始版本，基于 Iris 文档拆解 | AI |
