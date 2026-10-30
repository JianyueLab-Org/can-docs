import { execFileSync } from "node:child_process";

import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";

import zhCN from "../zh_CN/ui.json";
import enUS from "../en_US/ui.json";

// 会员文档站（规划中的 docs.ceruleanavi.net）。
//
// 正文原来是 can-web 的 /docs：src/content/docs/*.mdx，导航由
// src/lib/docsNav.ts 组织、栏目名来自 language/*.json。
//
// 目录按标准 locale 代码分：zh_CN/ 和 en_US/，每种语言的正文和壳文案
// （ui.json）都在自己的文件夹里，URL 就是 /zh_CN/... 和 /en_US/...。ui.json 的
// 键名沿用 can-web 词典里 docs.sections.* 和 frame.docs.* 的路径，两边可以直接
// 对着搬，读者看到的也是同一套名字。只有这两种语言；全网的站点清单不在这里，
// 来自 can-ui 的 sites.ts。
//
// 根目录 index.md 是语言分流页：没有哪种语言占着 /，进来的人由下面的脚本按浏览
// 器语言送去 /zh_CN/ 或 /en_US/。
//
// 中文是平台规章的正式文本。英文侧已经提供《平台总则》的英文译本；其他文档
// 尚无正式英文译本，因此英文导航继续指向 zh_CN/ 下的中文原文，并由英文首页说明。
//
// https://vitepress.dev/reference/site-config

type Dict = typeof zhCN;

/**
 * 文档现在的地址。中文使用 zh_CN/ 下的正式文本；英文侧仅已完成正式译文的
 * 《平台总则》使用 en_US/ 页面，其余页面继续指向中文原文。
 *
 * **规章的现行版本永远是 `regulation`**，归档里放被它取代的旧版本 —— 现在有三
 * 份。第二版原来不在这个仓库：它住在 can-web 的 `/docs/regulation_2nd`，是第三版
 * 生效之前约束成员的那一份。can-web 的 `/docs` 整段撤掉时它搬了过来，直接进归档。
 *
 * 第三版是最近一次换版进来的：《平台总则》（第四版）发布时，它从 `regulation.md`
 * 移到了 `archive/regulation_3rd.md`。**换版换的是文本，不是地址** —— 现行文本始终
 * 落在 `/zh_CN/regulation`，因为这个地址印在验证邮件里、写在 Discord 置顶里，而那
 * 些链接我们既删不掉也通知不到。所以新版本要写进 `zh_CN/regulation.md` 本身，而不
 * 是新开一个 `zh_CN/regulation/index.md` —— 后者的地址是 `/zh_CN/regulation/`，多
 * 一条斜杠，nginx 的 `try_files $uri $uri.html $uri/index.html` 会先命中
 * `regulation.html`，于是新版本静静地躺在一个没人会走到的地址上，而所有入口仍然指
 * 着旧文本。
 *
 * 归档不是收纳，是**接住站外引用**：`ceruleanavi.net/docs/regulation_2nd` 印在验证
 * 邮件里、写在 Discord 置顶里，can-web 那边的转发页把它送到这里。所以旧版本删不
 * 得，也不该悄悄改 —— 两份归档页都用 frontmatter 关掉了「在 GitHub 上编辑此页」。
 */
const DOC = {
  // 中文正式文本及尚无英文译本的页面。
  regulation: "/zh_CN/regulation",
  revisions: "/zh_CN/revisions",
  guidelines: "/zh_CN/atc",
  howToBecome: "/zh_CN/how-to-become-a-atc",
  trainingObserver: "/zh_CN/training-observer",
  instructorRatings: "/zh_CN/instructor-ratings",
  instructorQualification: "/zh_CN/instructor-qualification",
  instructorManagement: "/zh_CN/instructor-management",
  instructorTraining: "/zh_CN/instructor-training",
  atisPrompt: "/zh_CN/ATIS_prompt",
  history: "/zh_CN/history",
  privacy: "/zh_CN/privacy",
  // 归档：被现行规章取代的旧版本，新的在前。
  thirdEdition: "/zh_CN/archive/regulation_3rd",
  secondEdition: "/zh_CN/archive/regulation_2nd",
  firstEdition: "/zh_CN/archive/regulation",
};

