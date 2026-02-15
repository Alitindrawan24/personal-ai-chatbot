# Server-Side Conversation Storage

The chatbot now stores conversation history server-side using `conversationId`.

## Usage

### Simple Conversation (Server Stores History)

Just provide a `conversationId` - the server handles the rest!

```bash
# Message 1
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "question": "What programming languages?",
    "conversationId": "user-123"
  }'

# Message 2 (same conversationId)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "question": "How many years of experience?",
    "conversationId": "user-123"
  }'

# Message 3 (same conversationId)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "question": "What projects used them?",
    "conversationId": "user-123"
  }'
```

The server automatically:
- ✅ Retrieves previous messages
- ✅ Maintains conversation context
- ✅ Stores new messages
- ✅ Limits history to last 6 messages

## API Endpoints

### 1. Chat with Conversation

**POST** `/api/chat`

```json
{
  "question": "What skills?",
  "conversationId": "user-123",
  "language": "en"
}
```

**Response:**
```json
{
  "answer": "Node.js, Python, Go, and TypeScript.",
  "confidence": 0.89
}
```

### 2. Get Conversation History

**GET** `/api/conversations/:conversationId`

```bash
curl http://localhost:3000/api/conversations/user-123
```

**Response:**
```json
{
  "conversationId": "user-123",
  "history": [
    {
      "role": "user",
      "content": "What skills?"
    },
    {
      "role": "assistant",
      "content": "Node.js, Python, Go, and TypeScript."
    },
    {
      "role": "user",
      "content": "How many years?"
    },
    {
      "role": "assistant",
      "content": "8 years of experience."
    }
  ]
}
```

### 3. Clear Conversation

**DELETE** `/api/conversations/:conversationId`

```bash
curl -X DELETE http://localhost:3000/api/conversations/user-123
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation cleared"
}
```

### 4. Get Active Conversations Count

**GET** `/api/conversations`

```bash
curl http://localhost:3000/api/conversations
```

**Response:**
```json
{
  "activeConversations": 5
}
```

## Complete Example

```bash
# Start conversation
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "question": "What skills does the engineer have?",
    "conversationId": "conv-001"
  }'
# Response: "Node.js, Python, Go, TypeScript, PostgreSQL, MongoDB, Redis, AWS, Google Cloud, and Cloudflare."

# Follow-up (context maintained automatically)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "question": "Which ones are databases?",
    "conversationId": "conv-001"
  }'
# Response: "PostgreSQL, MongoDB, and Redis."

# Another follow-up
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d '{
    "question": "What about cloud platforms?",
    "conversationId": "conv-001"
  }'
# Response: "AWS, Google Cloud, and Cloudflare."

# Get full history
curl http://localhost:3000/api/conversations/conv-001

# Clear conversation
curl -X DELETE http://localhost:3000/api/conversations/conv-001
```

## Frontend Integration

### React Example

```javascript
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

function Chatbot() {
  const [conversationId] = useState(() => uuidv4());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    // Add user message to UI
    setMessages([...messages, { role: 'user', content: input }]);

    // Send to API (server handles history)
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-KEY': 'your_api_key'
      },
      body: JSON.stringify({
        question: input,
        conversationId // Server stores and retrieves history
      })
    });

    const data = await response.json();

    // Add assistant response to UI
    setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    setInput('');
  };

  const clearConversation = async () => {
    await fetch(`http://localhost:3000/api/conversations/${conversationId}`, {
      method: 'DELETE'
    });
    setMessages([]);
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
      <button onClick={clearConversation}>Clear</button>
    </div>
  );
}
```

### TypeScript Example

```typescript
interface ChatRequest {
  question: string;
  conversationId: string;
  language?: 'en' | 'id';
}

interface ChatResponse {
  answer: string;
  confidence: number;
}

