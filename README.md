# Lumina - AI-Native Context Communication Platform

A context-first, AI-orchestrated communication matrix built with enterprise-grade microservices architecture.

## Architecture

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| API Gateway | NestJS (TypeScript) | 3000 | REST, Auth, Business Logic |
| WebSocket Gateway | Go | 8080 | Real-time connections |
| AI Cognition | Python (FastAPI) | 8000 | RAG, Embeddings, Summaries |
| PostgreSQL | 16-alpine | 5432 | Primary data store |
| Redis | 7-alpine | 6379 | Cache, PubSub |
| NATS JetStream | Alpine | 4222 | Message broker |
| Qdrant | Latest | 6333 | Vector DB |

## Quick Start

### 1. Start Infrastructure
```bash
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Setup API
```bash
cd services/api
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run start:dev
```

### 3. Setup WebSocket Gateway
```bash
cd services/gateway
go mod download
go run ./cmd/gateway
```

### 4. Setup AI Cognition
```bash
cd services/ai-cognition
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 5. Setup Flutter Client
```bash
cd clients/mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
```

## Project Structure

```
lumina/
├── .github/workflows/     CI/CD pipelines
├── infrastructure/        Docker, K8s, Terraform
├── services/
│   ├── api/               NestJS API Gateway
│   ├── gateway/           Go WebSocket Gateway
│   └── ai-cognition/     Python AI Layer
├── clients/
│   └── mobile/            Flutter App
└── shared/
    └── types/             Shared TypeScript types
```

## Key Flows

1. **Auth**: Flutter → NestJS (JWT) → Go Gateway (token validation)
2. **Message**: Flutter → NestJS → PostgreSQL + NATS → Go Gateway → Recipients
3. **AI**: NATS event → FastAPI → OpenAI embed → Qdrant store
4. **Offline**: Drift (local) → Background sync → NATS JetStream replay
