---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "文档中心"
  text: "规章制度、管制员指南以及网络的发展历史"
  tagline: Cerulean Aviation Network
  actions:
    - theme: brand
      text: 规章制度
      link: /zh_CN/regulation
    - theme: alt
      text: 管制员职业准则
      link: /zh_CN/atc
    - theme: alt
      text: 返回主站
      link: https://ceruleanavi.net

# 图标是 lucide，不是 emoji —— 图形和理由都在 .vitepress/theme/style.css 的
# 「Component: Home —— 首页三张 feature 卡的图标」一节，两种语言共用同一份。
features:
  - icon: '<span class="can-icon can-icon-regulation"></span>'
    title: 规章制度
    details: 每位成员连线时都需遵守的规则。
    link: /zh_CN/regulation
  - icon: '<span class="can-icon can-icon-atc"></span>'
    title: 管制员
    details: 席位工作的专业指南。
    link: /zh_CN/atc
  - icon: '<span class="can-icon can-icon-about"></span>'
    title: 关于
    details: 网络是如何建立起来的。
    link: /zh_CN/history
---
