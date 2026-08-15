# can-docs

Cerulean Aviation Network 的会员文档站，VitePress。规划中的地址是
`docs.airwaysn.org`（域名尚未解析）。

## 目录结构

按标准 locale 代码分目录，每种语言的正文和壳文案都在自己的文件夹里，URL 就是目
录名：

```
index.md            语言分流页（/，不属于任何语言）
zh_CN/
  ui.json           该语言的壳文案（导航、侧栏、搜索、页脚、404…）
  index.md          /zh_CN/
  regulation_2nd.md /zh_CN/regulation_2nd
  regulation_1st.md
  atc.md
  history.md
en_US/
  ui.json
  index.md          /en_US/
```

`ui.json` 的键名沿用 can-web 词典里 `docs.sections.*` 和 `frame.docs.*` 的路径，
两边可以直接对着搬；`.vitepress/config.mts` 只从这两份文件里取字，导航结构本身
写成一份共用的 `themeConfigFor()`，免得各语言各自漂移。两份词典的键必须一一对
应。

## 内容从哪来

正文原来是 can-web 的 `/docs` 版块：`can-web/src/content/docs/*.mdx`，由
`src/lib/docsNav.ts` 组织导航、`language/*.json` 提供栏目名。四篇文档整段照搬过
来，**正文一字未改**：

| 本站路径                 | 原路径                 | 原文件                                |
| ------------------------ | ---------------------- | ------------------------------------- |
| `/zh_CN/regulation_2nd`  | `/docs/regulation_2nd` | `src/content/docs/regulation_2nd.mdx` |
| `/zh_CN/regulation_1st`  | `/docs/regulation_1st` | `src/content/docs/regulation_1st.mdx` |
| `/zh_CN/atc`             | `/docs/atc`            | `src/content/docs/atc.mdx`            |
| `/zh_CN/history`         | `/docs/history`        | `src/content/docs/history.mdx`        |

**slug 没变**，只是前面换了语言目录，所以主站的 `/docs/<slug>` 可以一对一跳到
`/zh_CN/<slug>`。侧栏的分组名（规章制度 / 管制员 / 关于）和条目名（第二版 / 第
一版 / 职业准则 / 平台的历史）也沿用 `zh-cn.json` 里 `docs.sections.*` 和
`frame.docs.*` 的原文。

迁移时只改了两处**呈现**，没有改任何规章文字：

1. 两版规章末尾的管理组名单原本是一段 JSX（`<div className="overflow-x-auto">`
   加一堆 Tailwind class）。`className` 和那些 class 在 VitePress 里都不存在，
   所以换成原生 markdown 表格 —— VitePress 自己会把表格渲染成
   `<table tabindex="0">`，横向滚动和 can-web 的 `rehypeScrollableTables` 是一
   回事。
2. 名单里有两格把两个邮箱塞进了同一个 `mailto:` 链接（`href` 只指向第一个，第
   二个是纯文本却看着像链接）。拆成了两个各自正确的 `mailto:`。

## 没有迁过来的

- **`can-web/docs/*.md`**（`apis.md`、`database.md`、`oauth.md`、
  `roster-promotion-api.md`）是写给开发者的跨仓契约文档，链接直接指向
  `../src/`，属于代码的一部分，留在 can-web。
- **`src/content/rules/`（分部管制规则）和 `src/content/training/`（分部培训材
  料）**留在 can-web。它们挂在 `/controllers/rules` 和 `/exams/training` 下，靠
  can-api 的会话和分部权限决定谁能看，不是公开文档。

## 命令

```bash
bun install
bun run docs:dev       # 本地预览
bun run docs:build     # 构建到 .vitepress/dist
bun run docs:preview   # 预览构建产物
```

搜索是 VitePress 自带的本地搜索，按语言分别建索引。中文要额外配一个分词器：
minisearch 默认按空白切词，一整段中文会变成一个词，搜什么都搜不到。
`.vitepress/config.mts` 里按字建索引（每个汉字一个词，拉丁字母数字仍按连续片
段），这个函数会被序列化进客户端包、在浏览器里 `new Function` 出来，所以写成了
不带后行断言的形式，旧一点的 Safari 也能解析。

## 语言

