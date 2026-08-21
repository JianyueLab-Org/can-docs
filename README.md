# can-docs

Cerulean Aviation Network 的会员文档站，VitePress。规划中的地址是
`docs.ceruleanavi.net`（域名尚未解析）。

## 目录结构

按标准 locale 代码分目录，每种语言的正文和壳文案都在自己的文件夹里，URL 就是目
录名：

```
index.md               语言分流页（/，不属于任何语言）
zh_CN/
  ui.json              该语言的壳文案（导航、侧栏、搜索、页脚、404…）
  index.md             /zh_CN/
  regulation.md        /zh_CN/regulation              平台总则（现行，第四版）
  atc.md               /zh_CN/atc                     管制员准则
  history.md           /zh_CN/history                 平台的历史
  archive/
    regulation_3rd.md  /zh_CN/archive/regulation_3rd  规章制度 第三版（已归档）
    regulation_2nd.md  /zh_CN/archive/regulation_2nd  规章制度 第二版（已归档）
    regulation.md      /zh_CN/archive/regulation      规章制度 第一版（已归档）
en_US/
  ui.json
  index.md             /en_US/
```

`ui.json` 的键名沿用 can-web 词典里 `docs.sections.*` 和 `frame.docs.*` 的路径，
两边可以直接对着搬；`.vitepress/config.mts` 只从这两份文件里取字，导航结构本身
写成一份共用的 `themeConfigFor()`，免得各语言各自漂移。两份词典的键必须一一对
应，链接地址集中在 `config.mts` 顶部的 `DOC` 里。

## 内容从哪来

`atc.md`、`history.md` 和归档的 `archive/regulation.md` 来自 can-web 的 `/docs`
版块（`src/content/docs/*.mdx`），**正文一字未改**：

| 本站路径                       | 原路径                 | 原文件                                |
| ------------------------------ | ---------------------- | ------------------------------------- |
| `/zh_CN/atc`                   | `/docs/atc`            | `src/content/docs/atc.mdx`            |
| `/zh_CN/history`               | `/docs/history`        | `src/content/docs/history.mdx`        |
| `/zh_CN/archive/regulation`    | `/docs/regulation_1st` | `src/content/docs/regulation_1st.mdx` |

迁移时只改了两处**呈现**，没有改任何规章文字：

1. 规章末尾的管理组名单原本是一段 JSX（`<div className="overflow-x-auto">` 加一
   堆 Tailwind class）。`className` 和那些 class 在 VitePress 里都不存在，所以换
   成原生 markdown 表格 —— VitePress 自己会把表格渲染成 `<table tabindex="0">`，
   横向滚动和 can-web 的 `rehypeScrollableTables` 是一回事。
2. 名单里有两格把两个邮箱塞进了同一个 `mailto:` 链接（`href` 只指向第一个，第二
   个是纯文本却看着像链接）。拆成了两个各自正确的 `mailto:`。

`zh_CN/regulation.md` 不是迁移来的，是管理组自己修订的文本。它现在是**第四版**，
标题《Cerulean Aviation Network 平台总则》，按章—条—款—项写成法条体：九章五十二
条，其中第四章「管制员准则」和第三章里的飞行细则（RVSM 高度层、SID／STAR、管制空
域、倍速、30 秒起飞、40 秒脱离跑道、50 米滑行间隔、单一有效连接）是这一版补进来
的。

**换版换的是文本，不是地址。** 现行文本永远写在 `zh_CN/regulation.md`，被它取代的
那一版移进 `archive/`：第四版发布时，第三版从这里移到了
`archive/regulation_3rd.md`。`/zh_CN/regulation` 这个地址被验证邮件和 Discord 置顶
引用着，删不掉也通知不到，所以新版本不能另开一个 `zh_CN/regulation/` 目录了事 ——
那样地址会变成 `/zh_CN/regulation/`（多一条斜杠），而 `deploy/nginx.conf` 的
`try_files $uri $uri.html $uri/index.html` 会先命中 `regulation.html`，结果是新文本
躺在一个没人走得到的地址上，所有入口仍然指着旧文本，而且构建和 `bun run lint` 都
不会有任何抱怨（门禁不检查 `index.md` 是否孤立）。

第二版原本也不在本站，只在 can-web 的 `/docs/regulation_2nd`；那一段撤掉时它搬了过
来，现在是 `archive/regulation_2nd.md`。

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

## 页脚：最后更新时间和「在 GitHub 上编辑此页」

每篇文档的页脚有两行：这一页最后改动的日期，和一条指回 GitHub 编辑界面的链接。
规章是有处分效力的文本，「我看到的是不是现行版本」是读者第一个要问的问题，所以日
期比在别处更要紧 —— 也正因如此，**错的日期比没有日期更糟**。

**日期不是写在文件里的，是 VitePress 拿 `git log` 逐个文件问出来的。** 这就把一
个页面元素变成了对构建环境的要求，而且三处都在这个文件之外，缺一样就不成立：

| 在哪 | 要什么 | 缺了会怎样 |
| --- | --- | --- |
| `.github/workflows/deploy.yml` | 给组织那份 `deploy-k8s.yml` 传 `fetch-depth: 0` | checkout 默认只给一个提交，**每一页都显示本次部署的时间** |
| `Dockerfile` | 构建阶段 `apt-get install git` | `oven/bun` 里没有 git，`git log` 一律失败 |
| `.dockerignore` | **不要**排除 `.git` | 容器里没有仓库可问，同上 |

