# ---- Base image
FROM node:20-bullseye-slim
RUN apt-get update && apt-get install -y openssl libssl1.1 curl && rm -rf /var/lib/apt/lists/*

# ---- Install system dependencies for Prisma
RUN apt-get update && \
    apt-get install -y openssl libssl1.1 curl && \
    rm -rf /var/lib/apt/lists/*

# ---- Env & workdir
ENV NODE_ENV=production
WORKDIR /HealEase--server

# ---- Copy package files first for caching
COPY package*.json ./

# ---- Copy Prisma schema first (to leverage Docker cache for prisma generate)
COPY prisma ./prisma

# ---- Install production dependencies (including native modules like bcrypt)
RUN npm install --omit=dev --unsafe-perm

# ---- Optional: set dummy DATABASE_URL if prisma complains
# ENV DATABASE_URL=postgresql://user:pass@localhost:5432/db?schema=public

# ---- Generate Prisma client explicitly
RUN npx prisma generate --schema=prisma/schema.prisma

# ---- Copy rest of the source code
COPY . .

# ---- Copy jsdom worker to dist to avoid missing module
RUN mkdir -p dist \
    && cp node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js dist/

# ---- Build the server with esbuild
# Mark native and external modules as external
RUN npx esbuild src/app.ts \
  --bundle \
  --platform=node \
  --outfile=dist/server.js \
  --sourcemap \
  --external:aws-sdk \
  --external:mock-aws-s3 \
  --external:nock \
  --external:*.html \
  --external:bcrypt

# ---- Expose port and start
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/server.js"]
