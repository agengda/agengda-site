# 冷水机独立站 — 自托管镜像
# 适用: VPS(Docker) / Railway / Render / Fly.io / Koyeb / CapRover
# 构建: docker build -t chiller-site .
# 运行: docker run -d --name chiller-site -p 8080:8080 \
#        -e PORT=8080 -e LEAD_TOKEN=改成你的令牌 \
#        -v chiller-data:/app/data \
#        -v chiller-img:/app/dist/assets/img \
#        chiller-site
FROM node:20-alpine

WORKDIR /app

# 安装依赖（本仓库零运行时依赖，保留以便后续扩展）
COPY package.json ./
RUN npm install --omit=dev || true

# 复制源码与构建脚本
COPY . .

# 生成静态站 dist/
RUN npm run build

ENV PORT=8080
ENV LEAD_TOKEN=change-me
ENV NODE_ENV=production

EXPOSE 8080

# server.js 已绑定 0.0.0.0:$PORT，并按需自动重建 dist
CMD ["node", "server.js"]
