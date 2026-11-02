# Production Multi-Stage Backend Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

COPY --from=builder /app ./

EXPOSE 5001

CMD ["node", "src/server.js"]
