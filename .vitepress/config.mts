import { defineConfig } from "vitepress";

import zhCN from "../zh_CN/ui.json";
import enUS from "../en_US/ui.json";

// 会员文档站（规划中的 docs.airwaysn.org）。
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

/** 文档现在的地址。译文落地前，两种语言都指向 zh_CN/ 下的中文原文。 */
const DOC = {
  regulation: "/zh_CN/regulation",
  guidelines: "/zh_CN/atc",
  history: "/zh_CN/history",
  // 归档：被现行规章取代的旧版本，留着是因为站外引用过。
  firstEdition: "/zh_CN/archive/regulation",
};

/**
 * 按浏览器语言自动选语言。静态站没有服务端，所以放在 <head> 里同步跑，在首屏之
 * 前决定去留。几条克制的规则，避免比自动跳转更烦人的东西：
 *
 * * **只在 / 和两个语言首页上判断。** 文档页一律不跳 —— 正文只有中文，把点进
 *   /zh_CN/regulation_2nd 的人送去 /en_US/ 是让他丢掉正要读的东西。
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
    var langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ""];
    for (var i = 0; i < langs.length; i++) if (/^zh/i.test(langs[i])) return go("zh");
    // 浏览器一个语言都没报，就走默认的中文 —— 这个网络的默认语言是中文，
    // 文档正文也只有中文。
    go(langs.join("") ? "en" : "zh");
  } catch (e) {}
})();`;

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
      { text: t.nav.mainSite, link: "https://airwaysn.org" },
    ],
    sidebar: [
      // 规章只有一篇，就是顶层直链，不套一层同名的分组。
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
        items: [{ text: f.editions.items.firstEdition, link: DOC.firstEdition }],
      },
    ],
    outline: { level: [2, 3] as [number, number], label: f.onThisPage },
    docFooter: t.docFooter,
    darkModeSwitchLabel: t.appearance.label,
    lightModeSwitchTitle: t.appearance.lightTitle,
    darkModeSwitchTitle: t.appearance.darkTitle,
    sidebarMenuLabel: t.sidebarMenuLabel,
    returnToTopLabel: t.returnToTopLabel,
    langMenuLabel: t.langMenuLabel,
    skipToContentLabel: t.skipToContentLabel,
    lastUpdatedText: t.lastUpdatedText,
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
  // lastUpdated 是关着的，两个原因，都得先解决才谈得上打开：
  // 1. 它靠 `git log` 取每个文件的时间，而构建镜像里没有 git（装得上，但见 2）；
  // 2. 组织那份 deploy-k8s.yml 用 actions/checkout 的默认 fetch-depth: 1，仓库
  //    里只有一个提交，于是每一页的时间戳都会等于本次部署 —— 一条几个月没动过
  //    的规章会写着「今天更新」。规章页上，错的日期比没有日期更糟。
  // 打开的前提是构建时能拿到完整历史。ui.json 里的 lastUpdatedText 先留着。
  lastUpdated: false,
  // README.md 是写给维护者的，VitePress 默认会把它当成 / 的别名，
  // 和分流页 index.md 撞车。
  srcExclude: ["README.md"],

  head: [["script", {}, AUTO_LOCALE_SCRIPT]],

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
    // 英文侧现在只有一个首页，正文还是中文原文。默认的 i18nRouting 会把
    // /zh_CN/regulation_2nd 换成 /en_US/regulation_2nd —— 那是个 404。关掉之后
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