function docsFor(locale: "zh_CN" | "en_US") {
  return {
    ...DOC,
    // 英文侧目前只有《平台总则》的正式译本。
    regulation: locale === "en_US" ? "/en_US/regulation" : DOC.regulation,
  };
}

/**
 * 按浏览器语言自动选语言。静态站没有服务端，所以放在 <head> 里同步跑，在首屏之
 * 前决定去留。几条克制的规则，避免比自动跳转更烦人的东西：
 *
 * * **只在 / 和两个语言首页上判断。** 文档页一律不跳 —— 正文只有中文，把点进
 *   /zh_CN/archive/regulation_2nd 的人送去 /en_US/ 是让他丢掉正要读的东西。
 * * **自动检测只发生在 /。** 直接打开 /zh_CN/ 或 /en_US/ 是明确的意思，不改。
 * * **?lang=zh / ?lang=en 是显式覆盖**，会记进 localStorage，之后一直按它来；
 *   自动检测的结果则不记，免得猜出来的偏好变成甩不掉的。根目录分流页上的两条
 *   链接就带着这个参数。
 */
const AUTO_LOCALE_SCRIPT = `(function () {
  try {
    var HOME = { zh: "/zh_CN/", en: "/en_US/" };
    var path = location.pathname.replace(/\\/+$/, "") || "/";
    var here = path === "/zh_CN" ? "zh" : path === "/en_US" ? "en" : path === "/" ? "" : null;
    if (here === null) return;
    var KEY = "can-docs:lang";
    var read = function (s, k) { try { return window[s].getItem(k); } catch (e) { return null; } };
    var go = function (want) { if (want !== here && HOME[want]) location.replace(HOME[want]); };
    var q = (location.search.match(/[?&]lang=([\\w-]+)/) || [])[1];
    if (q) {
      q = /^zh/i.test(q) ? "zh" : "en";
      try { localStorage.setItem(KEY, q); } catch (e) {}
      return go(q);
    }
    var saved = read("localStorage", KEY);
    if (saved) return go(saved);
    if (here !== "") return;
    // 全网共享的语言选择。另外六个站把它写在父域上（can-ui 的 ThemeLangControls），
    // 所以在主站上选过语言的人来到文档站，不该再被浏览器语言猜一次。
    //
    // 只在根路径上参考它，也就是上面那行守卫之后 —— 已经站在 /zh_CN/ 或 /en_US/
    // 上的人是自己走过来的，这时候再按 cookie 把他弹走就成了一个跳转环。
    //
    // 那边有四种 locale，这边只有两种：zh-cn / zh-tw 都是中文；en-us 和 ja-jp
    // 都落到英文，因为日文正文根本没有。
    var ck = (document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/) || [])[1];
    if (ck) return go(/^zh/i.test(decodeURIComponent(ck)) ? "zh" : "en");
    var langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ""];
    for (var i = 0; i < langs.length; i++) if (/^zh/i.test(langs[i])) return go("zh");
    // 浏览器一个语言都没报，就走默认的中文 —— 这个网络的默认语言是中文，
    // 文档正文也只有中文。
    go(langs.join("") ? "en" : "zh");
  } catch (e) {}
})();`;

/** 「在 GitHub 上编辑此页」指向的仓库。这一个是公开的，所以链接点得开。 */
const REPO = "https://github.com/JianyueLab-Org/can-docs";

