FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci

COPY --from=builder /app/dist ./dist

USER nodejs

EXPOSE 5173

CMD ["npx", "vite", "preview", "--host", "--port", "5173"]