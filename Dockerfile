# 静态站：前一段构建，后一段只有产物和一个 nginx。
FROM oven/bun:1 AS build
WORKDIR /app

# 先只拷 manifest，让依赖层在内容变动时仍然命中缓存。
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run docs:build

# nginx-unprivileged：监听 8080、以 uid 101 跑、pid 写在 /tmp。
# 官方 nginx 镜像要 root 才能绑 80 并写 /var/run，配上清单里的
# runAsNonRoot + readOnlyRootFilesystem 就起不来。
FROM nginxinc/nginx-unprivileged:1-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.vitepress/dist /usr/share/nginx/html

EXPOSE 8080