/**
 * 构建时能不能拿到**完整的** git 历史。
 *
 * `lastUpdated` 的时间戳是 VitePress 拿 `git log` 逐个文件问出来的，所以它只在
 * 历史齐全时才是真的。两种情况下它会说谎或说不出话，都在这里挡掉：
 *
 * * **浅克隆。** `actions/checkout` 默认 `fetch-depth: 1`，仓库里只有一个提交，
 *   于是每一页都会写着本次部署的时间 —— 一条几个月没动过的规章显示「今天更
 *   新」。规章页上，错的日期比没有日期更糟。本仓库的 `deploy.yml` 传了
 *   `fetch-depth: 0`，这里挡的是它哪天被改回去。
 * * **git 不可用。** 构建镜像里没装 git、`.git` 没进 docker 构建上下文、或者
 *   git 因为 `.git` 属主和当前用户对不上拒绝工作（dubious ownership）—— 三种都
 *   会让 `git log` 失败。Dockerfile 里三件都处理了，这里同样是兜底。
 *
 * 判断不出来就返回 false：**宁可整站不显示日期，也不显示错的。** 关掉之后
 * `page.lastUpdated` 是空的，页脚那一行整条不渲染，不会留下半句话。
 */
function hasFullGitHistory(): boolean {
  let why: string;
  try {
    // 这一条命令同时验掉三件事：git 装了、当前目录是个能读的仓库、而且不是浅
    // 克隆。前两件失败会抛，第三件返回 "true"。
    const shallow = execFileSync(
      "git",
      ["rev-parse", "--is-shallow-repository"],
      {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      },
    );
    if (shallow.trim() === "false") return true;
    why = "仓库是浅克隆（checkout 的 fetch-depth 不是 0）";
  } catch {
    why = "跑不了 git（没装，或者这里不是个能读的仓库）";
  }
  // 日期整站消失是件不响的事，构建日志里得留一句，否则只能靠肉眼发现页脚少了一
  // 行、再从头查是哪一环。
  console.warn(`[can-docs] 关掉了 lastUpdated：${why}`);
  return false;
}

/** 两种语言的导航结构完全一样，只有文案不同 —— 写成一份，免得各自漂移。 */
function themeConfigFor(d: Dict, locale: "zh_CN" | "en_US") {
  const t = d.theme;
  const f = d.frame.docs;
  const doc = docsFor(locale);
  return {
    nav: [
      { text: t.nav.home, link: d.link },
      { text: t.nav.regulations, link: doc.regulation, activeMatch: "/regulation" },
      { text: t.nav.atcGuidelines, link: DOC.guidelines },
      { text: t.nav.about, link: DOC.history },
    ],
    sidebar: [
      {
        text: d.docs.sections.regulations.title,
        items: [
          { text: f.regulations.items.current, link: doc.regulation },
          { text: f.atc.items.professionalGuidelines, link: doc.guidelines },
          { text: f.atc.items.trainingObserver, link: doc.trainingObserver },
          {
            text: f.atc.items.instructorSystem,
            items: [
              { text: f.atc.items.instructorRatings, link: doc.instructorRatings },
              { text: f.atc.items.instructorQualification, link: doc.instructorQualification },
              { text: f.atc.items.instructorManagement, link: doc.instructorManagement },
              { text: f.atc.items.instructorTraining, link: doc.instructorTraining },
            ],
          },
          { text: f.regulations.items.revisions, link: doc.revisions },
        ],
      },
      {
        text: d.docs.sections.controllers.title,
        items: [
          { text: f.atc.items.howToBecome, link: doc.howToBecome },
        ],
      },
      {
        text: d.docs.sections.development.title,
        items: [{ text: f.atc.items.atisPrompt, link: doc.atisPrompt }],
      },
      {
        text: d.docs.sections.about.title,
        items: [
          { text: f.history.title, link: doc.history },
          { text: f.privacy.title, link: doc.privacy },
        ],
      },
      {
        text: d.docs.sections.archive.title,
        // 新的在前。
        items: [
          { text: f.editions.items.thirdEdition, link: doc.thirdEdition },
          { text: f.editions.items.secondEdition, link: doc.secondEdition },
          { text: f.editions.items.firstEdition, link: doc.firstEdition },
        ],
      },
    ],
    outline: { level: [2, 3] as [number, number], label: f.onThisPage },
    // 页脚的「在 GitHub 上编辑此页」。:path 换的是**源文件**的相对路径
    // （`page.filePath`，例如 zh_CN/regulation.md），不是浏览器地址栏里那个 —— 所
    // 以两种语言都指向 zh_CN/ 下的中文原文时，链接落在真正被读的那一篇上，而不是
    // 当前语言目录下并不存在的文件。归档页用 frontmatter 的 editLink: false 单独
    // 关掉了：它是被现行规章取代的旧版本，是份记录，不该被「订正」。
    editLink: { pattern: `${REPO}/edit/main/:path`, text: t.editLinkText },
    lastUpdated: {
      // **VitePress 2 删掉了顶层的 lastUpdatedText**，文案改从这里走。旧键留在
      // 配置里不报错也不生效，只会一直显示内置的英文 "Last updated"。
      text: t.lastUpdatedText,
      // formatOptions 是**整体替换**默认值（`{ dateStyle, timeStyle }`）而不是合
      // 并，所以不写 timeStyle 就只剩日期 —— 规章页上「几点几分」是噪声。
      formatOptions: {
        dateStyle: "long" as const,
        // 按**页面**语言格式化，不按访客浏览器的。正文只有中文、两种语言都指向
        // 它，日期跟着页面走才不会一页之内两种写法。
        forceLocale: true,
      },
    },
    docFooter: t.docFooter,
    sidebarMenuLabel: t.sidebarMenuLabel,
    returnToTopLabel: t.returnToTopLabel,
    skipToContentLabel: t.skipToContentLabel,
    notFound: t.notFound,
  };
}