目前两种：`zh_CN`（简体中文）和 `en_US`（English）。can-web 还有 ja-JP 和
zh-TW，要加的时候复制一份 `ja_JP/ui.json`、在 `config.mts` 的 `locales` 里登
记、补一个 `ja_JP/index.md` 就行 —— 文案在 can-web 的 `language/ja-jp.json`、
`language/zh-tw.json` 里都有现成的。

**壳翻译了，正文没有。** 四篇文档只有中文原文：规章是有处分效力的文本，非官方译
本不该由这里直接发布。所以英文侧只有一个首页，导航和侧栏指向 `zh_CN/` 下的中文
页面，`/en_US/` 首页上写明了这一点。`themeConfig.i18nRouting` 因此设成
`false` —— 默认行为是切换语言时把 `/zh_CN/regulation_2nd` 换成
`/en_US/regulation_2nd`，那个文件不存在，会 404；关掉之后切换语言落在该语言的首
页。

译文落地时要做三件事：把 `config.mts` 里的 `DOC` 换成 `/<locale>/<slug>`、删掉
各语言首页上「只有中文」的说明、把 `i18nRouting` 打开。

### 按浏览器语言自动选择

`/` 不属于任何一种语言，是一张分流页；`config.mts` 里的 `AUTO_LOCALE_SCRIPT` 放
在 `<head>` 同步执行，在首屏之前决定去 `/zh_CN/` 还是 `/en_US/`。静态站没有服务
端，所以这件事只能在客户端做。几条克制的规则：

- **只在 `/` 和两个语言首页上判断。** 文档页一律不跳 —— 正文只有中文，把点进
  `/zh_CN/regulation_2nd` 的人送去 `/en_US/` 是让他丢掉正要读的东西。
- **自动检测只发生在 `/`。** 直接打开 `/zh_CN/` 或 `/en_US/` 是明确的意思，不
  改，所以在英文首页上切回简体中文不会被脚本弹回去。
- **`?lang=zh` / `?lang=en` 是显式覆盖**，会记进 `localStorage`，之后一直按它
  来；自动检测的结果**不记**，免得猜出来的偏好变成甩不掉的。分流页上那两条链接
  就带着这个参数。
- `navigator.languages` 里有任何 `zh*` 就去中文；一个语言都没报（少见）落回中
  文，因为这个网络的默认语言是中文。
- 脚本没跑起来时，分流页上那两条链接就是退路。

`.vitepress/dist/index.html` 里那段脚本可以直接抽出来跑
（12 个分支的用例见提交记录里的说明），改动它之后建议照样验一遍。

## 还没做的收尾

站点还没部署，`docs.airwaysn.org` 目前不解析。在它上线**之前**不要动 can-web 的
`/docs`，否则规章会直接 404。上线之后要做的是：

1. `astro.config.mjs` 的 `redirects` 里把 `/docs` 和 `/docs/<slug>` 301 到
   `docs.airwaysn.org/zh_CN/<slug>` —— 这四个地址在站外被引用过。
2. 删掉 `src/pages/docs/`、`src/content/docs/`、`src/content.config.ts` 里的
   `docs` collection、`src/lib/docsNav.ts`，以及 `language/*.json` 里的
   `docs.*` / `frame.docs.*`（`DocsLayout.astro` 还被分部规则和培训材料用着，
   不能一起删）。
3. 站内指向 `/docs` 的链接改成新域名：`Header.vue`、`Footer.astro`、
   `PilotsShell.vue`、`ControllersShell.vue`、`ExamsShell.vue`、
   `pages/index.astro`、`pages/404.astro`、`Exams.vue`。
4. `src/middleware.ts` 的 `PROTECTED_PREFIXES` 去掉 `/docs`。

**注意第 4 条会改变访问模型。** can-web 的 `/docs` 现在在 `PROTECTED_PREFIXES`
里，匿名访客会被弹去 `/signin`；而首页和公开页头都链着它，所以未登录的人点「文
档」实际是进不去的。这个站是公开的 —— 规章第一句就是「若您在平台上注册账号，即
表示您同意遵守本规章制度」，注册前就该读得到，公开大概率是想要的结果，但这是一
个要有意识做出的决定。
