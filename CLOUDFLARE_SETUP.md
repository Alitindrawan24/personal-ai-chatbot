# Cloudflare Setup Guide

Quick guide to get your Cloudflare Account ID, API Token, and create a Vectorize index.

---

## 1. Get Cloudflare Account ID

### Method 1: From Dashboard (Easiest)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign in (or create a free account)
3. Click on **"Workers & Pages"** in the left sidebar
4. Your **Account ID** is displayed on the right side of the page
5. Copy it (format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### Method 2: From URL
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Look at the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>`
3. The Account ID is the string after the last `/`

### Method 3: Using Wrangler CLI
```bash
npx wrangler whoami
```
Output shows your Account ID.

---

## 2. Get Cloudflare API Token

### Step-by-Step:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click your profile icon (top right) → **"My Profile"**
3. Click **"API Tokens"** in the left menu
4. Click **"Create Token"**
5. Find **"Edit Cloudflare Workers"** template → Click **"Use template"**
6. Scroll down to **"Account Resources"**
7. Add permission: **"Account"** → **"Vectorize"** → **"Edit"**
8. Click **"Continue to summary"**
9. Click **"Create Token"**
10. **Copy the token immediately** (you won't see it again!)

### Required Permissions:
- ✅ Account - Workers Scripts - Edit
- ✅ Account - Vectorize - Edit
- ✅ Account - Workers KV Storage - Edit (optional)

---

## 3. Create Vectorize Index

### Prerequisites:
- Cloudflare account (free tier works)
- Wrangler CLI installed: `npm install -g wrangler`
- Logged in: `npx wrangler login`

### Create Index:

#### For Google AI Studio (768 dimensions):
```bash
npx wrangler vectorize create portfolio-embeddings --dimensions=768 --metric=cosine
```

#### For OpenAI (1536 dimensions):
```bash
npx wrangler vectorize create portfolio-embeddings --dimensions=1536 --metric=cosine
```

### Verify Index Created:
```bash
npx wrangler vectorize list
```

Output:
```
┌──────────────────────────┬─────────────┬────────┐
│ Name                     │ Dimensions  │ Metric │
├──────────────────────────┼─────────────┼────────┤
│ portfolio-embeddings     │ 768         │ cosine │
└──────────────────────────┴─────────────┴────────┘
```

### Get Index Details:
```bash
npx wrangler vectorize get portfolio-embeddings
```

---

## 4. Configure .env File

Copy these values to your `.env`:

```env
# From Step 1
CLOUDFLARE_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# From Step 2
CLOUDFLARE_API_TOKEN=your_api_token_here

# From Step 3 (the name you created)
VECTORIZE_INDEX_NAME=portfolio-embeddings
```

---

## Complete .env Example

```env
PORT=3000
NODE_ENV=development

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
VECTORIZE_INDEX_NAME=portfolio-embeddings

# LLM Provider (google, openai, or cloudflare)
LLM_PROVIDER=google

# Google AI Studio
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_MODEL=gemini-1.5-flash

# Embedding Configuration
EMBEDDING_DIMENSIONS=768
CHUNK_SIZE=500
CHUNK_OVERLAP=50

# Search Configuration
TOP_K_RESULTS=5
SIMILARITY_THRESHOLD=0.7

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
```

---

## Troubleshooting

### "wrangler: command not found"
```bash
npm install -g wrangler
# or
npx wrangler login
```

### "You must be logged in"
```bash
npx wrangler login
```
This opens a browser to authenticate.

### "Index already exists"
```bash
# List existing indexes
npx wrangler vectorize list

# Delete if needed
npx wrangler vectorize delete portfolio-embeddings

# Create new one
npx wrangler vectorize create portfolio-embeddings --dimensions=768 --metric=cosine
```

### "Permission denied"
- Verify API token has **Vectorize Edit** permission
- Regenerate token with correct permissions

### "Account ID not found"
- Make sure you're logged into the correct Cloudflare account
- Check the URL in dashboard: `dash.cloudflare.com/<ACCOUNT_ID>`

---

## Quick Test

Verify your setup:

```bash
# Test Wrangler connection
npx wrangler whoami

# List your indexes
npx wrangler vectorize list

# Get index details
npx wrangler vectorize get portfolio-embeddings
```

---

## Visual Guide

### Finding Account ID:
```
Cloudflare Dashboard
└── Workers & Pages
    └── Overview
        └── Account ID: [a1b2c3d4e5f6...] (right side)
```

### Creating API Token:
```
Profile Icon (top right)
└── My Profile
    └── API Tokens
        └── Create Token
            └── Edit Cloudflare Workers (template)
                └── Add Vectorize permission
                    └── Create Token
```

### Creating Vectorize Index:
```bash
Terminal:
$ npx wrangler vectorize create portfolio-embeddings --dimensions=768 --metric=cosine
✅ Created index 'portfolio-embeddings'
```

---

## Need Help?

- **Cloudflare Docs**: https://developers.cloudflare.com/vectorize/
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Community**: https://discord.gg/cloudflaredev
