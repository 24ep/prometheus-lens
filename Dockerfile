
# Stage 1: Install dependencies and build the application
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN pnpm build

# Stage 2: Create the production image
FROM node:18-alpine
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
# ENV PORT=3000 (Next.js default, can be overridden in docker-compose)

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
# We don't need node_modules from builder if we reinstall minimal set for production
# Or, if all deps are needed, copy node_modules and skip reinstall (larger image)

# Install only production dependencies using pnpm
# First, ensure pnpm is available
RUN npm install -g pnpm
COPY --from=builder /app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "start"]
