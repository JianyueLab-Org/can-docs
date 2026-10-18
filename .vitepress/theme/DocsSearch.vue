<script setup lang="ts">
/**
 * VitePress 的全文搜索按钮，放在 CanFrame 的 actions 槽里。按钮和 "/" 打开它；
 * ⌘K 归 can-ui 的快速跳转，VitePress 自己的 ⌘K 在 Layout.vue 里拦掉。
 */
import { VPNavBarSearch } from "vitepress/theme";
</script>

<template>
  <div class="docs-search"><VPNavBarSearch /></div>
</template>
