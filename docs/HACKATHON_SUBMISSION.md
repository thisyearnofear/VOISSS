# VOISSS Flutter Butler - Serverpod Hackathon 2026

## 🎯 Project Overview

**VOISSS Flutter Butler** is an AI-powered voice recording assistant built with Flutter and Serverpod. It demonstrates the full potential of the Flutter + Serverpod stack by combining a beautiful mobile interface with a Dart-native backend.

### What It Does

VOISSS Butler helps you:
- 🎤 **Record voice memos** with high-quality audio
- 🤖 **Chat with an AI Butler** powered by Venice AI (Llama 3.3 70B)
- 📝 **Transcribe and summarize** your recordings
- 🔍 **Find recordings** by content using natural language
- 💡 **Get insights** about your recording patterns
- ⛓️ **Optional blockchain storage** via Starknet integration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUTTER APP (iOS/Android)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Recording  │  │  AI Butler   │  │  Serverpod Client│  │
│  │    Screen    │  │    Chat      │  │   (Generated)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              HETZNER SERVER (Ubuntu + Docker)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SERVERPOD SERVER (Dart)                  │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │  │
│  │  │  Butler     │ │  Database   │ │   Venice AI     │ │  │
│  │  │  Endpoint   │ │ (PostgreSQL)│ │   Integration   │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘ │  │
│  │  ┌─────────────┐ ┌─────────────┐                      │  │
│  │  │  Greeting   │ │  Generated  │                      │  │
│  │  │  Endpoint   │ │  Protocol   │                      │  │
│  │  └─────────────┘ └─────────────┘                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Flutter 3.27.0** - UI framework
- **Dart 3.6.0** - Programming language
- **Provider** - State management
- **Serverpod Client** - Generated API client

### Backend
- **Serverpod 2.9.2** - Dart backend framework
- **PostgreSQL 16** - Database
- **Venice AI API** - LLM integration (Llama 3.3 70B)
- **Docker + Docker Compose** - Deployment

### Infrastructure
- **Hetzner Cloud** - VPS hosting
- **Nginx** - Reverse proxy + SSL
- **Let's Encrypt** - SSL certificates
- **GitHub** - Source control

---

## 🚀 Live Demo

### Try It Now

**API Endpoint:** `https://butler.voisss.famile.xyz/`

**Test Commands:**
```bash
# Health check
curl https://butler.voisss.famile.xyz/butler/health

# Chat with Butler
curl -X POST "https://butler.voisss.famile.xyz/butler/chat?message=Hello"

# Get suggestions
curl https://butler.voisss.famile.xyz/butler/getSuggestions
```

### Flutter App

```bash
cd apps/mobile-flutter
flutter pub get
flutter run -d ios  # or android, macos
```

---

## 📁 Project Structure

```
VOISSS/
├── apps/
│   ├── mobile-flutter/          # Flutter app
│   │   ├── lib/
│   │   │   ├── screens/         # UI screens
│   │   │   │   ├── splash_screen.dart
│   │   │   │   ├── onboarding_screen.dart
│   │   │   │   ├── home_screen.dart
│   │   │   │   └── butler/
│   │   │   ├── services/        # Business logic
│   │   │   ├── providers/       # State management
│   │   │   └── widgets/         # Reusable widgets
│   │   └── packages/
│   │       └── voisss_butler_client/  # Generated Serverpod client
│   │
│   └── flutter-backend-serverpod/     # ⭐ SERVERPOD BACKEND
│       ├── lib/
│       │   ├── src/
│       │   │   ├── butler_endpoint.dart      # AI Butler endpoint
│       │   │   ├── greeting_endpoint.dart    # Example endpoint
│       │   │   └── generated/                # Auto-generated code
│       │   │       ├── endpoints.dart
│       │   │       └── protocol.dart
│       │   └── server.dart
│       ├── config/              # Server configuration
│       │   ├── development.yaml
│       │   └── production.yaml
│       ├── docker-compose.yaml  # Docker deployment
│       ├── Dockerfile
│       └── voisss_butler_client/  # Generated client package
│
├── services/
│   └── voisss-backend/          # Separate Node.js service (not Serverpod)
│       └── ...                  # For other VOISSS features
│
└── packages/
    └── ...
```

**Note:** The Serverpod backend is located at `apps/flutter-backend-serverpod/`. This is a complete Serverpod project with endpoints, generated code, and Docker configuration.

