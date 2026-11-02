# Multi-Stage Frontend Dockerfile with Nginx
FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Nginx production web server
FROM nginx:alpine AS runner

COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx reverse proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
