# Use official Node.js LTS
FROM node:20

# Set working directory to the project root
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code, including prisma, src, config, esbuild.config.ts
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.prisma

# Build server with esbuild (adjust memory if needed)
RUN node --max-old-space-size=4096 ./esbuild.config.js

# Expose the port the server will run on (production port)
EXPOSE 8080

# Run the server
CMD ["node", "dist/server.js"]
