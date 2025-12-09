# Build stage
# Stage 1 — build the app
FROM node:18-alpine AS build
WORKDIR /app

# copy package manifests first (for better cache)
COPY package*.json ./
# if you use pnpm or yarn, adapt steps accordingly
RUN npm ci

# copy the rest of the source
COPY . .

# build — Vite outputs to /app/dist by default
RUN npm run build

# Stage 2 — serve with nginx
FROM nginx:stable-alpine
# remove default nginx content
RUN rm -rf /usr/share/nginx/html/*
# copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# optional: expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

