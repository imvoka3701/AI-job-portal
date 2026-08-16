# ============================================================
# AI Job Portal — Frontend Dockerfile
# Multi-stage: Node build → Nginx serve
# ============================================================

# ---------- Stage 1: Build ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies (clean install for reproducibility)
RUN npm ci

# Copy source code
COPY . .

# Build with empty VITE_API_URL so frontend uses relative "/api" path
# which Nginx will proxy to the backend container
ENV VITE_API_URL=""
RUN npm run build

# ---------- Stage 2: Serve with Nginx ----------
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
