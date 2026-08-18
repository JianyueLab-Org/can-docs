import { execFileSync } from "node:child_process";

import { defineConfig } from "vitepress";

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
// 对着搬，读者看到的也是同一套名字。can-web 还有 ja-JP 和 zh-TW，要加的时候复
// 制一份 ja_JP/ui.json、在 locales 里登记、补一个 ja_JP/index.md 就行 —— 文案
// 在 can-web 的 language/ja-jp.json、language/zh-tw.json 里有现成的。
//
// 根目录 index.md 是语言分流页：没有哪种语言占着 /，进来的人由下面的脚本按浏览
// 器语言送去 /zh_CN/ 或 /en_US/。
//
// **这只是语言骨架。** 四篇文档还只有中文原文：规章是有处分效力的文本，译本要
// 管理组认过才能发。所以英文侧只有首页，导航指向 zh_CN/ 下的中文页面，/en_US/
// 首页也写明了这件事。译文落地时要做三件事：把 DOC 换成 /<locale>/<slug>、删掉
// 首页的说明、把 i18nRouting 打开。
//
// https://vitepress.dev/reference/site-config

type Dict = typeof zhCN;

/**
 * 文档现在的地址。译文落地前，两种语言都指向 zh_CN/ 下的中文原文。
 *
 * **规章的现行版本永远是 `regulation`**，归档里放被它取代的旧版本 —— 现在有两
 * 份。第二版原来不在这个仓库：它住在 can-web 的 `/docs/regulation_2nd`，是
 * `regulation` 生效之前约束成员的那一份。can-web 的 `/docs` 整段撤掉时它搬了过
 * 来，直接进归档。
 *
 * 归档不是收纳，是**接住站外引用**：`ceruleanavi.net/docs/regulation_2nd` 印在验证
 * 邮件里、写在 Discord 置顶里，can-web 那边的转发页把它送到这里。所以旧版本删不
 * 得，也不该悄悄改 —— 两份归档页都用 frontmatter 关掉了「在 GitHub 上编辑此页」。
 */
const DOC = {
  // 现行有效的规章。
  regulation: "/zh_CN/regulation",
  guidelines: "/zh_CN/atc",
  history: "/zh_CN/history",
  // 归档：被现行规章取代的旧版本，新的在前。
  secondEdition: "/zh_CN/archive/regulation_2nd",
  firstEdition: "/zh_CN/archive/regulation",
};

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
 * 网络上的其它站，分三组 —— 导航里的「全网」下拉。
 *
 * ## 为什么要有
 *
 * 这个站从前只有一条外链：「主站」。一个正在读规章的管制员要去开 ATIS，或者一个
 * 读完飞行员须知的人要去填飞行计划，都得先回主站再找一次，或者干脆背下主机名。
 * 全网另外六个站现在共用 can-ui 的一份站点清单，这里是同一份清单在 VitePress 上
 * 的样子。
 *
 * ## 为什么是抄的，而不是 import
 *
 * **`@jianyuelab-org/can-ui/sites` 才是这份清单的来源之记录。** 这里没有 import
 * 它，是因为这个站是全网唯一一个**零依赖**的：它不是 Astro + Vue，用的是
 * VitePress 自带的主题，一个 can-ui 组件都渲染不了，只会用到那个纯数据模块。而
 * can-ui 装在 GitHub Packages 上，即使公开包也要带令牌 —— 为一张六行的表给一个
 * 静态站接上 `.npmrc`、Docker 构建密钥和 CI 令牌，代价大于收益。
 *
 * 代价是这是一份**副本**，而副本会漂。所以两件事写在这里：改 `sites.ts` 的人要
 * 顺手看一眼这里（`can-web/src/lib/atcRules.ts` 是同一种「索引副本」，理由也一
 * 样），而 `scripts/check.ts` 会验这份表本身立不立得住 —— 每个键在两本词典里都
 * 有名字、每个 origin 都是 https 且不含空格。**最后那一条不是多余的**：主站和
 * can-dev 的页脚里都躺过 `https://github.com/Cerulean Aviation Network/`，URL 里
 * 带两个空格，改名时全局替换的残骸，因为没有任何东西会检查一个长得像 URL 的字
 * 符串。
 *
 * ## 少了三个站
 *
 * 教员与管理门户和航行资料库按评级才出现，而这是个**静态站**：会话 cookie 是
 * HttpOnly 的，构建时和浏览器里都问不出读者是谁。给所有人画两条大多数人点下去
 * 会被拒的链接，不如不画 —— can-ui 的 `minRating` 就是为这件事存在的。文档站自
 * 己是当前站，也不列。
 *
 * 剩下六条里有三条要登录（EFB、管制员中心、考试中心）。那不是死链：未登录点过去
 * 会被送到主站的登录页并带上回跳地址，登录完就到了。
 */
