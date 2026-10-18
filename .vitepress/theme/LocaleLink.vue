<script setup lang="ts">
/** 切到另一种语言的首页。can-ui 的语言菜单改 cookie 后原地刷新，换不了 /zh_CN/ ↔ /en_US/。 */
import { computed } from "vue";
import { useData } from "vitepress";
import { otherLocale } from "./frame";

const props = defineProps<{ label: string }>();
const { lang } = useData();
// target="_self" 让 VitePress 的路由不接管这次点击：整页加载，<head> 里的脚本才
// 能读到 ?lang= 并记下这次选择，否则旧的选择会在下次打开语言首页时把人弹回去。
const href = computed(() => `${otherLocale(lang.value).href}?lang=${/^zh/i.test(lang.value) ? "en" : "zh"}`);
// 链接文字和目标页都是另一种语言，屏幕阅读器按 lang 换发音。
const target = computed(() => (/^zh/i.test(lang.value) ? "en-US" : "zh-CN"));
</script>

<template>
  <a :href="href" :lang="target" :hreflang="target" target="_self" class="focus-ring rounded-control px-2 py-2 text-sm font-semibold text-muted hover:bg-surface-sunken hover:text-ink">{{ props.label }}</a>
</template>