class ChatClient {
  private conversationId: string;
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = 'http://localhost:3000', apiKey: string = '') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.conversationId = crypto.randomUUID();
  }

  async sendMessage(question: string): Promise<ChatResponse> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
        conversationId: this.conversationId
      } as ChatRequest)
    });

    return response.json();
  }

  async getHistory() {
    const response = await fetch(
      `${this.baseUrl}/api/conversations/${this.conversationId}`
    );
    return response.json();
  }

  async clearConversation() {
    await fetch(
      `${this.baseUrl}/api/conversations/${this.conversationId}`,
      { method: 'DELETE' }
    );
  }

  newConversation() {
    this.conversationId = crypto.randomUUID();
  }
}
```

## Storage Details

### In-Memory Storage (Default)
- Stores conversations in server memory
- Fast and simple
- Lost on server restart
- TTL: 1 hour of inactivity
- Max history: 6 messages (3 exchanges)

### For Production

Replace in-memory storage with:

**Redis:**
```javascript
import Redis from 'ioredis';

const redis = new Redis();

async getHistory(conversationId) {
  const data = await redis.get(`conv:${conversationId}`);
  return data ? JSON.parse(data) : [];
}

async addMessage(conversationId, role, content) {
  const history = await this.getHistory(conversationId);
  history.push({ role, content });
  await redis.setex(`conv:${conversationId}`, 3600, JSON.stringify(history));
}
```

**MongoDB:**
```javascript
async getHistory(conversationId) {
  const conv = await Conversation.findOne({ conversationId });
  return conv?.messages || [];
}

async addMessage(conversationId, role, content) {
  await Conversation.updateOne(
    { conversationId },
    { $push: { messages: { role, content } } },
    { upsert: true }
  );
}
```

**DynamoDB:**
```javascript
async getHistory(conversationId) {
  const result = await dynamodb.get({
    TableName: 'Conversations',
    Key: { conversationId }
  }).promise();
  return result.Item?.messages || [];
}
```

## Comparison: Server vs Client Storage

| Feature | Server Storage | Client Storage |
|---------|---------------|----------------|
| **Simplicity** | ✅ Very simple | ❌ More complex |
| **Payload Size** | ✅ Small | ❌ Grows with history |
| **Persistence** | ✅ Survives page refresh | ❌ Lost on refresh |
| **Multi-device** | ✅ Works across devices | ❌ Device-specific |
| **Privacy** | ⚠️ Stored on server | ✅ Client-side only |
| **Scalability** | ⚠️ Needs storage | ✅ No server storage |

## Configuration

### Adjust History Length

Edit `src/services/conversationService.js`:

```javascript
this.maxHistoryLength = 10; // Keep last 10 messages
```

### Adjust TTL

```javascript
this.ttl = 7200000; // 2 hours
```

### Cleanup Interval

```javascript
setInterval(() => conversationService.cleanup(), 300000); // 5 minutes
```

## Testing

```bash
# Test conversation flow
CONV_ID="test-$(date +%s)"

# Message 1
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d "{\"question\": \"What skills?\", \"conversationId\": \"$CONV_ID\"}"

# Message 2
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key" \
  -d "{\"question\": \"How many years?\", \"conversationId\": \"$CONV_ID\"}"

# Get history
curl "http://localhost:3000/api/conversations/$CONV_ID"

# Clear
curl -X DELETE "http://localhost:3000/api/conversations/$CONV_ID"
```

## Benefits

- ✅ **Simpler client code** - No need to manage history
- ✅ **Smaller payloads** - Only send current question
- ✅ **Persistent** - Survives page refresh
- ✅ **Multi-device** - Same conversation across devices
- ✅ **Automatic cleanup** - Expired conversations removed

## Notes

- ConversationId can be any unique string (UUID, user ID, session ID)
- History automatically expires after 1 hour of inactivity
- Only last 6 messages kept to prevent token overflow
- For production, use Redis/MongoDB/DynamoDB instead of in-memory storage
