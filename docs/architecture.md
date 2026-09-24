<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](architecture.md)
[![Türkçe](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge)](architecture.tr.md)

</div>

# Corvus — Repository and System Architecture

This document specifies the current file organization, layered architecture, background services, and data flow of Corvus.

---

## 📁 Directory Structure

```
corvus/
├── docker-compose.yml
├── Dockerfile                    # Multi-stage: Frontend build + .NET 9 AOT build + minimal runtime
├── README.md                     # Project overview and quick start (English)
├── README.tr.md                  # Project overview and quick start (Türkçe)
├── LICENSE
│
├── src/
│   ├── Corvus.Api/                # Backend — ASP.NET Core Minimal API, .NET 9 Native AOT
│   │   ├── Program.cs             # Application entry point, DI, and Minimal API mapping
│   │   ├── Corvus.Api.csproj
│   │   ├── Endpoints/             # Resource-oriented Minimal API endpoints
│   │   │   ├── ServicesEndpoints.cs      # Service CRUD, /reorder, and unauthenticated /status-page
│   │   │   ├── ContainersEndpoints.cs    # Containers, /stats, /logs, /logs/stream, and lifecycle controls
│   │   │   ├── MetricsEndpoints.cs       # Host system metrics time-series
│   │   │   ├── UptimeEndpoints.cs        # Service uptime check history
│   │   │   ├── PushEndpoints.cs          # Push webhooks, /backup/download, and Dead Man's Snitch (/push-monitors)
│   │   │   ├── NotificationEndpoints.cs  # Multi-channel alert test endpoint
│   │   │   ├── StreamEndpoints.cs        # Live Server-Sent Events stream (/api/stream/events)
│   │   │   ├── DashboardEndpoints.cs     # Dashboard aggregated KPI summary, /api/settings, /api/settings/db-stats
│   │   │   └── AuthEndpoints.cs          # Session auth, registration toggle, and Zero-Trust SSO
│   │   ├── BackgroundServices/    # Continuous background worker threads
│   │   │   ├── ContainerDiscoveryService.cs  # Docker socket periodic container discovery (10s)
│   │   │   ├── SystemMetricsCollector.cs     # Host CPU/RAM/Disk/Net metrics sampler (15s)
│   │   │   ├── UptimeCheckerService.cs       # HTTP/TCP ping, SSL cert tracking, and Snitch checks (60s)
│   │   │   └── RetentionCleanupService.cs    # Dynamic retention data cleanup & PRAGMA optimize (24h)
│   │   ├── Data/                  # Persistence and data access layer (Dapper.AOT + SQLite)
│   │   │   ├── DbConnectionFactory.cs        # SQLite WAL, busy_timeout=5000, and PRAGMA tuning
│   │   │   ├── DatabaseMigrator.cs           # DbUp sequential migration runner
│   │   │   ├── ServicesRepository.cs         # Service definition and override queries
│   │   │   ├── PushMonitorRepository.cs      # Dead Man's Snitch data access
│   │   │   ├── UptimeRepository.cs           # Uptime history data access
│   │   │   ├── MetricsRepository.cs          # Host telemetry time-series storage
│   │   │   ├── BackupRepository.cs           # Push backup event logs
│   │   │   ├── UserRepository.cs             # User accounts and password hashing
│   │   │   ├── SettingsRepository.cs         # Key-value dynamic application settings
│   │   │   └── Migrations/                   # Ordered migration SQL scripts
│   │   │       ├── 001_init.sql
│   │   │       ├── 002_add_users.sql
│   │   │       ├── 003_roadmap_features.sql
│   │   │       └── 004_performance_indexes.sql
│   │   ├── Models/                 # DTOs and Database Entities
│   │   │   ├── Service.cs                    # Service entity (check_type, port, ssl, is_public, display_order)
│   │   │   ├── ServiceOverride.cs            # Docker label override model
│   │   │   ├── PushMonitor.cs                # Dead Man's Snitch entity
│   │   │   ├── DockerModels.cs               # Docker Engine API schemas
│   │   │   ├── SystemMetric.cs               # System hardware metrics sample
│   │   │   ├── UptimeCheck.cs                # Health check audit log
│   │   │   ├── BackupEvent.cs                # External push backup ping
│   │   │   ├── User.cs                       # User authentication entity
│   │   │   └── CorvusJsonSerializerContext.cs # .NET 9 Native AOT JsonSourceGeneration context
│   │   └── Services/                # Core domain business logic
│   │       ├── DockerHttpClient.cs           # SocketsHttpHandler direct socket client
│   │       ├── DockerService.cs              # Container operations, stats, and label parsing
│   │       ├── DockerLogDemuxer.cs           # Zero-alloc multiplexed Docker stdout/stderr demuxer
│   │       ├── NotificationService.cs        # Bilingual multi-channel alert dispatcher (Discord, Telegram, Ntfy, Webhook)
│   │       ├── EventBroadcaster.cs           # Bounded Channel SSE real-time event publisher
│   │       └── AuthService.cs                # Zero-Trust SSO proxy headers & SHA-256 session auth
│   │
│   └── Corvus.Web/                 # Frontend — TypeScript + React 19 + Vite + Tailwind CSS v4
│       ├── vite.config.ts          # Optimized Vite build with manual vendor chunks
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx             # React.lazy route code-splitting & SSE streaming listener
│       │   ├── i18n/               # Compile-time type-safe multi-language system
│       │   │   ├── en.ts           # Primary English dictionary
│       │   │   ├── tr.ts           # Turkish translation dictionary
│       │   │   ├── types.ts        # DeepStringify and schema types
│       │   │   └── index.tsx       # I18nProvider and useI18n hook
│       │   ├── pages/              # Application pages and status views
│       │   │   ├── Dashboard.tsx        # Aggregated KPI overview and live activity
│       │   │   ├── Services.tsx         # Service catalog launcher, reordering, and SSL badges
│       │   │   ├── Containers.tsx       # Live stats, Compose project accordion, lifecycle actions
│       │   │   ├── SystemMetrics.tsx    # Recharts hardware utilization charts
│       │   │   ├── Uptime.tsx           # Uptime history and Dead Man's Snitch tab
│       │   │   ├── Settings.tsx         # Tabbed alerts, dual backups, flexible retention, and DB telemetry
│       │   │   ├── AuthPage.tsx         # Sign in and initial registration view
│       │   │   └── PublicStatus.tsx     # Unauthenticated public status page (/status)
│       │   ├── components/         # Shared UI components
│       │   │   ├── Sidebar.tsx          # Responsive desktop rail and mobile/tablet slide-over drawer
│       │   │   ├── LanguageSwitch.tsx   # Compact & full interface language switcher
│       │   │   ├── ContainerLogsModal.tsx # Terminal modal for live container logs
│       │   │   ├── RegistrationPromptModal.tsx
│       │   │   └── StatusBadge.tsx
│       │   └── api/
│       │       └── client.ts            # Type-safe API client wrapper
│       └── wwwroot/                # Production compiled bundle output
│
├── tests/
│   └── Corvus.Api.Tests/           # xUnit Test Suite (60 Passing Tests)
│       ├── AuthServiceTests.cs
│       ├── DockerServiceTests.cs
│       ├── DockerLogDemuxerTests.cs
│       ├── NotificationServiceTests.cs
│       ├── RoadmapFeaturesTests.cs
│       └── DatabaseMigrationAndRepositoryTests.cs
│
└── docs/                           # Technical specifications and architectural guides
    ├── architecture.md             # System architecture (English)
    ├── architecture.tr.md          # Sistem mimarisi (Türkçe)
    ├── specification.md            # Technical specification (English)
    ├── specification.tr.md         # Teknik şartname (Türkçe)
    ├── scope.md                    # Project scope and boundaries (English)
    ├── scope.tr.md                 # Kapsam ve sınırlar (Türkçe)
    ├── design-system.md            # UI design tokens and system (English)
    └── design-system.tr.md         # Tasarım sistemi (Türkçe)
```

---

## ⚡ Core Architectural Principles

1. **Native AOT Compliance:** 
   - Runtime reflection is completely eliminated across the entire backend.
   - All JSON serialization leverages compile-time source generation via `CorvusJsonSerializerContext`.
   - Database operations use `Dapper.AOT` for compile-time verified parameter mapping.

2. **Ultra-Low Memory Footprint & High Performance:**
   - Docker daemon communication communicates directly over Unix domain sockets or Windows named pipes via `SocketsHttpHandler` without third-party wrapper overhead.
   - Live container log streaming is processed via zero-allocation header demultiplexing (`DockerLogDemuxer`).
   - SQLite operates in `WAL` mode with `PRAGMA busy_timeout = 5000` and `temp_store = MEMORY` to eliminate database concurrency lock contention.

3. **Frontend Optimization:**
   - Routes are loaded dynamically via `React.lazy`, keeping the initial entry chunk under 200 KB. Recharts, Lucide, and React runtime dependencies are split into dedicated vendor cache chunks.
