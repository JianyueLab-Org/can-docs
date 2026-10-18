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

/**
 * 交给 CanFrame 的 pathname。CanFrame 按前缀判断当前项，不认 VitePress 的
 * activeMatch，所以归档页 /zh_CN/archive/regulation_2nd 原本不会点亮「规章」。
 * 某项的 activeMatch（正则，和 VitePress 一样对 route.path 测）命中时，就把这
 * 一项的 link 当成当前地址交出去；都不命中就原样返回。
 */
export function framePath(nav: { link: string; activeMatch?: string }[], path: string): string {
  const hit = nav.find((item) => item.activeMatch && new RegExp(item.activeMatch).test(path));
  return hit ? hit.link : path;
}
