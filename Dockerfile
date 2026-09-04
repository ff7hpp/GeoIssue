# Build the React application with the exact locked dependencies.
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Compile the API separately so the runtime image contains no TypeScript tooling.
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# API runtime target. schema.sql is required by the compiled migration runner.
FROM node:20-alpine AS api
WORKDIR /app/server
ENV NODE_ENV=production
COPY --from=server-build /app/server/package.json /app/server/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/src/db/schema.sql ./dist/db/schema.sql
EXPOSE 4000
CMD ["node", "dist/server.js"]

# Static client and reverse proxy target. Only this service is public.
FROM nginx:1.27-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=client-build /app/client/dist /usr/share/nginx/html
EXPOSE 80
