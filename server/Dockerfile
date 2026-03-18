# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# Omit devDependencies but keep dependencies (including prisma, ts-node, tsc)
RUN npm ci
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
EXPOSE 3001
# Run migrations, seed the database, and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run prisma:seed-all && node dist/index.js"]
