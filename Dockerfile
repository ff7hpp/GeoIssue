# Multi-stage Dockerfile for GeoIssue

# Stage 1: Build Frontend
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Stage 3: Production Server
FROM node:20-alpine
WORKDIR /app

# Copy backend build
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package*.json ./server/
COPY --from=server-build /app/server/.env.example ./server/
COPY --from=server-build /app/server/src/db/schema.sql ./server/src/db/schema.sql

# Install only production dependencies
WORKDIR /app/server
RUN npm install --omit=dev

# Copy frontend build to a public dir served by Express
# We need to make sure Express serves these files in production
COPY --from=client-build /app/client/dist /app/client/dist

# Expose port 4000
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production
ENV CLIENT_ORIGIN=* 
# Note: In production, configure CLIENT_ORIGIN correctly

CMD ["npm", "start"]
