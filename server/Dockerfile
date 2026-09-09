FROM node:20-alpine

WORKDIR /app

# Инструменты сборки нужны пакету bcrypt (нативные биндинги)
RUN apk add --no-cache python3 make g++ wget

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/logs \
  && sed -i 's/\r$//' /app/scripts/docker-entrypoint.sh \
  && chmod +x /app/scripts/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=5s --start-period=25s --retries=5 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
