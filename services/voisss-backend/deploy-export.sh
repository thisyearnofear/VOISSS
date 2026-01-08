#!/bin/bash
# Quick deployment script for export service to Hetzner
# Usage: ssh snel-bot < deploy-export.sh

set -e

echo "================================"
echo "VOISSS Export Service Deployment"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DEPLOY_PATH="/opt/voisss-processing"

# Step 1: Check prerequisites
echo -e "\n${YELLOW}Step 1: Checking prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo "docker required but not installed"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "docker-compose required but not installed"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg required but not installed"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "pm2 required but not installed"; exit 1; }
echo -e "${GREEN}✓ All prerequisites met${NC}"

# Step 2: Setup output directory
echo -e "\n${YELLOW}Step 2: Creating output directory...${NC}"
if [ ! -d "/var/www/voisss-exports" ]; then
  sudo mkdir -p /var/www/voisss-exports
  sudo chown $(whoami) /var/www/voisss-exports
  sudo chmod 755 /var/www/voisss-exports
  echo -e "${GREEN}✓ Created /var/www/voisss-exports${NC}"
else
  echo -e "${GREEN}✓ Directory already exists${NC}"
fi

# Step 3: Add Redis to docker-compose (if not exists)
echo -e "\n${YELLOW}Step 3: Checking Redis container...${NC}"
if ! docker ps | grep -q redis-export; then
  echo "Adding Redis to docker-compose..."
  
  # Create docker-compose snippet if needed
  DOCKER_COMPOSE_PATH=$(find /etc/docker -name "docker-compose.yml" -o -name "compose.yml" 2>/dev/null | head -1)
  
  if [ -z "$DOCKER_COMPOSE_PATH" ]; then
    echo "Could not find docker-compose.yml"
    echo "Please add Redis manually or ensure REDIS_HOST is accessible"
  else
    echo "Found docker-compose at: $DOCKER_COMPOSE_PATH"
    # Backup
    cp "$DOCKER_COMPOSE_PATH" "$DOCKER_COMPOSE_PATH.backup.$(date +%s)"
    # Add redis section (assumes file is in correct location)
    echo "Note: Please manually add redis-export service to docker-compose.yml"
  fi
  
  # Try to start redis anyway
  docker run -d \
    --name redis-export \
    --restart unless-stopped \
    -p 127.0.0.1:6379:6379 \
    -v redis-export-data:/data \
    redis:7-alpine \
    redis-server --appendonly yes
  
  echo -e "${GREEN}✓ Redis container started${NC}"
else
  echo -e "${GREEN}✓ Redis container already running${NC}"
fi

# Wait for Redis to be ready
echo -e "\n${YELLOW}Step 4: Testing Redis connection...${NC}"
for i in {1..10}; do
  if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is ready${NC}"
    break
  fi
  echo "Waiting for Redis... ($i/10)"
  sleep 1
done

# Step 5: Deploy code
echo -e "\n${YELLOW}Step 5: Deploying backend service...${NC}"
cd "$DEPLOY_PATH"

# Backup current deployment
if [ -d "$DEPLOY_PATH/src" ]; then
  BACKUP_DIR="$DEPLOY_PATH.backup.$(date +%Y%m%d_%H%M%S)"
  cp -r "$DEPLOY_PATH" "$BACKUP_DIR"
  echo "Backup created at: $BACKUP_DIR"
fi

# Pull latest code
git pull origin main
echo -e "${GREEN}✓ Code pulled${NC}"

# Install dependencies
npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 6: Verify environment
echo -e "\n${YELLOW}Step 6: Verifying environment variables...${NC}"
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  echo "Please create .env file with required variables"
  echo "Template: cp .env.example .env && nano .env"
  exit 1
fi

# Check for required variables
REQUIRED_VARS=("DATABASE_URL" "REDIS_HOST" "REDIS_PORT")
for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$var=" .env; then
    echo -e "${RED}Missing: $var${NC}"
  else
    echo -e "${GREEN}✓ $var configured${NC}"
  fi
done

# Step 7: Restart services
echo -e "\n${YELLOW}Step 7: Restarting services...${NC}"
pm2 restart ecosystem.config.js

# Wait for services to start
sleep 3

# Step 8: Verify
echo -e "\n${YELLOW}Step 8: Verifying services...${NC}"
pm2 status

# Test API health
echo -e "\n${YELLOW}Step 9: Testing API...${NC}"
if curl -sf http://localhost:5577/health > /dev/null; then
  echo -e "${GREEN}✓ API is healthy${NC}"
else
  echo -e "${RED}✗ API health check failed${NC}"
  pm2 logs voisss-processing --lines 20
fi

# Test worker
if pm2 status | grep -q "voisss-export-worker"; then
  echo -e "${GREEN}✓ Export worker is running${NC}"
else
  echo -e "${RED}✗ Export worker failed to start${NC}"
  pm2 logs voisss-export-worker --lines 20
fi

# Step 10: Show next steps
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check logs: pm2 logs"
echo "2. Monitor: pm2 monit"
echo "3. Test export: POST http://localhost:5577/api/export/request"
echo ""
echo "Documentation: DEPLOYMENT_EXPORT.md"
echo ""

# Save PM2 config
pm2 save
echo -e "${GREEN}✓ PM2 configuration saved${NC}"
