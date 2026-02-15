# Docker Deployment Guide

Quick guide to deploy the Portfolio AI Chatbot using Docker and Docker Compose.

---

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)
- `.env` file configured (see [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md))

---

## Quick Start

### 1. Configure Environment

Ensure your `.env` file exists with required credentials:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
VECTORIZE_INDEX_NAME=portfolio-embeddings
LLM_PROVIDER=google
GOOGLE_API_KEY=your_google_api_key
EMBEDDING_DIMENSIONS=768
```

### 2. Build and Run

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Test the Service

```bash
# Health check
curl http://localhost:3000/health

# Ingest data
curl -X POST http://localhost:3000/api/documents/ingest \
  -H "Content-Type: application/json" \
  -d @seed-data.json

# Test chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What skills does the engineer have?"}'
```

---

## Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Service
```bash
docker-compose restart
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Remove Everything (including volumes)
```bash
docker-compose down -v
```

---

## Using Docker Without Compose

### Build Image
```bash
docker build -t portfolio-chatbot .
```

### Run Container
```bash
docker run -d \
  --name portfolio-chatbot \
  -p 3000:3000 \
  --env-file .env \
  portfolio-chatbot
```

### View Logs
```bash
docker logs -f portfolio-chatbot
```

### Stop Container
```bash
docker stop portfolio-chatbot
docker rm portfolio-chatbot
```

---

## Environment Variables

All variables from `.env` are automatically loaded. Override specific values:

```bash
# Use OpenAI instead of Google
docker-compose up -d -e LLM_PROVIDER=openai -e OPENAI_API_KEY=sk-...

# Change port
docker-compose up -d -e PORT=8080
```

---

## Production Deployment

### With Docker Compose

```bash
# Set production environment
export NODE_ENV=production

# Start with production settings
docker-compose up -d

# Enable auto-restart
docker-compose up -d --restart=always
```

### Health Checks

The container includes automatic health checks:
- Checks `/health` endpoint every 30 seconds
- 3 retries before marking unhealthy
- 40 second startup grace period

View health status:
```bash
docker-compose ps
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Common issues:
# - Missing .env file
# - Invalid API keys
# - Port 3000 already in use
```

### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - "8080:3000"  # Use port 8080 instead
```

Or use environment variable:
```bash
docker-compose up -d -e PORT=8080
```

### Container Keeps Restarting

```bash
# Check logs for errors
docker-compose logs --tail=50

# Common causes:
# - Invalid Cloudflare credentials
# - Missing API keys
# - Network issues
```

### Update Environment Variables

```bash
# 1. Edit .env file
nano .env

# 2. Restart container
docker-compose restart
```

---

## Multi-Container Setup (Optional)

For production with Redis caching:

```yaml
version: '3.8'

services:
  portfolio-chatbot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

---

## Cloud Deployment

### AWS ECS
```bash
# Build and push to ECR
docker build -t portfolio-chatbot .
docker tag portfolio-chatbot:latest <account>.dkr.ecr.<region>.amazonaws.com/portfolio-chatbot:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/portfolio-chatbot:latest
```

### Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/<project>/portfolio-chatbot
gcloud run deploy portfolio-chatbot --image gcr.io/<project>/portfolio-chatbot --platform managed
```

### DigitalOcean App Platform
```bash
# Use docker-compose.yml directly
# Or push to Docker Hub
docker tag portfolio-chatbot:latest <username>/portfolio-chatbot:latest
docker push <username>/portfolio-chatbot:latest
```

---

## Monitoring

### View Resource Usage
```bash
docker stats portfolio-chatbot
```

### Check Health
```bash
docker inspect --format='{{.State.Health.Status}}' portfolio-chatbot
```

### Export Logs
```bash
docker-compose logs > logs.txt
```

---

## Backup & Restore

### Backup Configuration
```bash
# Backup .env
cp .env .env.backup

# Export container
docker export portfolio-chatbot > portfolio-chatbot-backup.tar
```

### Restore
```bash
# Restore .env
cp .env.backup .env

# Rebuild and restart
docker-compose up -d --build
```

---

## Performance Tuning

### Increase Memory Limit
```yaml
services:
  portfolio-chatbot:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Enable Logging Driver
```yaml
services:
  portfolio-chatbot:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Security Best Practices

1. **Never commit `.env`** - Use `.env.example` as template
2. **Use secrets management** in production (AWS Secrets Manager, etc.)
3. **Run as non-root user** (already configured in Dockerfile)
4. **Keep images updated**: `docker-compose pull && docker-compose up -d`
5. **Use HTTPS** with reverse proxy (nginx, Caddy)

---

## Quick Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild
docker-compose up -d --build

# Status
docker-compose ps

# Health
curl http://localhost:3000/health
```

---

## Support

- **Docker Docs**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Troubleshooting**: Check logs with `docker-compose logs`
