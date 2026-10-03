---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Documentation"
  text: "Regulations, ATC guidelines and the story of the network"
  tagline: Cerulean Aviation Network
  actions:
    - theme: brand
      text: Regulations
      link: /zh_CN/regulation
    - theme: alt
      text: ATC Professional Guidelines
      link: /zh_CN/atc
    - theme: alt
      text: Main site
      link: https://ceruleanavi.net

# 图标是 lucide，不是 emoji —— 图形和理由都在 .vitepress/theme/style.css 的
# 「Component: Home —— 首页三张 feature 卡的图标」一节，两种语言共用同一份。
features:
  - icon: '<span class="can-icon can-icon-regulation"></span>'
    title: Regulations
    details: The rules every member agrees to when they connect.
    link: /zh_CN/regulation
  - icon: '<span class="can-icon can-icon-atc"></span>'
    title: ATC
    details: Professional guidelines for working a position.
    link: /zh_CN/atc
  - icon: '<span class="can-icon can-icon-about"></span>'
    title: About
    details: How the network came to be.
    link: /zh_CN/history
---

The Chinese text governs the platform regulations. An English translation of the
General Regulations is available here; the ATC guidelines, training observation
rules, revision history and other documents remain available in Chinese only.
