# Build the React application with the exact locked dependencies.
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Validate the JavaScript API separately before creating the runtime image.
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# API runtime target.
FROM node:22-alpine AS api
WORKDIR /app/server
ENV NODE_ENV=production
COPY --from=server-build /app/server/package.json /app/server/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=server-build /app/server/src ./src
EXPOSE 4000
CMD ["node", "src/server.js"]

# Static client and reverse proxy target. Only this service is public.
FROM nginx:1.27-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=client-build /app/client/dist /usr/share/nginx/html
EXPOSE 80
