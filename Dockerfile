# ---- Base image
FROM node:20-slim

# ---- Env & workdir
ENV NODE_ENV=production
WORKDIR /HealEase--server

# ---- Faster, reproducible installs (skip lifecycle scripts now)
COPY package*.json ./
RUN npm ci --ignore-scripts

# ---- Ensure Prisma schema is present before generate
# (copy only prisma first so Docker can cache the generate step if schema doesn't change)
COPY prisma ./prisma

# If your schema uses env("DATABASE_URL") and generate complains, uncomment the next line with a dummy value:
# ENV DATABASE_URL=postgresql://user:pass@localhost:5432/db?schema=public

# ---- Generate Prisma client explicitly (no postinstall)
RUN npx prisma generate --schema=prisma/schema.prisma

# ---- Copy the rest of the source
COPY . .

# ---- Build the server with esbuild (no TS memory blowups)
RUN npx esbuild src/app.ts \
  --bundle \
  --platform=node \
  --outfile=dist/server.js \
  --sourcemap \
  --external:aws-sdk \
  --external:mock-aws-s3 \
  --external:nock \
  --external:*.html

# ---- Port & start
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/server.js"]