---

## ✨ Key Features

### 1. AI-Powered Chat
- Natural language conversations with your recordings
- Context-aware responses using chat history
- Powered by Venice AI's Llama 3.3 70B model

### 2. Voice Recording Management
- High-quality audio recording
- Organize and tag recordings
- Search by content using AI

### 3. Serverpod Backend
- **Dart-native** - Full stack Dart development
- **Type-safe** - Generated client from server code
- **Scalable** - Built-in database, caching, and logging
- **Real-time** - WebSocket support for live updates

### 4. Production Ready
- HTTPS with valid SSL certificates
- Docker containerization
- Nginx reverse proxy
- Environment-based configuration

---

## 🔧 Setup Instructions

### Prerequisites
- Flutter SDK 3.10+
- Dart SDK 3.0+
- Docker & Docker Compose
- Serverpod CLI (optional)

### Local Development

#### 1. Clone the repository:
```bash
git clone https://github.com/thisyearnofear/VOISSS.git
cd VOISSS
```

#### 2. Run the Serverpod Backend Locally:
```bash
cd apps/flutter-backend-serverpod

# Install Dart dependencies
dart pub get

# Start PostgreSQL in Docker
docker compose up -d voisss_butler_postgres

# Run database migrations
dart bin/main.dart --apply-migrations

# Start the server
dart bin/main.dart

# Server running at:
# - API: http://localhost:8080
# - Insights: http://localhost:8081
```

#### 3. Run the Flutter App:
```bash
cd apps/mobile-flutter

# Install dependencies
flutter pub get

# Run on your device
flutter run -d macos  # or ios, android
```

### Production Deployment (Hetzner)

The production backend is deployed on Hetzner Cloud:

```bash
# SSH into production server
ssh snel-bot

# Navigate to deployed server
cd /opt/voisss-flutter-server/voisss_butler/voisss_butler_server

# Deploy with Docker
docker compose up -d

# View logs
docker logs -f voisss_butler_server
```

**Production URL:** https://butler.voisss.famile.xyz/

---

## 🎥 Demo Video Script

### Opening (0:00-0:15)
- Show splash screen with "VOISSS Flutter Butler" branding
- "Welcome to VOISSS Butler - your AI voice assistant powered by Serverpod"

### Feature 1: Voice Recording (0:15-0:45)
- Navigate to Recordings tab
- Tap record button, record a short memo
- Show recording saved in list
- "Record high-quality voice memos with one tap"

### Feature 2: AI Butler Chat (0:45-1:30)
- Switch to Butler tab
- Show welcome message
- Type: "Summarize my latest recording"
- Show AI response from Venice AI
- "Chat naturally with your recordings using AI"

### Feature 3: Backend Architecture (1:30-2:00)
- Show terminal with Serverpod running
- Show Docker containers
- Show Nginx configuration
- "Built with Serverpod - Dart-native backend with PostgreSQL"

### Feature 4: API Demo (2:00-2:30)
- Show curl commands working
- Show HTTPS endpoint
- Show SSL certificate
- "Production-ready with HTTPS and auto-scaling"

### Closing (2:30-3:00)
- Show both screens side by side
- "Flutter + Serverpod = Full stack Dart"
- Show GitHub repository
- "Built for the Serverpod Hackathon 2026"

---

## 🏆 Hackathon Requirements

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Flutter app | ✅ | `apps/mobile-flutter/` |
| Serverpod backend | ✅ | `voisss_butler_server/` |
| Personal assistant | ✅ | AI Butler with chat |
| Demo video | ⏳ | 3-minute video |
| Code repository | ✅ | GitHub link |
| Original project | ✅ | New codebase |

---

## 👥 Team

- **Papa** - Developer & Designer
- Built with ❤️ for the Serverpod community

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- **Serverpod Team** - For the amazing backend framework
- **Venice AI** - For providing LLM API access
- **Flutter Team** - For the beautiful UI framework
- **Hetzner** - For reliable cloud hosting

---

## 🔗 Links

- **Live API:** https://butler.voisss.famile.xyz/
- **GitHub:** https://github.com/thisyearnofear/VOISSS
- **Serverpod:** https://serverpod.dev
- **Venice AI:** https://venice.ai

---

*Built with Flutter + Serverpod for the Serverpod Hackathon 2026*
