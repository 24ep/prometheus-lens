# Stage 1: Install dependencies and build the application
FROM node:18 AS builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies (print npm log if fails)
RUN npm ci || (cat /app/.npm/_logs/* || true; exit 1)

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Create the production image
FROM node:18
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
# ENV PORT=3000 (Next.js default, can be overridden in docker-compose)

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Install only production dependencies (print npm log if fails)
RUN npm ci --omit=dev || (cat /app/.npm/_logs/* || true; exit 1)

EXPOSE 3000

CMD ["npm", "start"]
