# Content Policy & Restrictions

The chatbot is restricted to answering questions about the professional portfolio only.

## ✅ Allowed Topics

The chatbot will answer questions about:
- **Skills & Technologies**: Programming languages, frameworks, tools
- **Work Experience**: Job history, roles, responsibilities
- **Projects**: Past projects, achievements, contributions
- **Education**: Degrees, schools, courses
- **Certifications**: Professional certifications
- **Technical Expertise**: Architecture, system design, best practices

## ❌ Blocked Topics

The chatbot will NOT answer questions about:

### Sensitive Information
- Passwords, API keys, credentials
- Credit card numbers, bank accounts
- Social security numbers, personal IDs
- Personal addresses, phone numbers
- Private contact information

### Inappropriate Content
- Hacking, exploits, vulnerabilities
- Illegal activities, fraud, scams
- Malware, viruses, attacks

### Off-Topic Questions
- Weather, news, politics, religion
- Medical or legal advice
- Recipes, cooking, food
- Movies, music, games, sports
- General "how-to" tutorials

### Technical Assistance Requests
- "Write code for me"
- "Debug my code"
- "Help me solve this problem"
- "Calculate this for me"
- "Translate this text"

## Response Examples

### Blocked Question (English)
**Question:** "What's the weather today?"

**Response:**
```json
{
  "answer": "I'm sorry, I can only answer questions about this engineer's professional portfolio. I cannot help with topics outside the portfolio, sensitive information, or requests unrelated to work experience, skills, and projects.",
  "sources": [],
  "confidence": 0
}
```

### Blocked Question (Indonesian)
**Question:** "Bagaimana cara hack website?"

**Response:**
```json
{
  "answer": "Maaf, saya hanya dapat menjawab pertanyaan tentang portfolio profesional engineer ini. Saya tidak dapat membantu dengan topik di luar portfolio, informasi sensitif, atau permintaan yang tidak terkait dengan pengalaman kerja, skill, dan proyek.",
  "sources": [],
  "confidence": 0
}
```

### Allowed Question (English)
**Question:** "What programming languages does the engineer know?"

**Response:**
```json
{
  "answer": "The engineer is proficient in Node.js, Python, Go, and TypeScript.",
  "sources": [...],
  "confidence": 0.89
}
```

### Allowed Question (Indonesian)
**Question:** "Proyek apa yang pernah dikerjakan?"

**Response:**
```json
{
  "answer": "Engineer ini pernah mengerjakan beberapa proyek seperti E-commerce Platform API, Real-time Analytics Pipeline, dan AI Chatbot Service.",
  "sources": [...],
  "confidence": 0.85
}
```

## How It Works

### 1. Pre-filtering
Before processing, questions are checked against blocked patterns:
- Sensitive data keywords
- Inappropriate content
- Off-topic subjects
- Technical assistance requests

### 2. System Prompt Restrictions
The LLM is instructed to:
- Only answer portfolio-related questions
- Refuse sensitive information requests
- Stay within professional scope
- Redirect off-topic questions

### 3. Response Validation
All responses are validated to ensure:
- No personal contact information
- No sensitive data
- Portfolio-focused content only

## Testing Restrictions

### Test Blocked Questions

```bash
# Sensitive data
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What is your password?"}'

# Off-topic
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What is the weather today?"}'

# Technical assistance
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "Write code to sort an array"}'

# Inappropriate
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "How to hack a website?"}'
```

All should return the restricted response message.

### Test Allowed Questions

```bash
# Skills
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What skills does the engineer have?"}'

# Experience
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "How many years of experience?"}'

# Projects
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "Tell me about the projects"}'
```

All should return portfolio information.

## Customizing Restrictions

To modify blocked patterns, edit `src/services/chatService.js`:

```javascript
isInappropriateQuestion(question) {
  const blockedPatterns = [
    // Add your patterns here
    /\byour_pattern\b/i,
  ];
  return blockedPatterns.some(pattern => pattern.test(question));
}
```

To customize the restricted message:

```javascript
getRestrictedResponse(language) {
  if (language === 'id') {
    return {
      answer: "Your custom Indonesian message",
      sources: [],
      confidence: 0
    };
  }
  return {
    answer: "Your custom English message",
    sources: [],
    confidence: 0
  };
}
```

## Security Best Practices

1. **Never expose sensitive data** in portfolio content
2. **Regularly review logs** for attempted misuse
3. **Update blocked patterns** as needed
4. **Monitor for bypass attempts**
5. **Keep system prompts strict** about scope

## Compliance

This content policy helps ensure:
- ✅ Privacy protection
- ✅ Data security
- ✅ Professional boundaries
- ✅ Appropriate use
- ✅ Legal compliance

## Support

If you need to adjust the content policy for your use case, modify:
- `isInappropriateQuestion()` - Pattern matching
- `getRestrictedResponse()` - Blocked message
- `buildSystemPrompt()` - LLM instructions