`fetch-depth` 是 `JianyueLab-Org/actions` 那份复用工作流上的一个输入，默认仍是
`1`：整个网络里只有文档站需要完整历史，别的仓库不必为它多付一次全量 fetch。

三处任何一处退回去，`config.mts` 里的 `hasFullGitHistory()` 会**把 lastUpdated 整
个关掉**，并在构建日志里写一行原因。宁可整站不显示日期，也不显示错的 —— 所以开关
没有写死成 `true`，而是让构建自己去看历史在不在。页脚那行会整条消失，不会留下半
句话。

编辑链接指向 `main` 分支上的**源文件**（`:path` 取的是 `page.filePath`），所以两
种语言都指着 `zh_CN/` 下的中文原文时，点过去落在真正被读的那一篇上。归档页用
frontmatter 里的 `editLink: false` 单独关掉了：它是被现行规章取代的旧版本，是份记
录，不该被「订正」。

两行的文案都在 `ui.json` 的 `theme.lastUpdatedText` / `theme.editLinkText` 里。注
意 **VitePress 2 删掉了 `themeConfig.lastUpdatedText`**，文案改从
`themeConfig.lastUpdated.text` 走；旧键留着不报错也不生效，只会一直显示内置的英文
`Last updated`。中文那句是「最后更新」而不是「最后更新于」，因为主题在文案后面硬
编码了一个冒号。

## 语言

目前两种：`zh_CN`（简体中文）和 `en_US`（English）。can-web 还有 ja-JP 和
zh-TW，要加的时候复制一份 `ja_JP/ui.json`、在 `config.mts` 的 `locales` 里登
记、补一个 `ja_JP/index.md` 就行 —— 文案在 can-web 的 `language/ja-jp.json`、
`language/zh-tw.json` 里都有现成的。

**壳翻译了，正文没有。** 文档只有中文原文：规章是有处分效力的文本，非官方译本不
该由这里直接发布。所以英文侧只有一个首页，导航和侧栏指向 `zh_CN/` 下的中文页
面，`/en_US/` 首页上写明了这一点。`themeConfig.i18nRouting` 因此设成 `false` ——
默认行为是切换语言时把 `/zh_CN/regulation` 换成 `/en_US/regulation`，那个文件不
存在，会 404；关掉之后切换语言落在该语言的首页。

译文落地时要做三件事：把 `config.mts` 里的 `DOC` 换成 `/<locale>/<slug>`、删掉
各语言首页上「只有中文」的说明、把 `i18nRouting` 打开。

### 按浏览器语言自动选择

`/` 不属于任何一种语言，是一张分流页；`config.mts` 里的 `AUTO_LOCALE_SCRIPT` 放
在 `<head>` 同步执行，在首屏之前决定去 `/zh_CN/` 还是 `/en_US/`。静态站没有服务
端，所以这件事只能在客户端做。几条克制的规则：

- **只在 `/` 和两个语言首页上判断。** 文档页一律不跳 —— 正文只有中文，把点进
  `/zh_CN/regulation` 的人送去 `/en_US/` 是让他丢掉正要读的东西。
- **自动检测只发生在 `/`。** 直接打开 `/zh_CN/` 或 `/en_US/` 是明确的意思，不
  改，所以在英文首页上切回简体中文不会被脚本弹回去。
- **`?lang=zh` / `?lang=en` 是显式覆盖**，会记进 `localStorage`，之后一直按它
  来；自动检测的结果**不记**，免得猜出来的偏好变成甩不掉的。分流页上那两条链接
  就带着这个参数。
- `navigator.languages` 里有任何 `zh*` 就去中文；一个语言都没报（少见）落回中
  文，因为这个网络的默认语言是中文。
- 脚本没跑起来时，分流页上那两条链接就是退路。

## 还没做的收尾

站点还没部署，`docs.ceruleanavi.net` 目前不解析。在它上线**之前**不要动 can-web 的
`/docs`，否则规章会直接 404。上线之后要做的是：

1. `astro.config.mjs` 的 `redirects` 里把 `/docs/*` 301 过来：`/docs/atc` →
   `/zh_CN/atc`、`/docs/history` → `/zh_CN/history`、`/docs/regulation_1st` →
   `/zh_CN/archive/regulation`、`/docs/regulation_2nd` →
   `/zh_CN/archive/regulation_2nd`。**第二版指向归档而不是现行文本**：那个地址
   点的是一个特定版本，把来查某一条的人送到另一份文本上，比多点一次更糟。
2. 删掉 `src/pages/docs/`、`src/content/docs/`、`src/content.config.ts` 里的
   `docs` collection、`src/lib/docsNav.ts`，以及 `language/*.json` 里的
   `docs.*` / `frame.docs.*`（`DocsLayout.astro` 还被分部规则和培训材料用着，
   不能一起删）。
3. 站内指向 `/docs` 的链接改成新域名：`Header.vue`、`Footer.astro`、
   `PilotsShell.vue`、`ControllersShell.vue`、`ExamsShell.vue`、
   `pages/index.astro`、`pages/404.astro`、`Exams.vue`。
4. `src/middleware.ts` 的 `PROTECTED_PREFIXES` 去掉 `/docs`。

**第 4 条会改变访问模型。** can-web 的 `/docs` 在 `PROTECTED_PREFIXES` 里，匿名访
客会被弹去 `/signin`。本站不该继承这件事：总则第四条写的是「用户注册账号，即视为
同意遵守本总则」，一份注册前就该读得到的文本，放在登录墙后面是自相矛盾的。公开大
概率是想要的结果，但这是一个要有意识做出的决定。
