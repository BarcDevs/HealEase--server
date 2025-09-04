# Use official Node.js LTS
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Upgrade npm to latest version
RUN npm install -g npm@11.6.0

# Copy package files first for caching
COPY package*.json ./

# Install dependencies (postinstall scripts will not fail because schema exists)
RUN npm install

# Copy the rest of the project
COPY . .

# Generate Prisma client explicitly (after copying source)
RUN npx prisma generate --schema=prisma/schema.prisma

# Build server with esbuild (adjust memory if needed)
RUN node --max-old-space-size=4096 ./esbuild.config.js

# Expose the server port (make sure it matches your config)
EXPOSE 8080

# Start the server
CMD ["node", "dist/server.js"]
