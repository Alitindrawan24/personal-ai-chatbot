# Bilingual Support (English & Indonesian)

The chatbot now supports both English and Indonesian languages.

## Usage

### English (Default)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "question": "What programming languages does the engineer know?"
  }'
```

Or explicitly:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "question": "What programming languages does the engineer know?",
    "language": "en"
  }'
```

**Response:**
```json
{
  "answer": "The engineer is proficient in Node.js, Python, Go, and TypeScript.",
  "sources": [...],
  "confidence": 0.89
}
```

### Indonesian

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "question": "Bahasa pemrograman apa yang dikuasai engineer ini?",
    "language": "id"
  }'
```

**Response:**
```json
{
  "answer": "Engineer ini menguasai Node.js, Python, Go, dan TypeScript.",
  "sources": [...],
  "confidence": 0.89
}
```

## API Parameters

| Parameter | Type | Required | Default | Values |
|-----------|------|----------|---------|--------|
| `question` | string | Yes | - | Any question |
| `language` | string | No | `en` | `en`, `id` |
| `conversationId` | string | No | - | Any string |

## Examples

### English Questions

```bash
# Skills
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "What databases does the engineer use?", "language": "en"}'

# Experience
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "How many years of experience?", "language": "en"}'

# Projects
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "Tell me about the e-commerce project", "language": "en"}'
```

### Indonesian Questions

```bash
# Skills
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "Database apa yang digunakan engineer ini?", "language": "id"}'

# Experience
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{"question": "Berapa tahun pengalaman kerjanya?", "language": "id"}'

# Projects
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Ceritakan tentang proyek e-commerce", "language": "id"}'
```

## How It Works

1. **Language Detection**: The `language` parameter determines the response language
2. **System Prompt**: Different prompts for each language ensure natural responses
3. **Context Translation**: The LLM responds in the requested language
4. **Fallback Messages**: "No information" messages are localized

## Response Behavior

### English Response Style
- Natural and conversational
- Professional but friendly
- Direct answers without formal phrases
- Example: "The engineer is proficient in Node.js, Python, Go, and TypeScript."

### Indonesian Response Style
- Alami dan percakapan
- Profesional namun ramah
- Jawaban langsung tanpa frasa formal
- Contoh: "Engineer ini menguasai Node.js, Python, Go, dan TypeScript."

## No Information Responses

**English:**
```json
{
  "answer": "I don't have information about that in my portfolio.",
  "sources": [],
  "confidence": 0
}
```

**Indonesian:**
```json
{
  "answer": "Saya tidak memiliki informasi tentang itu di portfolio saya.",
  "sources": [],
  "confidence": 0
}
```

## Frontend Integration

### JavaScript/TypeScript

```javascript
async function askChatbot(question, language = 'en') {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, language })
  });
  return response.json();
}

// English
const englishAnswer = await askChatbot('What skills does the engineer have?', 'en');

// Indonesian
const indonesianAnswer = await askChatbot('Skill apa yang dimiliki engineer ini?', 'id');
```

### React Example

```jsx
import { useState } from 'react';

function Chatbot() {
  const [language, setLanguage] = useState('en');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, language })
    });
    const data = await response.json();
    setAnswer(data.answer);
  };

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="id">Bahasa Indonesia</option>
      </select>
      <form onSubmit={handleSubmit}>
        <input 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={language === 'en' ? 'Ask a question...' : 'Ajukan pertanyaan...'}
        />
        <button type="submit">
          {language === 'en' ? 'Send' : 'Kirim'}
        </button>
      </form>
      {answer && <p>{answer}</p>}
    </div>
  );
}
```

## Adding More Languages

To add more languages, update:

1. **Validator** (`src/utils/validators.js`):
```javascript
language: z.enum(['en', 'id', 'es', 'fr']).optional().default('en')
```

2. **Chat Service** (`src/services/chatService.js`):
```javascript
buildSystemPrompt(language) {
  if (language === 'id') { /* Indonesian */ }
  if (language === 'es') { /* Spanish */ }
  if (language === 'fr') { /* French */ }
  return /* English */;
}
```

## Testing

```bash
# Test English
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is your experience?", "language": "en"}'

# Test Indonesian
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Apa pengalaman Anda?", "language": "id"}'

# Test default (English)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is your experience?"}'
```

## Notes

- The portfolio content remains in English (stored in Vectorize)
- The LLM translates and responds in the requested language
- Embeddings work across languages (semantic search)
- Language parameter is optional (defaults to English)