export default defineConfig({
  // 分流页 / 不属于任何一种语言，用的是这一层的 lang / title。
  lang: zhCN.lang,
  title: zhCN.docs.title,
  // 标题格式「<页面> · <站名>」按语言写在 locales 里；根目录分流页自己关掉后缀。
  // 明暗由 can-ui 管（见 head 里的脚本），VitePress 自带的外观开关不用。
  appearance: false,
  description: zhCN.docs.description,
  cleanUrls: true,
  // 当初关掉它的两个前提条件现在都补上了：Dockerfile 装了 git 并且 .git 进了构
  // 建上下文，deploy.yml 给组织那份 deploy-k8s.yml 传了 fetch-depth: 0。**但开关
  // 不写死成 true** —— 这两件事都在这个文件管不着的地方，任何一处退回去，写死的
  // true 就会让全站每一页都显示本次部署的时间。让构建自己去看历史在不在：
  // 见 hasFullGitHistory()。
  lastUpdated: hasFullGitHistory(),
  // README.md 是写给维护者的，VitePress 默认会把它当成 / 的别名，
  // 和分流页 index.md 撞车。
  srcExclude: ["README.md"],
  // `:::warning` 不写标题时的默认标题，按语言给。VitePress 内置的是英文大写
  // （WARNING），中文页上要换成中文。写在这里而不是 locales.<index>.markdown：
  // 本地搜索的插件先建好 markdown 渲染器并被后面复用，它只读这一层，不合并
  // locales 里的那份，写在那里构建出来仍是 WARNING。
  markdown: {
    locales: {
      zh_CN: { container: zhCN.theme.container },
      en_US: { container: enUS.theme.container },
    },
  },
  // 顶栏是 can-ui CanFrame 的。VitePress 自己的 VPNav 必须**不渲染**，而不是用
  // CSS 藏起来：藏起来的 VPNav 里还挂着第二个搜索按钮，它和 DocsSearch 各在
  // window 上注册一次 "/"，按一下就开两个搜索框；另外还留着一份语言切换和
  // VPNavScreen。navbar: false 让 VPNav 整个不挂载，代价是 VitePress 会给 <html>
  // 加上 hide-nav，把 --vp-nav-height 改成 0 —— style.css 里把它改回 64px。
  transformPageData(pageData) {
    pageData.frontmatter.navbar = false;
  },
  vite: {
    plugins: [tailwindcss()],
    // can-ui 发的是源码（.vue / .ts），SSR 时 Node 不能直接 import，必须打进包里。
    ssr: { noExternal: ["@jianyuelab-org/can-ui"] },
  },

  head: [
    // can-ui ThemeScript 的同一段逻辑：cookie theme → localStorage theme → 系统。
    // VitePress 的 appearance 关掉了，明暗由 can-ui 管，class 都是 html.dark。
    ["script", {}, `(()=>{try{var m=document.cookie.match(/(?:^|;\\s*)theme=([^;]*)/);var s=m?decodeURIComponent(m[1]):localStorage.getItem("theme");var d=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})();`],
    // media 写在第一个：VitePress 的 mergeHead 按 meta 的第一个属性去重，name 在
    // 前的话两条 theme-color 只剩最后一条。
    ["meta", { media: "(prefers-color-scheme: light)", name: "theme-color", content: "#ffffff" }],
    ["meta", { media: "(prefers-color-scheme: dark)", name: "theme-color", content: "#0b0f14" }],
    ["script", {}, AUTO_LOCALE_SCRIPT],
    // 站点图标。文档站原先一个都没有，浏览器标签上是 VitePress 的默认图标 ——
    // 六个 Web 组件里只有这一个还在用别人的标志。
    //
    // svg 放在最前：支持的浏览器会优先取它，一个矢量图在任何缩放下都清楚；不
    // 支持的（Safari 一直到 16）会往下退到 32 的 png。
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32.png",
      },
    ],
    // iOS 不认 alpha，会把透明合到黑底上，所以这张是不透明的。
    [
      "link",
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
    ],
    ["link", { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" }],
  ],

  locales: {
    zh_CN: {
      label: zhCN.label,
      lang: zhCN.lang,
      link: zhCN.link,
      title: zhCN.docs.title,
      titleTemplate: `:title · ${zhCN.docs.title}`,
      description: zhCN.docs.description,
      themeConfig: themeConfigFor(zhCN, "zh_CN"),
    },
    en_US: {
      label: enUS.label,
      lang: enUS.lang,
      link: enUS.link,
      title: enUS.docs.title,
      titleTemplate: `:title · ${enUS.docs.title}`,
      description: enUS.docs.description,
      themeConfig: themeConfigFor(enUS, "en_US"),
    },
  },

  // 这一层会并进每种语言的 themeConfig。
  themeConfig: {
    // 标记而不是完整锁定：VitePress 会把它排在站名左边，而站名已经把话说全了。
    // 标记是两支品牌蓝，深浅色下都成立，所以这里不需要跟着主题换图。
    logo: "/logo.png",

    // 英文侧现在只有一个首页，正文还是中文原文。默认的 i18nRouting 会把
    // /zh_CN/archive/regulation_2nd 换成 /en_US/archive/regulation_2nd —— 那是个 404。关掉之后
    // 切换语言回到该语言的首页。译文落地后再打开。
    i18nRouting: false,

    search: {
      provider: "local",
      options: {
        miniSearch: {
          options: {
            // minisearch 默认按空白切词，一整段中文会变成一个词，搜什么都
            // 搜不到。这里按字建索引：每个汉字一个词，拉丁字母和数字仍按连
            // 续片段。写成不带后行断言的形式，旧版 Safari 也能解析 —— 这个
            // 函数会被序列化进客户端包，在浏览器里 new Function 出来。
            tokenize: (text) => text.match(/\p{sc=Han}|[\p{L}\p{N}]+/gu) ?? [],
          },
        },
        // 解析顺序是 locales[当前语言].translations → translations → 内置默
        // 认值，所以这里的中文是兜底，英文在下面覆盖。
        translations: zhCN.theme.search,
        locales: { en_US: { translations: enUS.theme.search } },
      },
    },
  },
});
