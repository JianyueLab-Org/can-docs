<script setup lang="ts">
/**
 * 文档站的外壳：can-ui CanFrame（content 布局）包住 VitePress 默认布局。
 * 顶栏、全网切换、⌘K、明暗和页脚是 can-ui 的；侧栏、目录、正文、页尾是 VitePress 的。
 * 没有账户菜单和登录按钮：静态站读不到 HttpOnly 的会话 cookie。
 */
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useData, useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { CanFrame } from "@jianyuelab-org/can-ui";
import zhCN from "../../zh_CN/ui.json";
import enUS from "../../en_US/ui.json";
import DocsSearch from "./DocsSearch.vue";
import LocaleLink from "./LocaleLink.vue";
import { canLocale, navItems } from "./frame";

const { lang, theme, localeIndex } = useData();
const route = useRoute();
const locale = computed(() => canLocale(lang.value));
const dict = computed(() => (locale.value === "zh-cn" ? zhCN : enUS));
const nav = computed(() => navItems((theme.value.nav ?? []) as { text: string; link: string }[]));
const home = computed(() => (localeIndex.value === "en_US" ? "/en_US/" : "/zh_CN/"));
// cleanUrls 下一般不带 .html；直接打开 xxx.html 时也按无后缀的地址判断当前项。
const pathname = computed(() => route.path.replace(/\.html$/, ""));

function stopVitepressHotkey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") event.stopPropagation();
}
onMounted(() => document.addEventListener("keydown", stopVitepressHotkey));
onBeforeUnmount(() => document.removeEventListener("keydown", stopVitepressHotkey));
</script>

<template>
  <CanFrame
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
    <DefaultTheme.Layout />
  </CanFrame>
</template>
