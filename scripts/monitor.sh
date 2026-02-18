#!/bin/bash
echo "=== VOISSS Server Health Check ==="
echo "Date: $(date)"
echo ""
echo "📀 Disk Usage:"
df -h / | tail -1
echo ""
echo "💾 Memory Usage:"
free -h | grep Mem
echo ""
echo "🚀 PM2 Status:"
pm2 list
echo ""
echo "Docker Containers:"
docker ps --format 'table {{.Names}}\t{{.Status}}'
echo ""
echo "Top 5 Processes by Memory:"
ps aux --sort=-%mem | head -6
echo ""
echo "Log Sizes:"
du -sh /opt/voisss-processing/services/voisss-backend/logs/* 2>/dev/null
