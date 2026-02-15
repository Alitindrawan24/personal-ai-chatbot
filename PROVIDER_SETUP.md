# LLM Provider Setup Guide

This guide covers how to configure each supported LLM provider for the Portfolio AI Chatbot.

## Supported Providers

- [Google AI Studio (Gemini)](#google-ai-studio-gemini) - **Recommended** (Free tier available)
- [OpenAI](#openai) - Most powerful, paid only
- [Cloudflare Workers AI](#cloudflare-workers-ai) - Serverless, pay-as-you-go

---

## Google AI Studio (Gemini)

### Overview
- **Cost**: Free tier with generous limits
- **Models**: Gemini 1.5 Flash, Gemini 1.5 Pro
- **Embedding Dimensions**: 768
- **Best For**: Cost-effective production use, fast responses

### Setup Steps

#### 1. Get API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the generated API key

#### 2. Create Vectorize Index
```bash
npx wrangler vectorize create portfolio-embeddings --dimensions=768 --metric=cosine
```

#### 3. Configure Environment
```env
# .env
LLM_PROVIDER=google
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_MODEL=gemini-1.5-flash
EMBEDDING_DIMENSIONS=768

# Cloudflare (required for Vectorize)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
VECTORIZE_INDEX_NAME=portfolio-embeddings
```

#### 4. Available Models
```env
# Fast and efficient (recommended)
GOOGLE_MODEL=gemini-1.5-flash

# More capable, slower
GOOGLE_MODEL=gemini-1.5-pro

# Latest experimental
GOOGLE_MODEL=gemini-2.0-flash-exp
```

#### 5. Rate Limits (Free Tier)
- **Gemini 1.5 Flash**: 15 requests/minute, 1 million tokens/day
- **Gemini 1.5 Pro**: 2 requests/minute, 50 requests/day

### Troubleshooting

**Error: "API key not valid"**
- Verify API key is correct in `.env`
- Check API key has Generative AI API enabled
- Ensure no extra spaces in the key

**Error: "Resource exhausted"**
- You've hit rate limits
- Wait 60 seconds or upgrade to paid tier

---

## OpenAI

### Overview
- **Cost**: Paid only (starts at $0.0001/1K tokens)
- **Models**: GPT-4 Turbo, GPT-3.5 Turbo
- **Embedding Dimensions**: 1536
- **Best For**: Highest quality responses, production apps

### Setup Steps

#### 1. Get API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-`)
5. Add payment method in [Billing](https://platform.openai.com/account/billing)

#### 2. Create Vectorize Index
```bash
npx wrangler vectorize create portfolio-embeddings --dimensions=1536 --metric=cosine
```

#### 3. Configure Environment
```env
# .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_MODEL=gpt-4-turbo-preview
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# Cloudflare (required for Vectorize)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
VECTORIZE_INDEX_NAME=portfolio-embeddings
```

#### 4. Available Models

**Chat Models:**
```env
# Best quality, most expensive
OPENAI_MODEL=gpt-4-turbo-preview

# Faster, cheaper
OPENAI_MODEL=gpt-3.5-turbo

# Latest GPT-4
OPENAI_MODEL=gpt-4-0125-preview
```

**Embedding Models:**
```env
# Recommended (1536 dimensions)
EMBEDDING_MODEL=text-embedding-3-small

# Higher quality (3072 dimensions, requires Vectorize update)
EMBEDDING_MODEL=text-embedding-3-large

# Legacy (1536 dimensions)
EMBEDDING_MODEL=text-embedding-ada-002
```

#### 5. Pricing (as of 2024)
- **GPT-4 Turbo**: $0.01/1K input tokens, $0.03/1K output tokens
- **GPT-3.5 Turbo**: $0.0005/1K input tokens, $0.0015/1K output tokens
- **Embeddings**: $0.0001/1K tokens

### Troubleshooting

**Error: "Incorrect API key"**
- Verify key starts with `sk-`
- Check for extra spaces or newlines
- Regenerate key if compromised

**Error: "You exceeded your current quota"**
- Add payment method
- Check billing limits in dashboard
- Wait for monthly reset

---

## Cloudflare Workers AI

### Overview
- **Cost**: Pay-as-you-go ($0.011/1K neurons)
- **Models**: Llama 2, Mistral, BGE embeddings
- **Embedding Dimensions**: 768
- **Best For**: Edge deployment, Cloudflare ecosystem

### Setup Steps

#### 1. Get Cloudflare Credentials
1. Visit [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign in or create account
3. Go to **"Workers & Pages"** → **"Overview"**
4. Note your **Account ID** (in URL or sidebar)
5. Go to **"My Profile"** → **"API Tokens"**
6. Click **"Create Token"**
7. Use **"Edit Cloudflare Workers"** template
8. Add **"Account.Vectorize"** permissions
9. Copy the generated token

#### 2. Create Vectorize Index
```bash
npx wrangler vectorize create portfolio-embeddings --dimensions=768 --metric=cosine
```

#### 3. Configure Environment
```env
# .env
LLM_PROVIDER=cloudflare

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
VECTORIZE_INDEX_NAME=portfolio-embeddings
EMBEDDING_DIMENSIONS=768
```

#### 4. Available Models

**Chat Models:**
- `@cf/meta/llama-2-7b-chat-int8` (default)
- `@cf/mistral/mistral-7b-instruct-v0.1`
- `@cf/meta/llama-3-8b-instruct`

**Embedding Models:**
- `@cf/baai/bge-base-en-v1.5` (768 dimensions, default)
- `@cf/baai/bge-large-en-v1.5` (1024 dimensions)

#### 5. Pricing
- **Neurons**: $0.011 per 1,000 neurons
- **Vectorize**: $0.04 per million queried dimensions
- **Free Tier**: 10,000 neurons/day

### Troubleshooting

**Error: "Authentication error"**
- Verify Account ID is correct
- Check API token has Workers AI permissions
- Ensure token hasn't expired

**Error: "Model not found"**
- Check model name matches exactly
- Some models require Workers Paid plan

---

## Switching Between Providers

### From Google to OpenAI
```bash
# 1. Delete existing Vectorize index
npx wrangler vectorize delete portfolio-embeddings

# 2. Create new index with 1536 dimensions
npx wrangler vectorize create portfolio-embeddings --dimensions=1536 --metric=cosine

# 3. Update .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
EMBEDDING_DIMENSIONS=1536

# 4. Re-ingest documents
curl -X POST http://localhost:3000/api/documents/ingest \
  -H "Content-Type: application/json" \
  -d @seed-data.json
```

### From OpenAI to Google
```bash
# 1. Delete existing Vectorize index
npx wrangler vectorize delete portfolio-embeddings

# 2. Create new index with 768 dimensions
npx wrangler vectorize create portfolio-embeddings --dimensions=768 --metric=cosine

# 3. Update .env
LLM_PROVIDER=google
GOOGLE_API_KEY=AIza...
EMBEDDING_DIMENSIONS=768

# 4. Re-ingest documents
curl -X POST http://localhost:3000/api/documents/ingest \
  -H "Content-Type: application/json" \
  -d @seed-data.json
```

---

## Comparison Table

| Feature | Google AI Studio | OpenAI | Cloudflare Workers AI |
|---------|-----------------|--------|----------------------|
| **Free Tier** | ✅ Yes (generous) | ❌ No | ✅ Yes (limited) |
| **Cost** | Free → $0.0001/1K | $0.0005-0.03/1K | $0.011/1K neurons |
| **Quality** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Speed** | Fast | Fast | Very Fast (edge) |
| **Embedding Dims** | 768 | 1536 | 768 |
| **Rate Limits** | 15 req/min (free) | High (paid) | 10K neurons/day (free) |
| **Best For** | Development, MVP | Production | Edge apps |

---

## Recommended Setup

### For Development/Testing
```env
LLM_PROVIDER=google
GOOGLE_API_KEY=your_key
EMBEDDING_DIMENSIONS=768
```
**Why**: Free tier, fast, good quality

### For Production
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
EMBEDDING_DIMENSIONS=1536
```
**Why**: Best quality, reliable, scalable

### For Edge/Global Apps
```env
LLM_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=your_id
CLOUDFLARE_API_TOKEN=your_token
EMBEDDING_DIMENSIONS=768
```
**Why**: Low latency worldwide, integrated with Vectorize

---

## Testing Your Setup

After configuration, test with:

```bash
# 1. Start server
npm run dev

# 2. Check health
curl http://localhost:3000/health

# 3. Ingest test data
curl -X POST http://localhost:3000/api/documents/ingest \
  -H "Content-Type: application/json" \
  -d @seed-data.json

# 4. Test chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What skills does the engineer have?"}'
```

Expected response:
```json
{
  "answer": "The engineer is proficient in Node.js, Python, Go, and TypeScript...",
  "sources": [...],
  "confidence": 0.89
}
```

---

## Support

- **Google AI Studio**: [Documentation](https://ai.google.dev/docs)
- **OpenAI**: [API Reference](https://platform.openai.com/docs)
- **Cloudflare Workers AI**: [Docs](https://developers.cloudflare.com/workers-ai/)
