# Portfolio AI Chatbot

Production-ready Express.js backend for a Personal Portfolio AI Chatbot using Cloudflare Vectorize for vector embeddings and similarity search.

## Features

- **Document Ingestion**: Chunk and embed portfolio content into Cloudflare Vectorize
- **AI Chat**: Context-aware responses using RAG (Retrieval Augmented Generation)
- **Conversation History**: Server-side conversation storage with conversationId
- **Bilingual Support**: English and Indonesian language support
- **Content Filtering**: Blocks sensitive and off-topic questions
- **Clean Architecture**: Modular structure with separation of concerns
- **Provider Abstraction**: Support for OpenAI, Google AI Studio, and Cloudflare Workers AI
- **Security**: Rate limiting, input validation, error handling, content restrictions, IP whitelist, API key authentication
- **Docker Support**: Containerized deployment with Docker Compose ready

## Architecture

```
src/
├── config/           # Environment configuration
├── controllers/      # Request handlers
├── services/         # Business logic
├── infrastructure/   # External integrations
│   ├── vector/      # Vectorize client
│   ├── llm/         # LLM providers
│   └── embedding/   # Embedding providers
├── middleware/       # Express middleware
├── routes/          # API routes
└── utils/           # Utilities
```

## Prerequisites

- Node.js 20+ LTS
- Cloudflare account with Vectorize access
- API key for your chosen LLM provider:
  - OpenAI API key, OR
  - Google AI Studio API key, OR
  - Cloudflare Workers AI

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Vectorize Index

```bash
# For Google AI Studio (768 dimensions)
npx wrangler vectorize create portfolio-embeddings --dimensions=768 --metric=cosine

# For OpenAI (1536 dimensions)
npx wrangler vectorize create portfolio-embeddings --dimensions=1536 --metric=cosine
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
VECTORIZE_INDEX_NAME=portfolio-embeddings
GOOGLE_API_KEY=your_google_api_key
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Health Check

```bash
curl http://localhost:3000/health
```

### Ingest Document

```bash
curl -X POST http://localhost:3000/api/documents/ingest \
  -H "Content-Type: application/json" \
  -d @seed-data.json
```

Response:
```json
{
  "success": true,
  "chunksProcessed": 5,
  "vectorIds": ["uuid1", "uuid2", ...]
}
```

### Chat Query

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "question": "What programming languages does the engineer know?",
    "conversationId": "user-123",
    "language": "en"
  }'
```

Response:
```json
{
  "answer": "Node.js, Python, Go, and TypeScript.",
  "confidence": 0.89
}
```

### Get Conversation History

```bash
curl http://localhost:3000/api/conversations/user-123
```

Response:
```json
{
  "conversationId": "user-123",
  "history": [
    {
      "role": "user",
      "content": "What programming languages?"
    },
    {
      "role": "assistant",
      "content": "Node.js, Python, Go, and TypeScript."
    }
  ]
}
```

### Clear Conversation

```bash
curl -X DELETE http://localhost:3000/api/conversations/user-123
```

## Testing with Seed Data

1. Ingest the example portfolio:
```bash
curl -X POST http://localhost:3000/api/documents/ingest \
  -H "Content-Type: application/json" \
  -d @seed-data.json
```

2. Ask questions:
```bash
# Skills
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What databases does this engineer use?"}'

# Projects
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Tell me about the e-commerce project"}'

# Experience
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How many years of experience?"}'
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `LLM_PROVIDER` | `openai`, `google`, or `cloudflare` | google |
| `GOOGLE_API_KEY` | Google AI Studio API key | - |
| `GOOGLE_MODEL` | Google model name | gemini-1.5-flash |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `EMBEDDING_MODEL` | OpenAI embedding model | text-embedding-3-small |
| `EMBEDDING_DIMENSIONS` | Vector dimensions (768 for Cloudflare, 1536 for OpenAI) | 768 |
| `CHUNK_SIZE` | Max characters per chunk | 500 |
| `TOP_K_RESULTS` | Number of similar chunks | 5 |
| `SIMILARITY_THRESHOLD` | Min similarity score | 0.7 |
| `SHOW_SOURCES` | Show sources in response | false |
| `RATE_LIMIT_MAX_REQUESTS` | Requests per window | 100 |
| `IP_WHITELIST` | Comma-separated allowed IPs (empty = allow all) | - |
| `API_KEY` | API key for authentication (empty = disabled) | - |

### Using Cloudflare Workers AI

Set in `.env`:
```env
LLM_PROVIDER=cloudflare
```

This uses Cloudflare's AI models instead of OpenAI (no OpenAI API key needed).

### Using Google AI Studio (Gemini)

Set in `.env`:
```env
LLM_PROVIDER=google
GOOGLE_API_KEY=your_google_api_key
EMBEDDING_DIMENSIONS=768
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Build Image

