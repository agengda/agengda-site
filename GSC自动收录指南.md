# 让谷歌自动收录你的网站（agengda-industrial-chiller.com）

> 适用：刚上线的外贸独立站，希望谷歌尽快把页面抓进索引、能在搜索结果里搜到。
> 当前状态（2026-10-27 实测）：sitemap.xml 已生成（193 条 URL），GSC 站点验证已通过，robots.txt 已正确声明 Sitemap。
> 结论：只需做「第二步提交 sitemap」，剩下的交给谷歌自己爬，不必逐页点「请求编入索引」。

---

## 一、原理（30 秒看懂）

谷歌收录 = 三步走：
1. **抓取（Crawl）**：谷歌蜘蛛顺着链接 / sitemap 找到你的页面
2. **索引（Index）**：觉得页面合格，放进它的数据库
3. **展示（Rank）**：用户搜索时按相关性排出来

我们要做的，就是把「路标」（sitemap）递给谷歌，让它知道有哪些页面、在哪。

---

## 二、必做：提交 sitemap（1 分钟，零代码）★核心

这是最重要的一步，做完就不用管了。

1. 打开 Google Search Console：https://search.google.com/search-console/
2. 左上角选属性 **`agengda-industrial-chiller.com`**
3. 左侧菜单 → **「站点地图」(Sitemaps)**
4. 在输入框里填：`sitemap.xml`
   - 完整地址是 `https://agengda-industrial-chiller.com/sitemap.xml`，但 GSC 里只填文件名 `sitemap.xml` 即可
5. 点 **「提交」**
6. 成功后会显示状态「成功」，并列出「已发现的网址数」（应为 193）

> 提交后谷歌一般几小时内开始爬，1–2 周内陆续收录。不用重复提交。

---

## 三、查收录进度（两个自查）

**方法 A — GSC 后台看（最准）**
- 左侧「网页」(Pages) → 看「未编入索引 / 已编入索引」的数量变化
- 左侧「站点地图」→ 看 sitemap 的「已抓取网页数」是否增长

**方法 B — 直接搜（最直观）**
在谷歌搜：`site:agengda-industrial-chiller.com`
- 现在搜出来是 0 条（新站正常）
- 过 1–2 周会变成几十条，说明收录生效了

---

## 四、加速收录的 6 个办法（加分项，不是必须）

sitemap 提交后谷歌会自己来，但下面这些能**加快**、并顺带提升排名：

1. **发外链（最有效）**：在社媒/黄页/B2B 平台发带网站链接的帖子
   - Facebook 专页、WhatsApp 状态、LinkedIn、墨西哥/巴西本地黄页、行业目录
   - 外部链接 = 谷歌眼中的「投票」，能显著加快抓取和提权
2. **Google 商家档案（Google Business Profile）**：虽然是 B2B，但建一个带网站链接的 GBP 能让谷歌更快发现你（尤其拉美客户搜本地供应商时露脸）
3. **持续更新内容**：网站加一个「新闻 / 博客 / 案例」板块，定期发 1–2 篇（如「墨西哥工厂如何选冷水机」），谷歌偏爱活跃站点
4. **内部链接互通**：首页→产品页→FAQ→联系页互相链接（你站点已做得不错）
5. **确保加载快 + 移动端友好**：你的站走 Cloudflare 边缘缓存，海外打开快，这点已经占优
6. **把网站链接挂到所有对外渠道**：邮件签名、WhatsApp 自动回复、名片、报价单

---

## 五、千万别做的事

- ❌ **反复逐页点「请求编入索引」**：新站这么做谷歌容易直接拒（你之前 `/fr/index.html` 报的「出了点问题」就是这原因），提交 sitemap 后让它自己爬更稳
- ❌ **堆关键词 / 隐藏文字 / 复制别人内容**：会被谷歌判作弊，反而没收录
- ❌ **改 URL 结构后又不管**：保持 sitemap 和实际页面一致（目前一致）
- ❌ **robots.txt 误屏蔽**：你的配置是 `Allow: /` + 声明 Sitemap，正确，别改坏

---

## 六、时间预期

| 阶段 | 时间 | 你会看到 |
|---|---|---|
| 提交 sitemap | 当天 | GSC「站点地图」显示成功、193 条已发现 |
| 谷歌开始爬 | 1–3 天 | 「网页」里出现第一批「已编入索引」 |
| 初步收录 | 1–2 周 | `site:域名` 能搜出几十条 |
| 稳定 + 有排名 | 1–3 个月 | 核心词（industrial chiller / enfriadora 等）开始有曝光 |

> 收录是「先有后优」。先让谷歌把页面收进去，排名靠后面的内容更新 + 外链慢慢涨。

---

## 附：进阶（可选，需技术配置）

若想更主动地推 URL，仓库里另有 `gsc_submit.py`（走 Google Indexing API），但需要：
1. Google Cloud 建项目 + 启用 Web Search Indexing API
2. 创建 OAuth 桌面客户端，下载 `client_secret.json` 放脚本旁
3. 本机装 `google-auth-oauthlib`、`google-api-python-client` 后运行
门槛较高，**普通自动收录用上面的 sitemap 提交就够**，API 方式留给以后批量推新页用。

---

## 七、⚠️ 如果 sitemap 显示「无法抓取」（2026-10-27 实测案例）

**现象**：GSC「站点地图」里提交后，状态显示「无法抓取」，已提交的网址数 0、类型「未知」。

**根因（已实测确认）**：
- 你的 GSC 属性是「网址前缀」形式，前缀为 `https://agengda-industrial-chiller.com/zh/`（带 `/zh/`）
- 在输入框填 `sitemap.xml`，GSC 会自动拼成 `https://agengda-industrial-chiller.com/zh/sitemap.xml`
- 实测该地址 **HTTP 404**（不存在）→ 谷歌抓不到 → 「无法抓取」
- 真正的 sitemap 在根目录 `https://agengda-industrial-chiller.com/sitemap.xml`（HTTP **200**，Content-Type `application/xml`，193 条 URL，格式合法）

**验证数据（2026-10-27 实测）**：

| 地址 | 状态 |
|---|---|
| `…/zh/sitemap.xml`（GSC 实际抓的） | 404 ❌ |
| `…/sitemap.xml`（真正的 sitemap） | 200 ✅ |
| `…/zh/`（中文首页） | 200 ✅ |

**修复（推荐：改用「网域」属性，一次覆盖全站 12 语言）**：
1. GSC 左上角属性下拉 → **「添加资源」**
2. 选 **「网域」(Domain)**，输入 `agengda-industrial-chiller.com`（**不要**带 `https://`、不要带路径）
3. 谷歌会给出一个 **TXT 记录**（形如 `google-site-verification=xxxx`）
4. 去 **Cloudflare** → 你的域名 → **DNS** → 添加记录：
   - 类型 `TXT`、名称 `@`、内容粘贴谷歌给的值、TTL 自动
5. 回 GSC 点 **「验证」**（一般几分钟到几小时生效）
6. 验证通过后，在**网域属性**下 → 站点地图 → 输入 `sitemap.xml` → 提交
   - 这次会拼成根地址 `https://agengda-industrial-chiller.com/sitemap.xml`，正确，193 条一次读取

> 备选方案：也可新增「网址前缀」根属性 `https://agengda-industrial-chiller.com/`（不带 `/zh/`），用 HTML 文件/meta 验证，效果与网域属性相同。

**不要在 `/zh/` 属性下硬提交**：即使填完整 URL，GSC 也要求 sitemap 必须在属性范围内，根 sitemap 不在 `/zh/` 内，仍会被拒。必须换属性。
