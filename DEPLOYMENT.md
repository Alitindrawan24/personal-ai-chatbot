# Deployment Guide

Complete guide to deploy the Portfolio AI Chatbot to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
   - [Docker Deployment](#docker-deployment)
   - [AWS Deployment](#aws-deployment)
   - [Google Cloud Run](#google-cloud-run)
   - [DigitalOcean](#digitalocean)
   - [Railway](#railway)
   - [Heroku](#heroku)
4. [Production Checklist](#production-checklist)
5. [Monitoring](#monitoring)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Cloudflare account with Vectorize index created
- ✅ LLM API key (Google AI Studio, OpenAI, or Cloudflare Workers AI)
- ✅ Environment variables configured
- ✅ Portfolio data ingested

### Create Vectorize Index

```bash
# For Cloudflare embeddings (768 dimensions)
npx wrangler vectorize create portfolio-embeddings --dimensions=768 --metric=cosine

# For OpenAI embeddings (1536 dimensions)
npx wrangler vectorize create portfolio-embeddings --dimensions=1536 --metric=cosine
```

### Get API Keys

1. **Cloudflare**: [Dashboard](https://dash.cloudflare.com/) → API Tokens
2. **Google AI Studio**: [Get API Key](https://makersuite.google.com/app/apikey)
3. **OpenAI**: [Platform](https://platform.openai.com/api-keys)

---

## Environment Setup

Create `.env` file with production values:

```env
# Server
PORT=3000
NODE_ENV=production

# Cloudflare (Required)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
VECTORIZE_INDEX_NAME=portfolio-embeddings

# LLM Provider
LLM_PROVIDER=google
GOOGLE_API_KEY=your_google_api_key
GOOGLE_MODEL=gemini-1.5-flash

# Embeddings
EMBEDDING_DIMENSIONS=768
CHUNK_SIZE=500

# Search
TOP_K_RESULTS=5
SIMILARITY_THRESHOLD=0.7

# Response
SHOW_SOURCES=false

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100

# Security
IP_WHITELIST=
API_KEY=
```

---

## Deployment Options

### Docker Deployment

#### 1. Build Image

```bash
docker build -t portfolio-chatbot .
```

#### 2. Run Container

```bash
docker run -d \
  --name portfolio-chatbot \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  portfolio-chatbot
```

#### 3. Using Docker Compose

```bash
docker-compose up -d
```

#### 4. Push to Registry

```bash
# Docker Hub
docker tag portfolio-chatbot:latest username/portfolio-chatbot:latest
docker push username/portfolio-chatbot:latest

# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag portfolio-chatbot:latest <account>.dkr.ecr.us-east-1.amazonaws.com/portfolio-chatbot:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/portfolio-chatbot:latest
```

---

### AWS Deployment

#### Option 1: AWS ECS (Fargate)

**1. Create ECR Repository**

```bash
aws ecr create-repository --repository-name portfolio-chatbot --region us-east-1
```

**2. Push Docker Image**

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t portfolio-chatbot .
docker tag portfolio-chatbot:latest <account>.dkr.ecr.us-east-1.amazonaws.com/portfolio-chatbot:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/portfolio-chatbot:latest
```

**3. Create Task Definition**

```json
{
  "family": "portfolio-chatbot",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "portfolio-chatbot",
      "image": "<account>.dkr.ecr.us-east-1.amazonaws.com/portfolio-chatbot:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {"name": "CLOUDFLARE_ACCOUNT_ID", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "CLOUDFLARE_API_TOKEN", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "GOOGLE_API_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
      ]
    }
  ]
}
```

**4. Create ECS Service**

```bash
aws ecs create-service \
  --cluster default \
  --service-name portfolio-chatbot \
  --task-definition portfolio-chatbot \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### Option 2: AWS EC2

**1. Launch EC2 Instance**

```bash
# Ubuntu 22.04 LTS, t3.small or larger
```

**2. SSH and Install Dependencies**

```bash
ssh -i key.pem ubuntu@<instance-ip>

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**3. Deploy Application**

```bash
# Clone repository
git clone <your-repo-url>
cd portfolio-chatbot-ai

# Install dependencies
npm install --production

# Create .env file
nano .env

# Start with PM2
npm install -g pm2
pm2 start src/index.js --name portfolio-chatbot
pm2 startup
pm2 save
```

**4. Setup Nginx Reverse Proxy**

```bash
sudo apt install nginx

sudo nano /etc/nginx/sites-available/portfolio-chatbot
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/portfolio-chatbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Google Cloud Run

**1. Build and Push Image**

```bash
gcloud auth login
gcloud config set project <project-id>

# Build with Cloud Build
gcloud builds submit --tag gcr.io/<project-id>/portfolio-chatbot

# Or build locally and push
docker build -t gcr.io/<project-id>/portfolio-chatbot .
docker push gcr.io/<project-id>/portfolio-chatbot
```

**2. Deploy to Cloud Run**

```bash
gcloud run deploy portfolio-chatbot \
  --image gcr.io/<project-id>/portfolio-chatbot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=3000 \
  --set-secrets CLOUDFLARE_ACCOUNT_ID=cloudflare-account-id:latest,CLOUDFLARE_API_TOKEN=cloudflare-api-token:latest,GOOGLE_API_KEY=google-api-key:latest
```

**3. Get Service URL**

```bash
gcloud run services describe portfolio-chatbot --region us-central1 --format 'value(status.url)'
```

---

### DigitalOcean

#### Option 1: App Platform

**1. Connect Repository**

- Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
- Click "Create App"
- Connect your GitHub/GitLab repository

**2. Configure App**

```yaml
name: portfolio-chatbot
services:
  - name: web
    dockerfile_path: Dockerfile
    github:
      repo: your-username/portfolio-chatbot-ai
      branch: main
    http_port: 3000
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: CLOUDFLARE_ACCOUNT_ID
        value: ${CLOUDFLARE_ACCOUNT_ID}
        type: SECRET
      - key: CLOUDFLARE_API_TOKEN
        value: ${CLOUDFLARE_API_TOKEN}
        type: SECRET
      - key: GOOGLE_API_KEY
        value: ${GOOGLE_API_KEY}
        type: SECRET
```

**3. Deploy**

- Click "Deploy"
- App Platform will build and deploy automatically

#### Option 2: Droplet

**1. Create Droplet**

```bash
# Ubuntu 22.04, Basic plan ($6/month)
```

**2. SSH and Setup**

```bash
ssh root@<droplet-ip>

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and deploy
git clone <your-repo-url>
cd portfolio-chatbot-ai
npm install --production

# Create .env
nano .env

# Start with PM2
npm install -g pm2
pm2 start src/index.js --name portfolio-chatbot
pm2 startup
pm2 save
```

---

### Railway

**1. Install Railway CLI**

```bash
npm install -g @railway/cli
railway login
```

**2. Initialize Project**

```bash
railway init
```

**3. Add Environment Variables**

```bash
railway variables set CLOUDFLARE_ACCOUNT_ID=your_account_id
railway variables set CLOUDFLARE_API_TOKEN=your_api_token
railway variables set VECTORIZE_INDEX_NAME=portfolio-embeddings
railway variables set GOOGLE_API_KEY=your_google_api_key
railway variables set LLM_PROVIDER=google
railway variables set EMBEDDING_DIMENSIONS=768
```

**4. Deploy**

```bash
railway up
```

**5. Get URL**

```bash
railway domain
```

---

### Heroku

**1. Install Heroku CLI**

```bash
curl https://cli-assets.heroku.com/install.sh | sh
heroku login
```

**2. Create App**

```bash
heroku create portfolio-chatbot
```

**3. Set Environment Variables**

```bash
heroku config:set NODE_ENV=production
heroku config:set CLOUDFLARE_ACCOUNT_ID=your_account_id
heroku config:set CLOUDFLARE_API_TOKEN=your_api_token
heroku config:set VECTORIZE_INDEX_NAME=portfolio-embeddings
heroku config:set GOOGLE_API_KEY=your_google_api_key
heroku config:set LLM_PROVIDER=google
heroku config:set EMBEDDING_DIMENSIONS=768
```

**4. Deploy**

```bash
git push heroku main
```

**5. Open App**

```bash
heroku open
```

---

## Production Checklist

### Security

- [ ] Use HTTPS (SSL/TLS certificate)
- [ ] Store secrets in environment variables or secret manager
- [ ] Enable rate limiting (already configured)
- [ ] Configure IP whitelist if needed
- [ ] Set API key authentication for production
- [ ] Add authentication if needed
- [ ] Use CORS for specific origins only
- [ ] Keep dependencies updated
- [ ] Never commit `.env` file

### Performance

- [ ] Set `NODE_ENV=production`
- [ ] Use process manager (PM2, systemd)
- [ ] Enable compression middleware
- [ ] Setup CDN for static assets
- [ ] Monitor memory usage
- [ ] Setup auto-scaling if needed

### Monitoring

- [ ] Setup health check endpoint (already at `/health`)
- [ ] Configure logging (structured JSON logs)
- [ ] Setup error tracking (Sentry, Rollbar)
- [ ] Monitor API response times
- [ ] Track conversation metrics
- [ ] Setup alerts for errors

### Backup

- [ ] Backup environment variables
- [ ] Document Vectorize index configuration
- [ ] Keep portfolio data backup
- [ ] Version control all code

---

## Monitoring

### Health Check

```bash
curl https://your-domain.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-13T09:58:39.478Z"
}
```

### Logs

**Docker:**
```bash
docker logs -f portfolio-chatbot
```

**PM2:**
```bash
pm2 logs portfolio-chatbot
```

**Cloud Services:**
- AWS CloudWatch
- Google Cloud Logging
- DigitalOcean Logs
- Railway Logs

### Metrics to Monitor

- Request rate (requests/minute)
- Response time (p50, p95, p99)
- Error rate (%)
- Memory usage (MB)
- CPU usage (%)
- Active conversations count

### Setup Alerts

**Example: AWS CloudWatch Alarm**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name portfolio-chatbot-high-error-rate \
  --alarm-description "Alert when error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## Post-Deployment

### 1. Ingest Portfolio Data

```bash
curl -X POST https://your-domain.com/api/documents/ingest \
  -H "Content-Type: application/json" \
  -d @seed-data.json
```

### 2. Test Chat

```bash
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What skills does the engineer have?"}'
```

### 3. Test Conversation

```bash
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What skills?", "conversationId": "test-001"}'

curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "How many years?", "conversationId": "test-001"}'
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs portfolio-chatbot

# Common issues:
# - Missing environment variables
# - Invalid API keys
# - Port already in use
```

### High Memory Usage

```bash
# Restart service
pm2 restart portfolio-chatbot

# Or increase memory limit
docker run -m 512m portfolio-chatbot
```

### Slow Response Times

- Check Vectorize query latency
- Verify LLM API response times
- Consider caching frequent queries
- Increase server resources

### Rate Limit Errors

- Increase `RATE_LIMIT_MAX_REQUESTS`
- Check LLM provider rate limits
- Implement request queuing

---

## Scaling

### Horizontal Scaling

**Docker Swarm:**
```bash
docker service create \
  --name portfolio-chatbot \
  --replicas 3 \
  --env-file .env \
  -p 3000:3000 \
  portfolio-chatbot
```

**Kubernetes:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portfolio-chatbot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: portfolio-chatbot
  template:
    metadata:
      labels:
        app: portfolio-chatbot
    spec:
      containers:
      - name: portfolio-chatbot
        image: portfolio-chatbot:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: portfolio-chatbot-secrets
```

### Vertical Scaling

- Increase CPU/Memory allocation
- Use larger instance types
- Optimize Node.js memory settings

---

## Cost Optimization

### LLM Costs

- **Google AI Studio**: Free tier (15 req/min)
- **OpenAI**: ~$0.0001-0.03 per 1K tokens
- **Cloudflare Workers AI**: $0.011 per 1K neurons

### Infrastructure Costs

- **Railway**: ~$5/month (Hobby plan)
- **DigitalOcean**: ~$6/month (Basic Droplet)
- **AWS ECS Fargate**: ~$15/month (0.25 vCPU, 0.5 GB)
- **Google Cloud Run**: Pay per request (~$5-20/month)
- **Heroku**: ~$7/month (Eco dyno)

### Tips

- Use Google AI Studio for free tier
- Enable `SHOW_SOURCES=false` to reduce response size
- Implement caching for frequent queries
- Use Cloudflare CDN for static assets
- Monitor and optimize API usage

---

## Support

- **Documentation**: See all `.md` files in repository
- **Issues**: Open GitHub issue
- **Cloudflare Docs**: https://developers.cloudflare.com/vectorize/
- **Google AI Studio**: https://ai.google.dev/docs

---

## Quick Reference

```bash
# Build
docker build -t portfolio-chatbot .

# Run locally
docker-compose up -d

# Deploy to Railway
railway up

# Deploy to Google Cloud Run
gcloud run deploy portfolio-chatbot --image gcr.io/<project>/portfolio-chatbot

# Check health
curl https://your-domain.com/health

# View logs
docker logs -f portfolio-chatbot
pm2 logs portfolio-chatbot

# Restart
docker restart portfolio-chatbot
pm2 restart portfolio-chatbot
```
