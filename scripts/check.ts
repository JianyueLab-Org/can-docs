/**
 * can-docs 的门禁。CI（组织的 deploy-k8s.yml）在 docker build 之前跑
 * `bun run lint`，而这个仓库没有代码可以类型检查。能坏的是另外三件事，三件都
 * **静默**，构建不会报错：
 *
 * 1. 两份 ui.json 的键漂了 —— 缺的那个键会在页面上渲染成 undefined。
 * 2. 导航或侧栏指向一个不存在的页面。VitePress 的死链检查只看 markdown 里的链
 *    接，`config.mts` 里的 `link` 一个都不查，所以删掉一篇文档之后侧栏照样构建
 *    通过，点进去才是 404。
 * 3. 新加了一篇文档却没挂进侧栏 —— 页面在，但没有入口。
 */
import { existsSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";

import config from "../.vitepress/config.mts";
import zhCN from "../zh_CN/ui.json";
import enUS from "../en_US/ui.json";

const problems: string[] = [];

// ---------------------------------------------------------------- 词典键一致
function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keyPaths(v, prefix + k + "."));
}
const zhKeys = new Set(keyPaths(zhCN));
const enKeys = new Set(keyPaths(enUS));
for (const k of zhKeys) if (!enKeys.has(k)) problems.push(`en_US/ui.json 缺键：${k}`);
for (const k of enKeys) if (!zhKeys.has(k)) problems.push(`zh_CN/ui.json 缺键：${k}`);

// ------------------------------------------------------- 导航里的链接都能落地
function links(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(links);
  if (typeof node === "object" && node !== null) {
    const o = node as Record<string, unknown>;
    const own = typeof o.link === "string" ? [o.link] : [];
    return [...own, ...links(o.items ?? [])];
  }
  return [];
}

/** /zh_CN/regulation → zh_CN/regulation.md；/zh_CN/ → zh_CN/index.md */
function pageFor(link: string): string {
  const path = link.split("#")[0].split("?")[0].replace(/^\/+/, "");
  return path === "" || path.endsWith("/") ? `${path}index.md` : `${path}.md`;
}

const referenced = new Set<string>();
for (const [locale, entry] of Object.entries(config.locales ?? {})) {
  const theme = (entry as { themeConfig?: Record<string, unknown> }).themeConfig ?? {};
  for (const link of [...links(theme.nav), ...links(theme.sidebar)]) {
    if (!link.startsWith("/")) continue; // 站外链接不归这里管
    const page = pageFor(link);
    referenced.add(page);
    if (!existsSync(page)) problems.push(`${locale} 的导航指向不存在的页面：${link} → ${page}`);
  }
}

// --------------------------------------------------------- 没有页面是孤立的
function markdownUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return markdownUnder(p);
    return e.name.endsWith(".md") ? [relative(".", p)] : [];
  });
}
for (const locale of Object.keys(config.locales ?? {})) {
  for (const page of markdownUnder(locale)) {
    // 各语言首页由 locales[].link 指着，不必出现在侧栏里。
    if (page.endsWith("index.md")) continue;
    if (!referenced.has(page)) problems.push(`${page} 没挂在任何导航上，读者找不到它`);
  }
}

// ------------------------------------------------------------------ 分流页在
if (!existsSync("index.md")) problems.push("根目录缺 index.md（语言分流页）");

const unique = [...new Set(problems)]; // 同一个链接会在 nav 和 sidebar 各出现一次
if (unique.length) {
  console.error("门禁没过：");
  for (const p of unique) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(
  `✓ 两份词典键一致（${zhKeys.size} 个）；导航里 ${referenced.size} 个页面全部存在；没有孤立页面`,
);
