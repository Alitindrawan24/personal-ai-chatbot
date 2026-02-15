# Security Features

This document describes the security features implemented in the Portfolio AI Chatbot.

---

## Overview

The chatbot includes multiple layers of security:

1. **IP Whitelist** - Restrict access to specific IP addresses
2. **API Key Authentication** - Require API key for all requests
3. **Rate Limiting** - Prevent abuse and DoS attacks
4. **Content Filtering** - Block sensitive and off-topic questions
5. **Input Validation** - Sanitize and validate all inputs

---

## IP Whitelist

### Description

Restricts API access to a predefined list of IP addresses. When enabled, only requests from whitelisted IPs are allowed.

### Configuration

Set in `.env`:

```env
# Allow specific IPs (comma-separated)
IP_WHITELIST=127.0.0.1,::1,192.168.1.100,203.0.113.0

# Leave empty to allow all IPs (default)
IP_WHITELIST=
```

### Behavior

- **When set**: Only whitelisted IPs can access the API
- **When empty**: All IPs are allowed (no restriction)
- **Blocked requests**: Return `403 Forbidden`

### Use Cases

- **Development**: Restrict to localhost (`127.0.0.1,::1`)
- **Internal API**: Restrict to office/VPN IPs
- **Partner Integration**: Restrict to partner server IPs
- **Production**: Allow specific frontend server IPs

### Example

```bash
# This will be blocked if IP not in whitelist
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What skills?"}'

# Response: 403 Forbidden
{
  "error": "Access denied"
}
```

### Implementation

Located in `src/middleware/ipWhitelist.js`:

```javascript
export const ipWhitelist = (req, res, next) => {
  if (!config.ipWhitelist || config.ipWhitelist.length === 0) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress;
  
  if (config.ipWhitelist.includes(clientIp)) {
    return next();
  }

  logger.warn(`Blocked request from non-whitelisted IP: ${clientIp}`);
  return res.status(403).json({ error: 'Access denied' });
};
```

---

## API Key Authentication

### Description

Requires clients to provide a valid API key in the `X-API-KEY` header. When enabled, all requests without a valid key are rejected.

### Configuration

Set in `.env`:

```env
# Enable API key authentication
API_KEY=your_secret_api_key_here

# Leave empty to disable (default)
API_KEY=
```

### Behavior

- **When set**: All requests must include valid `X-API-KEY` header
- **When empty**: No authentication required
- **Invalid/missing key**: Return `401 Unauthorized`

### Usage

```bash
# With API key
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_secret_api_key_here" \
  -d '{"question": "What skills?"}'

# Without API key (will be rejected)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What skills?"}'

# Response: 401 Unauthorized
{
  "error": "Unauthorized"
}
```

### Best Practices

- **Use strong keys**: Generate with `openssl rand -hex 32`
- **Rotate regularly**: Change keys periodically
- **Never commit**: Keep `.env` out of version control
- **Use secrets manager**: Store in AWS Secrets Manager, Google Secret Manager, etc.
- **Different keys per environment**: Dev, staging, production

### Generate Secure API Key

```bash
# Generate random 32-byte hex string
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Implementation

Located in `src/middleware/apiKeyAuth.js`:

```javascript
export const apiKeyAuth = (req, res, next) => {
  if (!config.apiKey) {
    return next();
  }

  const providedKey = req.headers['x-api-key'];
  
  if (providedKey === config.apiKey) {
    return next();
  }

  logger.warn(`Unauthorized request - invalid or missing API key`);
  return res.status(401).json({ error: 'Unauthorized' });
};
```

---

## Rate Limiting

### Description

Limits the number of requests from a single IP address within a time window to prevent abuse and DoS attacks.

### Configuration

Set in `.env`:

```env
# Allow 100 requests per minute
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Behavior

- Tracks requests per IP address
- Returns `429 Too Many Requests` when limit exceeded
- Resets after time window expires

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1676543210
```

### Example

```bash
# After exceeding rate limit
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What skills?"}'

# Response: 429 Too Many Requests
{
  "error": "Too many requests, please try again later."
}
```

### Recommended Settings

| Environment | Window | Max Requests |
|-------------|--------|--------------|
| Development | 60s | 1000 |
| Staging | 60s | 200 |
| Production | 60s | 100 |
| Public API | 60s | 20 |

---

## Content Filtering

### Description

Blocks sensitive, inappropriate, and off-topic questions. Only allows questions about the professional portfolio.

### Allowed Topics

- Skills & technologies
- Work experience
- Projects & achievements
- Education & certifications
- Technical expertise

### Blocked Topics

- Sensitive information (passwords, credentials, personal data)
- Inappropriate content (hacking, illegal activities)
- Off-topic questions (weather, news, politics)
- Technical assistance requests (code writing, debugging)

### Response

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What is the weather today?"}'

# Response
{
  "answer": "I can only answer questions about the professional portfolio, such as skills, experience, projects, and education. Please ask something related to the engineer's background."
}
```

