# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN ./node_modules/.bin/prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
# Run migrations, seed, and start server
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && npm run prisma:seed-all && node dist/index.js"]
