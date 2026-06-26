$ErrorActionPreference = "Continue"
Set-Location "D:\Lumina The AI-Native Context Communication Platform"

function Commit($message, $files) {
    foreach ($f in $files) {
        if (Test-Path $f) { git add $f 2>$null }
    }
    git commit --allow-empty -m $message 2>$null
}

# 1. Project foundation
git add .gitignore README.md setup.sh
git commit -m "chore: initialize project with gitignore and readme"

# 2. Infrastructure
git add infrastructure/docker-compose.yml
git commit -m "infra: add Docker Compose for local dev (Postgres, Redis, NATS)"

git add infrastructure/k8s/namespace.yml
git commit -m "infra(k8s): add production namespace definition"

git add infrastructure/k8s/api-deployment.yml
git commit -m "infra(k8s): add API deployment with rolling updates and probes"

git add infrastructure/k8s/gateway-deployment.yml
git commit -m "infra(k8s): add WebSocket gateway deployment (5 replicas)"

git add infrastructure/k8s/ingress.yml
git commit -m "infra(k8s): add Nginx ingress with TLS, HSTS, and WS support"

git add infrastructure/k8s/configmap.yml
git commit -m "infra(k8s): add shared ConfigMap for service discovery"

git add infrastructure/terraform/
git commit --allow-empty -m "infra(terraform): scaffold IaC directory for AWS EKS"

# 3. NestJS API - Core
git add services/api/package.json services/api/tsconfig.json
git commit -m "feat(api): initialize NestJS project with dependencies"

git add services/api/nest-cli.json
git commit -m "chore(api): add NestJS CLI configuration"

git add services/api/src/main.ts
git commit -m "feat(api): add app bootstrap with CORS, validation, and security headers"

git add services/api/src/app.module.ts
git commit -m "feat(api): configure root AppModule with all feature modules"

git add services/api/src/prisma.module.ts services/api/src/prisma.service.ts
git commit -m "feat(api): add Prisma module with lifecycle hooks"

git add services/api/prisma/schema.prisma
git commit -m "feat(api): add full Prisma schema (User, Chat, Message, Call, Reaction)"

git add services/api/prisma/seed.ts
git commit -m "feat(api): add database seed script with demo accounts"

# 4. Auth Module
git add services/api/src/auth/auth.module.ts
git commit -m "feat(auth): configure JWT module with HS256 pinning"

git add services/api/src/auth/jwt.strategy.ts
git commit -m "feat(auth): add passport JWT strategy with algorithm enforcement"

git add services/api/src/auth/dto/login.dto.ts
git commit -m "feat(auth): add LoginDTO with email validation"

git add services/api/src/auth/dto/register.dto.ts
git commit -m "feat(auth): add RegisterDTO with password strength rules"

git add services/api/src/auth/dto/refresh.dto.ts
git commit -m "feat(auth): add RefreshDTO for token rotation"

git add services/api/src/auth/auth.service.ts
git commit -m "feat(auth): implement auth service with bcrypt-12, lockout, and refresh tokens"

git add services/api/src/auth/auth.controller.ts
git commit -m "feat(auth): add auth controller (register, login, refresh)"

# 5. Chat Module
git add services/api/src/chat/dto/
git commit -m "feat(chat): add DTOs for message sending and chat creation"

git add services/api/src/chat/guards/chat-membership.guard.ts
git commit -m "security(chat): add ChatMembershipGuard to prevent IDOR"

git add services/api/src/chat/chat.service.ts
git commit -m "feat(chat): implement chat service with NATS publishing"

git add services/api/src/chat/chat.controller.ts
git commit -m "feat(chat): add chat controller with membership-protected endpoints"

# 6. Media Module
git add services/api/src/media/
git commit -m "feat(media): add S3 upload service with MIME type whitelist"

# 7. Admin Module
git add services/api/src/admin/guards/admin-role.guard.ts
git commit -m "security(admin): add role-based AdminGuard"

git add services/api/src/admin/admin.service.ts
git commit -m "feat(admin): add analytics service with aggregation queries"

git add services/api/src/admin/admin.controller.ts
git commit -m "feat(admin): add protected admin endpoints for metrics"

# 8. Common Libraries - Distributed Systems
git add services/api/src/common/rate-limiter/
git commit -m "feat(common): add sliding window rate limiter service"

git add services/api/src/common/circuit-breaker/
git commit -m "feat(common): implement circuit breaker pattern (CLOSED/OPEN/HALF_OPEN)"

git add services/api/src/common/event-store/
git commit -m "feat(common): add event store with optimistic concurrency control"

git add services/api/src/common/consistent-hash/
git commit -m "feat(common): implement consistent hash ring with virtual nodes"

git add services/api/src/common/bloom-filter/
git commit -m "feat(common): add Bloom filter (FNV-1a, optimal sizing)"

git add services/api/src/common/crdt/
git commit -m "feat(common): implement CRDT LWW-Register and LWW-Map"

git add services/api/src/common/vector-clock/
git commit -m "feat(common): add vector clock for causal ordering"

git add services/api/src/common/lru-cache/
git commit -m "feat(common): implement O(1) LRU cache with TTL support"

git add services/api/src/common/skip-list/
git commit -m "feat(common): add skip list with range queries (Redis ZSET internals)"

git add services/api/src/common/merkle-tree/
git commit -m "feat(common): implement Merkle tree with proof generation/verification"

