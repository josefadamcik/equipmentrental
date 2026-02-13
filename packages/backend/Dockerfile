# ==================================
# Stage 1: Base - Common dependencies
# ==================================
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    openssl \
    libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# ==================================
# Stage 2: Development - Dev dependencies
# ==================================
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "run", "dev"]

# ==================================
# Stage 3: Build - Compile TypeScript
# ==================================
FROM base AS build

# Install all dependencies (needed for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ==================================
# Stage 4: Production - Minimal runtime
# ==================================
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production dependencies from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy Prisma schema and migrations
COPY --from=build /app/prisma ./prisma

# Copy necessary config files
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/.env.example ./

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
