# VOISSS Butler Server - Serverpod Backend

This is the **Serverpod backend** for VOISSS Flutter Butler, a Dart-native backend powering our AI voice assistant.

## 🎯 What is Serverpod?

Serverpod is a scalable, open-source backend framework for Dart. It provides:
- 🔥 **Type-safe APIs** - Generated client code from server definitions
- 💾 **Database integration** - Built-in PostgreSQL support
- ⚡ **Real-time communication** - WebSocket support
- 📊 **Logging & monitoring** - Built-in insights
- 🔐 **Authentication** - Ready-to-use auth modules

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVERPOD SERVER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Endpoints                                            │  │
│  │  ├── butler_endpoint.dart    # AI Butler logic        │  │
│  │  ├── greeting_endpoint.dart  # Hello world example    │  │
│  │  └── ...                                              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Generated Code                                       │  │
│  │  ├── endpoints.dart          # Endpoint routing       │  │
│  │  ├── protocol.dart           # Data models            │  │
│  │  └── client/                 # Generated client       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Integrations                                         │  │
│  │  ├── Venice AI               # LLM provider          │  │
│  │  └── PostgreSQL              # Database              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Dart SDK 3.0+
- Docker & Docker Compose
- Serverpod CLI (optional)

### Local Development

```bash
# Navigate to server directory
cd apps/flutter-backend-serverpod

# Install dependencies
dart pub get

# Start PostgreSQL
docker compose up -d voisss_butler_postgres

# Run migrations
dart bin/main.dart --apply-migrations

# Start server
dart bin/main.dart
```

Server will start on:
- API: http://localhost:8080
- Insights: http://localhost:8081
- Web: http://localhost:8082

### Production Deployment

```bash
# Build and run with Docker
docker compose up -d

# View logs
docker logs -f voisss_butler_server
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `lib/src/butler_endpoint.dart` | AI Butler endpoint with Venice AI integration |
| `lib/src/greeting_endpoint.dart` | Example endpoint |
| `lib/src/generated/endpoints.dart` | Auto-generated endpoint routing |
| `lib/src/generated/protocol.dart` | Auto-generated data models |
| `config/development.yaml` | Development configuration |
| `config/production.yaml` | Production configuration |
| `docker-compose.yaml` | Docker deployment config |

## 🔌 Endpoints

### Butler Endpoint

```dart
// Health check
Future<String> health(Session session)

// Chat with AI
Future<Map<String, dynamic>> chat(
  Session session, {
  required String message,
  String? recordingId,
  Map<String, dynamic>? context,
})

// Analyze audio recording
Future<Map<String, dynamic>> analyzeAudio(
  Session session, {
  required String recordingId,
  required String audioUrl,
  String? prompt,
})

// Find recordings
Future<List<Map<String, dynamic>>> findRecordings(
  Session session, {
  required String query,
})

// Get insights
Future<Map<String, dynamic>> getInsights(Session session)

// Get suggestions
Future<List<String>> getSuggestions(Session session)
```

### Example Usage

```bash
# Health check
curl http://localhost:8080/butler/health

# Chat
curl "http://localhost:8080/butler/chat?message=Hello"

# Get suggestions
curl http://localhost:8080/butler/getSuggestions
```

## 🤖 AI Integration

We use **Venice AI** (Llama 3.3 70B) for natural language processing:

```dart
// Venice AI Client
final venice = VeniceAIClient(apiKey: '...');

final response = await venice.chatCompletion([
  {'role': 'system', 'content': 'You are VOISSS Butler...'},
  {'role': 'user', 'content': 'Summarize my recording'},
]);
```

## 🗄️ Database

PostgreSQL database with automatic migrations:

```bash
# Create migration
dart bin/main.dart --create-migration

# Apply migrations
dart bin/main.dart --apply-migrations
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
VENICE_API_KEY=your_venice_api_key

# Database (for production)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional
RUNMODE=production
```

### Config Files

- `config/development.yaml` - Local development
- `config/production.yaml` - Production settings
- `config/passwords.yaml` - Secrets (not in git)

## 📦 Generated Client

Serverpod automatically generates client code:

```bash
# Generate client
cd voisss_butler_server
serverpod generate

# Output: voisss_butler_client/
```

The generated client is used by the Flutter app for type-safe API calls.

## 🌐 Live Deployment

**Production URL:** https://butler.voisss.famile.xyz/

Deployed on Hetzner Cloud with:
- Docker containers
- Nginx reverse proxy
- Let's Encrypt SSL
- Venice AI integration

## 📝 License

MIT

---

Built with ❤️ using [Serverpod](https://serverpod.dev)
