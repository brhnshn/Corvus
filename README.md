<p align="center">
  <img src=".github/assets/logo.png" width="120" alt="Corvus Logo" />
</p>

<h1 align="center">Corvus</h1>

<p align="center">
  <strong>Lightweight, Native AOT Server Launcher & Monitoring Dashboard for Self-Hosted Nodes</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/.NET-9.0_Native_AOT-512BD4?logo=dotnet" alt=".NET 9" />
  <img src="https://img.shields.io/badge/RAM_Usage-%3C30_MB-success" alt="RAM <30MB" />
  <img src="https://img.shields.io/badge/Frontend-React_+_Vite_+_Tailwind-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Database-SQLite_+_Dapper.AOT-003B57?logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
</p>

---

## 🌟 Overview

**Corvus** is an ultra-lightweight, self-hosted server launcher and observability dashboard designed for homelabs, VPS instances, and self-hosted environments. Compiled ahead-of-time (Native AOT) with zero dynamic reflection, it runs within a **<30 MB RAM footprint** while providing real-time container discovery, service health monitoring, time-series resource tracking, and push-based backup status.

## ✨ Key Features

- **🚀 Dual-Mode Service Launcher:**
  - **Automatic Discovery:** Automatically detects running Docker containers via direct Docker socket communication (`/var/run/docker.sock`), extracting Glance-style metadata (`corvus.name`, `corvus.category`, `corvus.url`, etc.).
  - **Manual Services:** Add external URLs, SaaS tools, bare-metal endpoints, and IoT devices.
- **📊 Host Resource Monitoring:**
  - Background collection of host CPU%, RAM usage, Disk capacity, and Network I/O.
  - Interactive charts powered by Recharts (1h, 6h, 12h, 24h, 7d ranges).
- **⏱️ Endpoint Uptime & Health:**
  - Periodic background health checks for configured HTTP/HTTPS endpoints.
  - Latency tracking and status history.
- **💾 Push Monitor for Backups:**
  - Dead-simple webhook endpoint (`POST /api/push/{token}`) to receive heartbeat/status updates from cron jobs, backup scripts (`borg`, `restic`), or CI pipelines.
- **🔒 Zero-Dependency Architecture:**
  - Single standalone binary or tiny container.
  - Embedded SQLite database (`Microsoft.Data.Sqlite` + `Dapper.AOT`).
  - Automatic migration execution via `DbUp`.
  - Frontend SPA served directly from the embedded `wwwroot`.

---

## 🏗️ Architecture

```
Corvus Architecture:
┌────────────────────────────────────────────────────────┐
│               Corvus Web Dashboard                    │
│   (React + TypeScript + Tailwind CSS + Recharts)      │
└───────────────────────────┬────────────────────────────┘
                            │ REST API + Polling
┌───────────────────────────▼────────────────────────────┐
│               Corvus Core Engine                       │
│       ASP.NET Core Minimal API (.NET 9 Native AOT)     │
├───────────────────────────┬────────────────────────────┤
│  Docker REST API Client   │  SQLite + Dapper.AOT       │
│  (SocketsHttpHandler)     │  (DbUp Migrations)         │
├───────────────────────────┴────────────────────────────┤
│  Background Services:                                  │
│  - ContainerDiscoveryService (10s)                     │
│  - SystemMetricsCollector (15s)                        │
│  - UptimeCheckerService (60s)                          │
│  - RetentionCleanupService (24h)                       │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start with Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  corvus:
    image: corvus:latest
    container_name: corvus
    restart: unless-stopped
    ports:
      - "8090:8090"
    environment:
      - CORVUS_PORT=8090
      - CORVUS_DATA_DIR=/data
      - DOCKER_SOCKET=/var/run/docker.sock
      - CORVUS_AUTH_ENABLED=false
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - corvus-data:/data

volumes:
  corvus-data:
```

Run the container:

```bash
docker compose up -d
```

Open your browser at **`http://localhost:8090`**.

---

## 🏷️ Docker Container Labels

Enhance your containers with Corvus metadata labels in your compose files:

```yaml
labels:
  - "corvus.name=Nextcloud Hub"
  - "corvus.category=Cloud Storage"
  - "corvus.description=Personal file sync and share"
  - "corvus.url=https://cloud.example.com"
  - "corvus.healthcheck=https://cloud.example.com/status.php"
  - "corvus.icon=cloud"
```

---

## 🛠️ Development & Building from Source

### Prerequisites
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/)

### Building the Project
1. **Frontend:**
   ```bash
   cd src/Corvus.Web
   npm install
   npm run build
   ```
2. **Backend:**
   ```bash
   cd ../Corvus.Api
   dotnet run
   ```
3. **Running Tests:**
   ```bash
   dotnet test tests/Corvus.Api.Tests
   ```

---

## 📚 Architecture & Documentation

In-depth technical architecture, research notes, and design guidelines are available in the [`docs/`](docs/) directory:

- [System Architecture](docs/architecture.md) — Service flow, component relationships, and directory layout.
- [Technical Specification](docs/specification.md) — Data schemas, background workers, and API contracts.
- [Design System & UI Guidelines](docs/design-system.md) — UI theme tokens, palette, and layouts.
- [Technology Research](docs/research.md) — Evaluation of Native AOT, Docker socket APIs, and SQLite WAL engine.
- [Project Scope & Boundaries](docs/scope.md) — Core responsibilities and integration guidelines.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
