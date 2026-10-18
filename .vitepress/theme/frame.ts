/** 外壳用到的纯函数。scripts/check.ts 直接 import 它们来验。 */
import type { NavItem } from "@jianyuelab-org/can-ui/nav";

const ICONS = ["home", "scale", "signal", "bookOpen"] as const;

/** VitePress 的 lang（zh-CN / en-US）→ can-ui 的 locale。 */
export function canLocale(lang: string): "zh-cn" | "en-us" {
  return /^zh/i.test(lang) ? "zh-cn" : "en-us";
}

/** config.mts 的 themeConfig.nav（四项）→ CanFrame 的 nav。 */
export function navItems(nav: { text: string; link: string }[]): NavItem[] {
  return nav.map((item, i) => ({ name: item.text, href: item.link, icon: ICONS[i] ?? "documentText" }));
}

/** 另一种语言的首页。正文只有中文，所以切语言落在首页（同 i18nRouting: false）。 */
export function otherLocale(lang: string): { href: "/en_US/" | "/zh_CN/" } {
  return { href: canLocale(lang) === "zh-cn" ? "/en_US/" : "/zh_CN/" };
}
