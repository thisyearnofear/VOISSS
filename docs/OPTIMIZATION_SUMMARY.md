# VOISSS Server Optimization Summary

## Current State (After Initial Cleanup)

| Resource | Total | Used | Available | Usage |
|----------|-------|------|-----------|-------|
| **Disk** | 38GB | 20GB | 16GB | 56% |
| **RAM** | 3.7GB | 918MB | 1.0GB | 25% |
| **Swap** | 4.0GB | 304MB | 3.7GB | 8% |

---

## ✅ Completed Actions

### 1. Log Cleanup (Freed ~38MB)
```bash
# Cleared bloated error logs from crash loop
truncate -s 0 /opt/voisss-processing/services/voisss-backend/logs/worker-error.log
truncate -s 0 /opt/voisss-processing/services/voisss-backend/logs/worker-out.log
```

### 2. System Log Vacuum
```bash
# Vacuumed journalctl logs
journalctl --vacuum-time=7d
```

---

## 🚨 Critical Issues to Fix

### Issue 1: Worker Crash Loop (HIGH PRIORITY)

**Problem**: The `voisss-export-worker` is continuously crashing and restarting because it's trying to connect to PostgreSQL on port **5433** instead of **5432**.

**Location**: `/opt/voisss-processing/ecosystem.config.js` line 33

**Current (WRONG)**:
```javascript
DATABASE_URL: 'postgresql://voisss_user:o7JCUT5BDLwezCi08zHwUScVh3TXoKKPIsOknR7wPfA=@localhost:5433/voisss',
```

**Should be**:
```javascript
DATABASE_URL: 'postgresql://voisss_user:o7JCUT5BDLwezCi08zHwUScVh3TXoKKPIsOknR7wPfA=@localhost:5432/voisss',
```

**Impact**: 
- 30MB of error logs generated (now cleared)
- Continuous CPU usage from restart loop
- Export functionality not working

**Fix**:
```bash
# SSH into server and edit the file
ssh snel-bot
nano /opt/voisss-processing/ecosystem.config.js
# Change port 5433 to 5432 on line 33
# Then reload PM2
pm2 reload all
```

---

## 📋 Recommended Optimizations

### 1. Docker Image Cleanup (Potential: Save 1.5GB)

**Current Docker Images**:
```
REPOSITORY        TAG         SIZE
trende/backend    latest      1.23GB   ← Can be optimized
trende/baseline   v2          272MB
postgres          15-alpine   274MB
redis             7-alpine    41.4MB
```

**Recommendation**: The `trende/backend:1.23GB` is very large. Consider:
- Multi-stage builds to reduce size
- Using alpine base images
- Removing unnecessary dependencies

**Command to rebuild leaner**:
```dockerfile
# Example multi-stage build
FROM node:20-alpine AS builder
# ... build steps ...

FROM node:20-alpine
# Copy only necessary files
```

### 2. Next.js Build Optimization (Potential: Save 100-200MB)

**Current**:
- `.next/cache/webpack`: 288MB
- `.next/trace`: 8.2MB

**Recommendations**:
```javascript
// next.config.js
module.exports = {
  // Enable SWC minification (faster, less memory)
  swcMinify: true,
  
  // Reduce webpack verbosity
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    return config;
  },
  
  // Experimental: Reduce build cache
  experimental: {
    webpackBuildWorker: true,
  },
}
```

**Clean build cache periodically**:
```bash
ssh snel-bot "cd /opt/voisss-processing/apps/web && rm -rf .next/cache && pnpm build"
```

### 3. PM2 Memory Optimization

**Current Configuration**:
```javascript
// voisss-server: max_memory_restart: '1G'
// voisss-export-worker: max_memory_restart: '2G'
```

**Recommended** (based on actual usage of ~100MB per process):
```javascript
// voisss-server: max_memory_restart: '512M'  ← Reduced from 1G
// voisss-export-worker: max_memory_restart: '1G'  ← Reduced from 2G
```

### 4. Log Rotation Setup

**Created**: `backend-log-rotate.conf`

**Deploy to server**:
```bash
scp backend-log-rotate.conf snel-bot:/etc/logrotate.d/voisss-backend
ssh snel-bot "chmod 644 /etc/logrotate.d/voisss-backend"
```

This will:
- Rotate logs daily
- Keep 7 days of logs
- Compress old logs
- Prevent log bloat

### 5. PostgreSQL Optimization

**Current**: Running in Docker with default settings

**Recommendations**:
```sql
-- Connect to PostgreSQL and run:
docker exec voisss-postgres psql -U voisss_user -d voisss

-- Check database size
SELECT pg_size_pretty(pg_database_size('voisss'));

-- Vacuum and analyze
VACUUM ANALYZE;

-- Check for bloated tables
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 6. Redis Memory Optimization

**Current**: 9MB usage (excellent ✅)

**Recommendation**: Add memory policy to prevent growth:
```bash
# In Redis config or via command
docker exec voisss-redis redis-cli CONFIG SET maxmemory 100mb
docker exec voisss-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 📊 Resource Monitoring Setup

### Add monitoring script:

```bash
# Create monitoring script
ssh snel-bot "cat > /opt/voisss-processing/monitor.sh << 'EOF'
#!/bin/bash
echo \"=== VOISSS Server Health Check ===\"
echo \"Date: \$(date)\"
echo \"\"
echo \"Disk Usage:\"
df -h / | tail -1
echo \"\"
echo \"Memory Usage:\"
free -h | grep Mem
echo \"\"
echo \"PM2 Status:\"
pm2 list --mini
echo \"\"
echo \"Docker Containers:\"
docker ps --format 'table {{.Names}}\t{{.Status}}'
echo \"\"
echo \"Top 5 Processes by Memory:\"
ps aux --sort=-%mem | head -6
EOF
chmod +x /opt/voisss-processing/monitor.sh"
```

---

## 🎯 Expected Results After All Optimizations

| Resource | Before | After | Savings |
|----------|--------|-------|---------|
| **Disk Used** | 20GB | ~18GB | 2GB (10%) |
| **RAM Used** | 918MB | ~700MB | 218MB (24%) |
| **Docker Images** | 1.8GB | ~600MB | 1.2GB (67%) |

---

## 📝 Action Items Checklist

- [ ] **CRITICAL**: Fix PostgreSQL port in ecosystem.config.js (5433 → 5432)
- [ ] Deploy log rotation config
- [ ] Reduce PM2 memory limits
- [ ] Rebuild trende/backend image with multi-stage build
- [ ] Set up monitoring script
- [ ] Schedule weekly cleanup cron job
- [ ] Review and remove unused Docker volumes

---

## 🔍 Quick Health Check Commands

```bash
# Overall disk usage
ssh snel-bot "df -h / && du -sh /opt/voisss-processing/*"

# Memory usage
ssh snel-bot "free -h && ps aux --sort=-%mem | head -10"

# PM2 status
ssh snel-bot "pm2 list"

# Docker resources
ssh snel-bot "docker system df"

# Log sizes
ssh snel-bot "du -sh /opt/voisss-processing/services/voisss-backend/logs/*"

# Database size
ssh snel-bot "docker exec voisss-postgres psql -U voisss_user -d voisss -c 'SELECT pg_size_pretty(pg_database_size(current_database()));'"
```

---

**Generated**: 2026-02-18
**Server**: snel-bot
**Project**: VOISSS
