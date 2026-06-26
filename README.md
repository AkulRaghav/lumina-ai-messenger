<p align="center">
  <img src="https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<h1 align="center">Lumina</h1>
<p align="center"><b>AI-Native Context Communication Platform</b></p>
<p align="center">A context-first, AI-orchestrated communication matrix built with enterprise-grade event-driven microservices. Not another messaging app — a unified Context Graph where conversations, files, and AI insights converge based on relevance.</p>

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Microservices](#microservices)
- [Advanced Engineering](#advanced-engineering)
- [Security](#security)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Flutter Client](#flutter-client)
- [Infrastructure](#infrastructure)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Demo Accounts](#demo-accounts)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Flutter Client                                │
│         (Riverpod • GoRouter • Nexora Design System)                 │
└────────────────┬─────────────────────────┬──────────────────────────┘
                 │ REST/JWT                 │ WebSocket (WSS)
                 ▼                         ▼
┌────────────────────────┐    ┌──────────────────────────────┐
│   NestJS API Gateway   │    │   Go WebSocket Gateway       │
│   (Port 3000)          │    │   (Port 8080)                │
│   • Auth (JWT RS256)   │    │   • JetStream Consumers      │
│   • CQRS Commands      │    │   • JWT Validation           │
│   • Rate Limiting      │    │   • Per-Connection Rate Limit│
│   • IDOR Protection    │    │   • Membership Verification  │
└────────┬───────────────┘    └──────────────┬───────────────┘
         │                                   │
         ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NATS JetStream (Event Bus)                         │
│         Subjects: chat.*.messages • presence.* • ai.*                │
│         Guarantees: Exactly-once • Durable • File-backed             │
└───┬──────────┬──────────┬──────────┬──────────┬─────────────────────┘
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────────────┐
│Postgres││ Redis  ││Qdrant  ││  S3    ││ AI Cognition   │
│  (DB)  ││(Cache) ││(Vector)││(Media) ││ (FastAPI/GPT-4)│
└────────┘└────────┘└────────┘└────────┘└────────────────┘
```

---

## Tech Stack

### Backend Services

| Service | Language | Framework | Port | Purpose |
|---------|----------|-----------|------|---------|
| API Gateway | TypeScript | NestJS 10 | 3000 | REST API, Auth, Business Logic, CQRS |
| WebSocket Gateway | Go 1.21 | gorilla/websocket | 8080 | Real-time messaging, Presence |
| AI Cognition | Python 3.12 | FastAPI | 8000 | RAG, Embeddings, Summaries, Smart Replies |
| Presence | TypeScript + Go | NATS + Redis + gRPC | 50051 | Online/offline state, Typing indicators |
| Notifications | TypeScript | NATS + Firebase | — | Push delivery, Deduplication, Mute |
| Media Processor | TypeScript | Sharp + FFmpeg | — | Thumbnails, Transcoding, Moderation |
| Analytics | TypeScript | Express + Prometheus | 9090 | Real-time metrics, Dashboards |

### Data Layer

| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 16-alpine | Primary relational store (Prisma ORM) |
| Redis | 7-alpine | Caching, rate limiting, presence TTL, pub/sub |
| NATS JetStream | 2.10 | Event streaming, offline queues, exactly-once delivery |
| Qdrant | Latest | Vector similarity search (HNSW index, 1536-dim) |
| AWS S3 | — | Media file storage (images, voice, video) |

### Frontend

| Technology | Purpose |
|-----------|---------|
| Flutter 3.22 | Cross-platform UI (Android, iOS, Web, Windows, macOS) |
| Riverpod | Reactive state management |
| GoRouter | Declarative routing with auth guards |
| Flutter Animate | 120fps micro-interactions |

### Infrastructure

| Tool | Purpose |
|------|---------|
| Docker Compose | Local development environment |
| Kubernetes (EKS) | Production orchestration |
| Terraform | Infrastructure as Code |
| ArgoCD | GitOps deployment |
| GitHub Actions | CI/CD pipeline |
| Nginx Ingress | TLS termination, WebSocket routing, HSTS |
| Prometheus + Grafana | Observability and alerting |

---

## Microservices

### 1. API Gateway (NestJS)

The central REST API handling authentication, authorization, and business logic.

| Module | Responsibility |
|--------|---------------|
| `auth` | JWT (HS256 pinned), bcrypt-12, refresh token rotation, account lockout |
| `chat` | CRUD with IDOR-protected membership guards |
| `media` | S3 upload with MIME whitelist (9 allowed types) |
| `admin` | Role-gated analytics (AdminRoleGuard) |

### 2. WebSocket Gateway (Go)

High-performance real-time engine managing persistent connections.

| Feature | Implementation |
|---------|---------------|
| Auth | JWT validated on upgrade (rejects alg:none, refresh tokens) |
| Delivery | NATS JetStream durable consumers per user/chat |
| Rate Limit | 30 messages/10 seconds per connection |
| Membership | Verifies chat access before allowing subscription |
| Backpressure | Leaky bucket + Token bucket algorithms |

### 3. AI Cognition (Python)

RAG pipeline powered by OpenAI and Qdrant vector database.

| Capability | Model | Description |
|-----------|-------|-------------|
| Semantic Search | text-embedding-3-small | Find messages by meaning, not keywords |
| Summarization | GPT-4 Turbo | 3-bullet chat catch-up summaries |
| Smart Replies | GPT-3.5 Turbo | 3 contextual reply suggestions |
| Embeddings | text-embedding-3-small | 1536-dim vectors stored in Qdrant HNSW |

### 4. Presence Service

Real-time user status tracking with Redis TTL-based expiry.

| Feature | TTL | Description |
|---------|-----|-------------|
| Online/Offline | 90s | Auto-expires if heartbeat missed |
| Typing Indicator | 4s | Auto-clears after typing stops |
| Heartbeat | 30s | Extends presence TTL |

### 5. Notifications Service

Push notification delivery with intelligent filtering.

| Check | Description |
|-------|-------------|
| Mute check | Skip if user muted the chat |
| Online check | Skip if user is currently active |
| Dedup check | Redis NX lock prevents duplicate pushes |
| Multi-device | Sends to all registered FCM tokens |

### 6. Media Processor

Background media pipeline triggered via NATS queue workers.

| Operation | Technology |
|-----------|-----------|
| Thumbnails | Sharp (resize to 300x300, JPEG 70%) |
| Video Transcode | FFmpeg (H.264/AAC MP4) |
| Image Compress | Sharp (WebP 80%) |
| Content Moderation | AWS Rekognition / OpenAI Moderation |

### 7. Analytics Service

Real-time metrics collection and Prometheus-compatible endpoint.

| Metric | Type | Description |
|--------|------|-------------|
| `lumina_messages_total` | Counter | Total messages processed |
| `lumina_active_connections` | Gauge | Current WebSocket connections |
| `lumina_ai_requests_total` | Counter | Total AI processing requests |

---

## Advanced Engineering

From-scratch implementations of computer science fundamentals:

| Algorithm / Pattern | File | Use Case |
|--------------------|------|----------|
| Circuit Breaker | `common/circuit-breaker/` | Prevents cascading failures to downstream services |
| Event Sourcing | `common/event-store/` | Append-only log with optimistic concurrency |
| CQRS | `common/cqrs/` | Separate read/write models for scalability |
| Saga Pattern | `common/saga/` | Distributed transactions with compensating rollbacks |
| Consistent Hashing | `common/consistent-hash/` | Shard distribution with minimal rehashing (150 vnodes) |
| Bloom Filter | `common/bloom-filter/` | Probabilistic "has user seen message?" check |
| CRDT (LWW-Register) | `common/crdt/` | Conflict-free replication across data centers |
| Vector Clock | `common/vector-clock/` | Causal ordering without synchronized clocks |
| LRU Cache | `common/lru-cache/` | O(1) cache with TTL (doubly-linked list + HashMap) |
| Skip List | `common/skip-list/` | Sorted index with O(log n) range queries |
| Merkle Tree | `common/merkle-tree/` | Tamper-proof message history verification |
| DAG Scheduler | `common/dag-scheduler/` | Parallel task execution with dependency resolution |
| Raft Consensus | `gateway/internal/raft/` | Leader election for gateway cluster |
| Token Bucket | `gateway/internal/ratelimit/` | API rate limiting (allows bursts) |
| Leaky Bucket | `gateway/internal/backpressure/` | Traffic shaping (constant output rate) |
| BPE Tokenizer | `ai-cognition/core/bpe_tokenizer.py` | From-scratch GPT tokenizer |
| Self-Attention | `ai-cognition/core/attention.py` | Multi-head Transformer mechanism |

---

## Security

| Layer | Implementation |
|-------|---------------|
| Authentication | JWT HS256 (algorithm pinned, rejects alg:none). 15min access + 30d refresh tokens with rotation. |
| Password Storage | bcrypt with cost factor 12 |
| Account Lockout | 5 failed attempts → 15 minute exponential backoff |
| Authorization | `ChatMembershipGuard` prevents IDOR on every resource endpoint |
| Admin Access | `AdminRoleGuard` restricts `/admin/*` to `ADMIN_EMAILS` env var |
| Input Validation | `class-validator` DTOs with `forbidNonWhitelisted: true` globally |
| CORS | Explicit origin allowlist (not wildcard) |
| Rate Limiting | Sliding window (API) + Token bucket (WebSocket) |
| Transport | TLS 1.3 via cert-manager + HSTS + force-ssl-redirect |
| Media Upload | MIME type whitelist (9 types), 10MB size limit |
| WebSocket | Origin validation, per-connection rate limit, membership verification |
| Secrets | All via env vars. Zero hardcoded keys in source. |

---

## Database Schema

```prisma
User ──┬── ChatMember ──── Chat ──── Message ──── Reaction
       │                              │
       ├── CallParticipant ── Call ────┘
       │
       └── (password, publicKey, lastSeen, isOnline)
```

| Model | Key Fields |
|-------|-----------|
| User | id, email, name, password (bcrypt-12), publicKey, isOnline, lastSeen |
| Chat | id, type (DIRECT/GROUP/CHANNEL), name, isArchived, isPinned |
| ChatMember | chatId, userId, role (ADMIN/MODERATOR/MEMBER), joinedAt |
| Message | id, chatId, senderId, content, type (TEXT/IMAGE/VIDEO/VOICE/FILE/SYSTEM), state (QUEUED/SENT/DELIVERED/READ/FAILED), mediaUrl, mediaEncryption |
| Reaction | messageId, userId, emoji (unique per user per emoji) |
| Call | chatId, callerId, status (RINGING/ONGOING/ENDED/MISSED), type (AUDIO/VIDEO), durationSec |

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ✗ | Create account (validated DTO) |
| POST | `/auth/login` | ✗ | Returns access + refresh token |
| POST | `/auth/refresh` | ✗ | Rotate refresh token |

### Chats

| Method | Endpoint | Auth | Guard | Description |
|--------|----------|------|-------|-------------|
| GET | `/chats` | ✓ | — | List user's chats |
| POST | `/chats` | ✓ | — | Create chat (validated memberIds) |
| GET | `/chats/:id/messages` | ✓ | MembershipGuard | Get messages (IDOR-protected) |
| POST | `/chats/:id/messages` | ✓ | MembershipGuard | Send message (4000 char limit) |

### Media

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/media/upload` | ✓ | Upload file (10MB max, MIME whitelist) |

### Admin (Role-Protected)

| Method | Endpoint | Auth | Guard | Description |
|--------|----------|------|-------|-------------|
| GET | `/admin/metrics` | ✓ | AdminRoleGuard | Dashboard metrics |
| GET | `/admin/analytics/messages-volume` | ✓ | AdminRoleGuard | 7-day message volume |
| GET | `/admin/analytics/top-chats` | ✓ | AdminRoleGuard | Most active chats |

---

## Flutter Client

### Design System (Nexora)

| Token | Value | Usage |
|-------|-------|-------|
| `bgPrimary` | `#0E0B16` | Main background |
| `bgSecondary` | `#161220` | Card backgrounds |
| `accentPrimary` | `#7C5CFF` | Buttons, badges, active states |
| `online` | `#34D399` | Presence indicators |
| `textPrimary` | `#F5F3FA` | Headings, names |
| `textSecondary` | `#9C96B5` | Message previews |
| `bubbleOutgoing` | `#6C4CF1` | Sent message bubbles |
| `bubbleIncoming` | `#1E1830` | Received message bubbles |

### Screens

| Screen | Features |
|--------|----------|
| Login | Quick-login cards (User/Admin), form validation, demo mode |
| Home (Chat List) | Search, filter chips, gradient avatars, online dots, unread badges, bottom nav |
| Chat Detail | Text/voice/image bubbles, voice waveform, attachment grid (8 types), typing indicator |
| Profile | Glowing avatar, E2EE badge, stats, navigation |
| Settings | Dark mode, biometrics, screenshot blocking, cache management, logout |
| AI Tools | Semantic search, summarize, translate, grammar, smart replies |

---

## Infrastructure

### Kubernetes Manifests

| Resource | Replicas | CPU/Mem | Notes |
|----------|----------|---------|-------|
| API Gateway | 3 | 250m-1000m / 256-512Mi | Rolling update, liveness/readiness probes |
| WebSocket Gateway | 5 | 500m-2000m / 512Mi-1Gi | High replica count for long-lived connections |
| AI Cognition | 1 | 200m-1000m / 512Mi-1Gi | GPU spot instances in production |

### Ingress Configuration

```yaml
TLS: cert-manager + letsencrypt-prod
HSTS: max-age=31536000, includeSubdomains
WebSocket: proxy-read-timeout=3600, proxy-send-timeout=3600
SSL Redirect: forced
```

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ & npm
- Go 1.21+
- Python 3.12+ & pip
- Flutter 3.22+

### 1. Start Infrastructure

```bash
cd infrastructure
docker-compose up -d
```

### 2. Setup & Seed API

```bash
cd services/api
npm install
npm run db:setup   # generates, migrates, and seeds two demo accounts
npm run start:dev
```

### 3. Start Go Gateway

```bash
cd services/gateway
export JWT_SECRET="change-me-to-a-64-char-random-string-in-production-abc123xyz"
go mod tidy
go run main.go
```

### 4. Start AI Service (optional)

```bash
cd services/ai-cognition
pip install -r requirements.txt
export OPENAI_API_KEY="sk-..."
uvicorn main:app --reload --port 8000
```

### 5. Run Flutter

```bash
cd clients/mobile
flutter pub get
flutter run -d chrome
```

---

## Project Structure

```
lumina/
├── .github/workflows/ci-cd.yml        # GitHub Actions (test → build → deploy)
├── infrastructure/
│   ├── docker-compose.yml             # Postgres, Redis, NATS, Qdrant
│   ├── k8s/                           # Namespace, Deployments, Ingress, ConfigMap
│   └── terraform/                     # AWS EKS provisioning (placeholder)
├── services/
│   ├── api/                           # NestJS REST API
│   │   ├── prisma/schema.prisma       # Full DB schema
│   │   ├── prisma/seed.ts             # Demo account seeder
│   │   └── src/
│   │       ├── auth/                  # JWT auth with lockout & refresh
│   │       ├── chat/                  # IDOR-protected chat operations
│   │       ├── media/                 # S3 upload with MIME filter
│   │       ├── admin/                 # Role-gated analytics
│   │       └── common/               # DS&A implementations (see below)
│   ├── gateway/                       # Go WebSocket + NATS JetStream
│   │   ├── main.go                    # Hub, JWT, rate limiting
│   │   └── internal/                  # Raft, TokenBucket, LeakyBucket
│   ├── ai-cognition/                  # Python FastAPI
│   │   ├── main.py                    # Qdrant + OpenAI endpoints
│   │   └── app/core/                  # BPE Tokenizer, Self-Attention
│   ├── presence/                      # Online/Typing via Redis TTL
│   ├── notifications/                 # FCM push with dedup & mute
│   ├── media-processor/               # Sharp + FFmpeg pipeline
│   └── analytics/                     # Prometheus metrics collector
├── clients/
│   └── mobile/                        # Flutter (Android/iOS/Web/Desktop)
│       ├── lib/
│       │   ├── theme.dart             # Nexora design system
│       │   ├── app_router.dart        # GoRouter + auth state
│       │   ├── features/              # Login, Home, Chat, Profile, Settings, AI
│       │   └── models/                # ChatPreview, ChatMessage
│       └── pubspec.yaml
└── shared/types/                      # Shared TS enums & interfaces
```

---

## Data Flow

### Message Send (End-to-End)

```
1. User taps Send
2. Flutter: Optimistic UI update (message shows instantly)
3. Flutter → POST /chats/:id/messages → NestJS
4. NestJS: Validate JWT + Verify membership + Validate DTO
5. NestJS → INSERT message → PostgreSQL (state: SENT)
6. NestJS → Publish "chat.{id}.messages" → NATS JetStream
7. NATS → Go Gateway (JetStream durable consumer)
8. Go Gateway → WebSocket frame → Recipient's browser/app
9. NATS → AI Cognition (async, non-blocking)
10. AI → Generate embedding → Store in Qdrant
11. NATS → Notifications service → FCM push (if recipient offline)
12. NATS → Analytics service → Increment counters
```

### Offline Sync

```
1. User loses connectivity
2. Messages saved locally with state: QUEUED
3. Connectivity restored → SyncService flushes queue
4. Each message POSTed to API → state transitions to SENT
5. NATS JetStream replays missed messages (durable consumer)
```

---

## Demo Accounts

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **User** | `user@lumina.ai` | `Password123` | Chats, messages, profile, settings |
| **Admin** | `admin@lumina.ai` | `Admin@2024` | Everything + `/admin/*` analytics |

Created automatically by `npm run db:setup` (runs `prisma/seed.ts`).

---

## License

MIT

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/AkulRaghav">Akul Raghav</a>
</p>
