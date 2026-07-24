FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --only=production && \
    npm cache clean --force

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

COPY package.json package-lock.json* ./

COPY --from=dependencies /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/src/database/schema ./src/database/schema

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main.js"]