const NETWORK_SECTIONS: ReadonlyArray<{
  section: "flight" | "atc" | "network";
  sites: ReadonlyArray<{ key: string; origin: string }>;
}> = [
  {
    section: "flight",
    sites: [
      { key: "efb", origin: "https://efb.ceruleanavi.net" },
      { key: "radar", origin: "https://radar.ceruleanavi.net" },
    ],
  },
  {
    section: "atc",
    sites: [
      { key: "controller", origin: "https://controller.ceruleanavi.net" },
      { key: "exam", origin: "https://exam.ceruleanavi.net" },
    ],
  },
  {
    section: "network",
    sites: [
      { key: "web", origin: "https://ceruleanavi.net" },
      // 开发者中心的落点是 /docs（接口文档），不是它的首页 —— can-ui 的
      // `NETWORK_SITES` 里这一条也带着这个路径。
      { key: "dev", origin: "https://platform.ceruleanavi.net/docs" },
    ],
  },
];

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
    const shallow = execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
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
function themeConfigFor(d: Dict) {
  const t = d.theme;
  const f = d.frame.docs;
  return {
    nav: [
      { text: t.nav.home, link: d.link },
      {
        text: d.docs.sections.regulations.title,
        link: DOC.regulation,
        // 不带锚，所以归档里的旧版页面也算在这一项下面。
        activeMatch: "/regulation",
      },
      { text: d.docs.sections.controllers.title, link: DOC.guidelines },
      { text: d.docs.sections.about.title, link: DOC.history },
      // 全网。从前这里是一条孤零零的「主站」—— 也是走出文档站的唯一一条路。换
      // 成一个下拉之后，分组和另外六个站的页脚栏目是同一套（飞行 / 管制 /
      // 网络），一个人在主站上认得的形状，到这里还认得。
      {
        text: t.network.label,
        items: NETWORK_SECTIONS.map((group) => ({
          text: t.network.sections[group.section],
          items: group.sites.map((site) => ({
            text: t.network.sites[site.key as keyof typeof t.network.sites],
            link: site.origin,
          })),
        })),
      },
    ],
    sidebar: [
      // 规章只有一篇，就是顶层直链，不套一层同名的分组。旧版本在下面的归档里。
      { text: d.docs.sections.regulations.title, link: DOC.regulation },
      {
        text: d.docs.sections.controllers.title,
        items: [
          { text: f.atc.items.professionalGuidelines, link: DOC.guidelines },
        ],
      },
      {
        text: d.docs.sections.about.title,
        items: [{ text: f.history.title, link: DOC.history }],
      },
      {
        text: d.docs.sections.archive.title,
        // 新的在前。
        items: [
          { text: f.editions.items.secondEdition, link: DOC.secondEdition },
          { text: f.editions.items.firstEdition, link: DOC.firstEdition },
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
        dateStyle: "long",
        // 按**页面**语言格式化，不按访客浏览器的。正文只有中文、两种语言都指向
        // 它，日期跟着页面走才不会一页之内两种写法。
        forceLocale: true,
      },
    },
    docFooter: t.docFooter,
    darkModeSwitchLabel: t.appearance.label,
    lightModeSwitchTitle: t.appearance.lightTitle,
    darkModeSwitchTitle: t.appearance.darkTitle,
    sidebarMenuLabel: t.sidebarMenuLabel,
    returnToTopLabel: t.returnToTopLabel,
    langMenuLabel: t.langMenuLabel,
    skipToContentLabel: t.skipToContentLabel,
    footer: t.footer,
    notFound: t.notFound,
  };
}

export default defineConfig({
  // 分流页 / 不属于任何一种语言，用的是这一层的 lang / title。
  lang: zhCN.lang,
  title: zhCN.docs.title,
  // 与主站 /docs 时期一致的标题格式：「<文档名> · Cerulean Aviation Network」
  titleTemplate: ":title · Cerulean Aviation Network",
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

  head: [
    ["script", {}, AUTO_LOCALE_SCRIPT],
    // 站点图标。文档站原先一个都没有，浏览器标签上是 VitePress 的默认图标 ——
    // 六个 Web 组件里只有这一个还在用别人的标志。
    //
    // svg 放在最前：支持的浏览器会优先取它，一个矢量图在任何缩放下都清楚；不
    // 支持的（Safari 一直到 16）会往下退到 32 的 png。
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" }],
    // iOS 不认 alpha，会把透明合到黑底上，所以这张是不透明的。
    ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }],
  ],

  locales: {
    zh_CN: {
      label: zhCN.label,
      lang: zhCN.lang,
      link: zhCN.link,
      title: zhCN.docs.title,
      description: zhCN.docs.description,
      themeConfig: themeConfigFor(zhCN),
    },
    en_US: {
      label: enUS.label,
      lang: enUS.lang,
      link: enUS.link,
      title: enUS.docs.title,
      description: enUS.docs.description,
      themeConfig: themeConfigFor(enUS),
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