```bash
docker build -t portfolio-chatbot .
```

### Run Container

```bash
docker run -p 3000:3000 --env-file .env portfolio-chatbot
```

## Deployment Options

### Option 1: Traditional Node.js Hosting

Deploy to any Node.js hosting platform:
- AWS EC2 / ECS
- Google Cloud Run
- DigitalOcean App Platform
- Heroku
- Railway

### Option 2: Cloudflare Workers (Hybrid)

- Keep Express.js on traditional hosting
- Use Cloudflare Workers for edge caching
- Vectorize queries stay fast at the edge

### Option 3: Serverless

Adapt for serverless platforms:
- AWS Lambda + API Gateway
- Google Cloud Functions
- Vercel (with modifications)

## Project Structure Details

### Clean Architecture Layers

1. **Routes**: HTTP endpoint definitions
2. **Controllers**: Request/response handling
3. **Services**: Business logic (chat, document processing)
4. **Infrastructure**: External APIs (Vectorize, OpenAI, Cloudflare AI)
5. **Utils**: Shared utilities (logging, chunking, validation)

### Key Design Patterns

- **Factory Pattern**: Provider selection (OpenAI vs Cloudflare)
- **Strategy Pattern**: Interchangeable LLM/embedding providers
- **Repository Pattern**: Vectorize client abstraction

## Customization

### Modify Chatbot Persona

Edit `src/services/chatService.js` → `buildSystemPrompt()`:

```javascript
buildSystemPrompt() {
  return `You are a [YOUR PERSONA]...`;
}
```

### Adjust Chunking Strategy

Edit `src/utils/chunker.js` → `semanticChunk()` for custom chunking logic.

### Add New Endpoints

1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Register in `src/index.js`

## Troubleshooting

### Vectorize Insert Fails

- Verify `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`
- Check index exists: `npx wrangler vectorize list`
- Ensure dimensions match (768 for Cloudflare, 1536 for OpenAI)

### No Relevant Results

- Lower `SIMILARITY_THRESHOLD` in `.env`
- Increase `TOP_K_RESULTS`
- Verify documents were ingested successfully

### Rate Limit Errors

- Increase `RATE_LIMIT_MAX_REQUESTS`
- Adjust `RATE_LIMIT_WINDOW_MS`

---

## Documentation

- **[CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md)** - Cloudflare credentials setup
- **[CONTENT_POLICY.md](CONTENT_POLICY.md)** - Content filtering and restrictions
- **[CONVERSATION_STORAGE.md](CONVERSATION_STORAGE.md)** - Server-side conversation management
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide (AWS, GCP, Railway, etc.)
- **[DOCKER_GUIDE.md](DOCKER_GUIDE.md)** - Docker deployment guide
- **[LANGUAGE_SUPPORT.md](LANGUAGE_SUPPORT.md)** - Bilingual support (English & Indonesian)
- **[PROVIDER_SETUP.md](PROVIDER_SETUP.md)** - LLM provider configuration guide
- **[SECURITY.md](SECURITY.md)** - Security features (IP whitelist, API key authentication)

## Security Best Practices

- Never commit `.env` file
- Use environment variables for secrets
- Enable CORS only for trusted origins
- Implement authentication for production (API key included)
- Use IP whitelist for restricted access
- Use HTTPS in production
- Rotate API keys regularly

## Performance Optimization

- Batch embed multiple chunks together
- Cache frequent queries
- Use Cloudflare CDN for static assets
- Implement connection pooling
- Monitor Vectorize query latency

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Security

- **Never commit `.env` file** - It's in `.gitignore` for a reason
- **Use `.env.example` as template** - Copy and fill with your own credentials
- **Rotate API keys regularly** - Especially after development/testing
- **Report security issues privately** - See [SECURITY.md](SECURITY.md)

For detailed security features, see [SECURITY.md](SECURITY.md).

## Support

For issues or questions, please open a GitHub issue.