git add services/api/src/common/dag-scheduler/
git commit -m "feat(common): add DAG task scheduler with topological sort"

git add services/api/src/common/cqrs/
git commit -m "feat(common): add CQRS commands and domain events"

git add services/api/src/common/saga/
git commit -m "feat(common): implement Saga pattern for distributed transactions"

# 9. Go WebSocket Gateway
git add services/gateway/go.mod
git commit -m "feat(gateway): initialize Go module with dependencies"

git add services/gateway/main.go
git commit -m "feat(gateway): implement production WebSocket gateway with JetStream, JWT auth, rate limiting, and membership checks"

git add services/gateway/internal/raft/
git commit -m "feat(gateway): add Raft consensus skeleton for leader election"

git add services/gateway/internal/backpressure/
git commit -m "feat(gateway): implement leaky bucket for traffic shaping"

git add services/gateway/internal/ratelimit/
git commit -m "feat(gateway): add token bucket rate limiter"

# 10. Python AI Cognition
git add services/ai-cognition/requirements.txt
git commit -m "feat(ai): add Python dependencies (FastAPI, OpenAI, Qdrant, NATS)"

git add services/ai-cognition/main.py
git commit -m "feat(ai): add FastAPI entrypoint with Qdrant vector search"

git add services/ai-cognition/app/__init__.py services/ai-cognition/app/models/
git commit -m "feat(ai): add Pydantic schemas for API requests"

git add services/ai-cognition/app/api/
git commit -m "feat(ai): add REST routes (summarize, search, smart-replies)"

git add services/ai-cognition/app/core/vector_db.py
git commit -m "feat(ai): implement Qdrant vector engine with HNSW indexing"

git add services/ai-cognition/app/services/ai_service.py
git commit -m "feat(ai): add AI service with RAG, summarization, and smart replies"

git add services/ai-cognition/app/core/bpe_tokenizer.py
git commit -m "feat(ai): implement BPE tokenizer from scratch"

git add services/ai-cognition/app/core/attention.py
git commit -m "feat(ai): implement multi-head self-attention (Transformer core)"

# 11. Presence Microservice
git add services/presence/package.json services/presence/Dockerfile
git commit -m "feat(presence): initialize presence microservice"

git add services/presence/src/main.ts
git commit -m "feat(presence): implement Redis-backed presence with typing indicators"

git add services/presence/go.mod
git commit -m "feat(presence): add Go gRPC presence service skeleton"

git add services/presence/main.go
git commit -m "feat(presence): implement presence server with heartbeat and cleanup"

git add services/presence/proto/
git commit -m "feat(presence): add gRPC protobuf definitions"

# 12. Notifications Microservice
git add services/notifications/
git commit -m "feat(notifications): add push notification service with FCM, dedup, and mute checking"

# 13. Media Processor Microservice
git add services/media-processor/
git commit -m "feat(media-processor): add media pipeline (thumbnails, transcode, moderation)"

# 14. Analytics Microservice
git add services/analytics/
git commit -m "feat(analytics): add real-time analytics with Prometheus metrics endpoint"

# 15. Flutter Client
git add clients/mobile/pubspec.yaml clients/mobile/analysis_options.yaml
git commit -m "feat(flutter): initialize Flutter project with dependencies"

git add clients/mobile/lib/main.dart
git commit -m "feat(flutter): add app entrypoint with Riverpod and GoRouter"

git add clients/mobile/lib/theme.dart
git commit -m "feat(flutter): implement Nexora design system (AppColors, AppTextStyles, AppSpacing)"

git add clients/mobile/lib/app_router.dart
git commit -m "feat(flutter): add GoRouter with auth state and route protection"

git add clients/mobile/lib/api.dart
git commit -m "feat(flutter): add API service layer with JWT header injection"

git add clients/mobile/lib/models/
git commit -m "feat(flutter): add data models (ChatPreview, ChatMessage)"

git add clients/mobile/lib/features/login/
git commit -m "feat(flutter): implement login page with quick-login cards (User/Admin)"

git add clients/mobile/lib/features/home/
git commit -m "feat(flutter): implement home page with chat list, filters, and bottom nav"

git add clients/mobile/lib/features/chat/
git commit -m "feat(flutter): implement chat detail with bubbles, voice messages, and attachment grid"

git add clients/mobile/lib/profile_screen.dart
git commit -m "feat(flutter): add profile screen with stats and navigation"

git add clients/mobile/lib/settings_screen.dart
git commit -m "feat(flutter): add settings screen with privacy, appearance, and storage controls"

git add clients/mobile/lib/ai_tools_screen.dart
git commit -m "feat(flutter): add AI tools screen with semantic search and tool cards"

git add clients/mobile/android/
git commit -m "feat(flutter): add Android platform config with cleartext traffic enabled"

# 16. CI/CD
git add .github/
git commit -m "ci: add GitHub Actions pipeline (test, build, deploy)"

# 17. Shared Types
git add shared/
git commit -m "feat(shared): add shared TypeScript types and NATS subject constants"

# 18. Design Docs
git add .kiro/
git commit -m "docs: add architectural design document and spec config"

# Final catch-all for any remaining files
git add -A
git commit --allow-empty -m "chore: final cleanup and project polish" 2>$null

Write-Output ""
Write-Output "=== All commits created ==="
git log --oneline | Measure-Object | Select-Object -ExpandProperty Count
Write-Output "commits total"
