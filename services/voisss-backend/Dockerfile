# Production Dockerfile for VOISSS Backend & Worker
FROM node:20-slim

# Install FFmpeg and system dependencies for Sharp/Canvas
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libc6 \
    libvips-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/voisss-backend/package*.json ./services/voisss-backend/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set working directory to the backend service
WORKDIR /app/services/voisss-backend

# Production environment
ENV NODE_ENV=production
ENV PORT=5577

# Ensure volumes for exports
RUN mkdir -p /tmp/voisss-exports /var/www/voisss-exports

EXPOSE 5577

# Default command starts the server
CMD ["node", "src/server.js"]
