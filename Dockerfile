# 静态站：前一段构建，后一段只有产物和一个 nginx。
FROM oven/bun:1 AS build
WORKDIR /app

# 页脚那行「最后更新」的时间戳是 VitePress 拿 `git log` 逐个文件问出来的，而
# oven/bun 里没有 git。装在拷源码之前，这一层就能一直命中缓存。
#
# 光装上还不够，另外两半在别处：`.dockerignore` 不再排除 `.git`（否则容器里没有
# 仓库可问），`.github/workflows/deploy.yml` 给组织那份 deploy-k8s.yml 传了
# fetch-depth: 0（否则 checkout 只给一个提交，每页都会显示本次部署的时间）。三者
# 缺一样，config.mts 里的 hasFullGitHistory() 就会把 lastUpdated 整个关掉 —— 宁
# 可不显示日期，也不显示错的。
RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

# 先只拷 manifest，让依赖层在内容变动时仍然命中缓存。
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 这里连 .git 一起进来。RUN 是以 root 跑的（oven/bun 镜像没有设 USER），和 COPY
# 进来的文件属主一致，所以 git 不会因为 dubious ownership 拒绝读它。
COPY . .
RUN bun run docs:build

# nginx-unprivileged：监听 8080、以 uid 101 跑、pid 写在 /tmp。
# 官方 nginx 镜像要 root 才能绑 80 并写 /var/run，配上清单里的
# runAsNonRoot + readOnlyRootFilesystem 就起不来。
FROM nginxinc/nginx-unprivileged:1-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.vitepress/dist /usr/share/nginx/html

EXPOSE 8080
