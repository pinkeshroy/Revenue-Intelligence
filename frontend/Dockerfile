# Frontend Dockerfile - Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build args
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Minimal nginx config: serve static files + SPA routing
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { expires 1y; add_header Cache-Control "public, immutable"; } }' \
  > /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