See [CONTENT_POLICY.md](CONTENT_POLICY.md) for full details.

---

## Input Validation

### Description

Validates and sanitizes all user inputs to prevent injection attacks and malformed requests.

### Validations

- **Question**: Required, string, max 500 characters
- **ConversationId**: Optional, string, max 100 characters
- **Language**: Optional, enum (`en`, `id`)

### Example

```bash
# Invalid request (missing question)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{}'

# Response: 400 Bad Request
{
  "error": "Question is required"
}
```

---

## Security Middleware Order

The middleware is applied in this order:

1. **IP Whitelist** - Block non-whitelisted IPs first
2. **API Key Auth** - Authenticate valid clients
3. **Rate Limiting** - Prevent abuse from authenticated clients
4. **Content Filtering** - Block inappropriate questions
5. **Input Validation** - Validate request payload

Located in `src/index.js`:

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(ipWhitelist);      // 1. IP check
app.use(apiKeyAuth);        // 2. API key check
app.use(rateLimiter);       // 3. Rate limit
// Content filtering happens in chatService
```

---

## Production Checklist

### Required

- [ ] Set strong `API_KEY` (use `openssl rand -hex 32`)
- [ ] Configure `IP_WHITELIST` if needed
- [ ] Enable HTTPS/TLS
- [ ] Set appropriate rate limits
- [ ] Use environment variables for secrets
- [ ] Never commit `.env` file

### Recommended

- [ ] Use secrets manager (AWS Secrets Manager, etc.)
- [ ] Enable CORS for specific origins only
- [ ] Setup monitoring and alerts
- [ ] Implement request logging
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Optional

- [ ] Add request signing (HMAC)
- [ ] Implement OAuth2/JWT
- [ ] Add request encryption
- [ ] Setup WAF (Web Application Firewall)
- [ ] Enable DDoS protection

---

## Testing Security

### Test IP Whitelist

```bash
# Set IP_WHITELIST=127.0.0.1 in .env
# This should work
curl http://localhost:3000/health

# From different IP (should fail)
curl http://your-server-ip:3000/health
# Response: 403 Forbidden
```

### Test API Key

```bash
# Set API_KEY=test123 in .env

# Without key (should fail)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What skills?"}'
# Response: 401 Unauthorized

# With correct key (should work)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: test123" \
  -d '{"question": "What skills?"}'
# Response: 200 OK

# With wrong key (should fail)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: wrong_key" \
  -d '{"question": "What skills?"}'
# Response: 401 Unauthorized
```

### Test Rate Limiting

```bash
# Send 101 requests quickly
for i in {1..101}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -H "X-API-KEY: your_api_key" \
    -d '{"question": "What skills?"}'
done
# Last request should return 429 Too Many Requests
```

### Test Content Filtering

```bash
# Off-topic question (should be blocked)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What is the weather?"}'
# Response: Restricted message

# Valid question (should work)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What skills does the engineer have?"}'
# Response: Actual answer
```

---

## Monitoring

### Logs

Security events are logged:

```javascript
// IP whitelist block
logger.warn(`Blocked request from non-whitelisted IP: ${clientIp}`);

// API key failure
logger.warn(`Unauthorized request - invalid or missing API key`);

// Rate limit exceeded
logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
```

### Metrics to Track

- Failed authentication attempts
- Rate limit violations
- Blocked IPs
- Content filter triggers
- Response times
- Error rates

### Alerts

Setup alerts for:

- High rate of 401/403 errors
- Unusual traffic patterns
- Multiple failed auth attempts
- Rate limit violations

---

## Common Issues

### 403 Forbidden

**Cause**: IP not in whitelist

**Solution**: 
- Add your IP to `IP_WHITELIST`
- Or set `IP_WHITELIST=` to disable

### 401 Unauthorized

**Cause**: Missing or invalid API key

**Solution**:
- Include `X-API-KEY` header
- Verify key matches `.env` value
- Or set `API_KEY=` to disable

### 429 Too Many Requests

**Cause**: Rate limit exceeded

**Solution**:
- Wait for rate limit window to reset
- Increase `RATE_LIMIT_MAX_REQUESTS`
- Implement request queuing

---

## Additional Resources

- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [CONTENT_POLICY.md](CONTENT_POLICY.md) - Content filtering details
- [README.md](README.md) - General documentation

---

## Support

For security issues, please:
1. Do NOT open public GitHub issues
2. Contact maintainers directly
3. Follow responsible disclosure practices
