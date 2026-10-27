<script setup lang="ts">
/**
 * 文档站的外壳：can-ui CanFrame（content 布局）包住 VitePress 默认布局。
 * 顶栏、全网切换、⌘K、明暗和页脚是 can-ui 的；侧栏、目录、正文、页尾是 VitePress 的。
 * 没有账户菜单和登录按钮：静态站读不到 HttpOnly 的会话 cookie。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, watch, watchEffect } from "vue";
import { useData, useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { CanFrame, NotFound } from "@jianyuelab-org/can-ui";
import zhCN from "../../zh_CN/ui.json";
import enUS from "../../en_US/ui.json";
import DocsSearch from "./DocsSearch.vue";
import LocaleLink from "./LocaleLink.vue";
import { canLocale, framePath, navItems } from "./frame";

const { lang, theme, localeIndex, page, frontmatter } = useData();
const route = useRoute();
const locale = computed(() => canLocale(lang.value));
const dict = computed(() => (locale.value === "zh-cn" ? zhCN : enUS));
type NavEntry = { text: string; link: string; activeMatch?: string };
const navEntries = computed(() => (theme.value.nav ?? []) as NavEntry[]);
const nav = computed(() => navItems(navEntries.value));
const home = computed(() => (localeIndex.value === "en_US" ? "/en_US/" : "/zh_CN/"));
// cleanUrls 下一般不带 .html；直接打开 xxx.html 时也按无后缀的地址判断当前项。
// 再按 config.mts 里的 activeMatch 换算：归档页也点亮「规章」。
const pathname = computed(() => framePath(navEntries.value, route.path.replace(/\.html$/, "")));

// 404 没有 markdown 源文件，不经过 config.mts 的 transformPageData，frontmatter
// 里也就没有 navbar: false：VitePress 会在 CanFrame 顶栏下面再画一条自己的导航，
// 带着第二个搜索按钮。在这里补上，VPNav 渲染前就读到。
watchEffect(() => {
  if (page.value.isNotFound) frontmatter.value.navbar = false;
});

// CanFrame 已经渲染了 <main id="main-content">，VPDoc 里还有一个 <main class="main">。
// 一页只能有一个 main 地标，里面那个降成普通容器。它是 VitePress 的组件，改不了
// 标签，只能挂载后补 role；换页时 VPDoc 可能重建，所以每次换页之后再补一次。
function demoteInnerMain() {
  for (const el of document.querySelectorAll("#main-content main")) el.setAttribute("role", "none");
}
watch(() => route.path, () => nextTick(demoteInnerMain), { flush: "post" });

function stopVitepressHotkey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") event.stopPropagation();
}
onMounted(() => {
  document.addEventListener("keydown", stopVitepressHotkey);
  demoteInnerMain();
});
onBeforeUnmount(() => document.removeEventListener("keydown", stopVitepressHotkey));
</script>

<template>
  <!-- CanFrame 的翻译函数只在 setup 时按 messages 建一次。key 跟着 locale 走，
       站内从 /en_US/ 跳到 /zh_CN/ 时整个外壳重建，顶栏文案才会换语言。 -->
  <CanFrame
    :key="locale"
    layout="content"
    current="docs"
    :locale="locale"
    :pathname="pathname"
    :nav="nav"
    :home-href="home"
    :languages="false"
    :messages="dict.frame"
  >
    <template #actions>
      <DocsSearch />
      <LocaleLink :label="dict.frame.switchLocale" />
    </template>
    <template #footer>
      <p class="max-w-xs text-sm text-muted">{{ dict.frame.governingText }}</p>
    </template>
    <DefaultTheme.Layout>
      <template #not-found>
        <NotFound current="docs" :locale="locale" :home-href="home" />
      </template>
    </DefaultTheme.Layout>
  </CanFrame>
</template>
