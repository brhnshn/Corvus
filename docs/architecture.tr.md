<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](architecture.md)
[![Türkçe](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge)](architecture.tr.md)

</div>

# Corvus — Klasör ve Sistem Mimarisi

Bu doküman, Corvus'un güncel dosya ve katman mimarisini, servislerini ve veri akışını belgeler.

---

## 📁 Dizin Yapısı

```
corvus/
├── docker-compose.yml
├── Dockerfile                    # Multi-stage: Frontend build + .NET 9 AOT build + minimal runtime
├── README.md
├── README.tr.md
├── LICENSE
│
├── src/
│   ├── Corvus.Api/                # Backend — ASP.NET Core Minimal API, .NET 9 Native AOT
│   │   ├── Program.cs             # Uygulama girişi, DI ve Minimal API eşlemeleri
│   │   ├── Corvus.Api.csproj
│   │   ├── Endpoints/             # Kaynak bazlı Minimal API uç noktaları
│   │   │   ├── ServicesEndpoints.cs      # Servis CRUD, /reorder ve şifresiz /status-page
│   │   │   ├── ContainersEndpoints.cs    # Containers, /stats, /logs, /logs/stream ve lifecycle kontrolleri
│   │   │   ├── MetricsEndpoints.cs       # Sistem metrikleri zaman serisi
│   │   │   ├── UptimeEndpoints.cs        # Servis uptime geçmişi
│   │   │   ├── PushEndpoints.cs          # Push webhooks ve Dead Man's Snitch (/push-monitors)
│   │   │   ├── NotificationEndpoints.cs  # Çok kanallı alarm test uç noktası
│   │   │   ├── StreamEndpoints.cs        # Canlı SSE olay akışı (/api/stream/events)
│   │   │   ├── DashboardEndpoints.cs     # Dashboard KPI özeti
│   │   │   └── AuthEndpoints.cs          # Session auth, kayıt yönetimi ve Zero-Trust SSO
│   │   ├── BackgroundServices/    # Arka plan çalışan iş parçacıkları
│   │   │   ├── ContainerDiscoveryService.cs  # Docker socket periyodik konteyner senkronizasyonu
│   │   │   ├── SystemMetricsCollector.cs     # Host CPU/RAM/Disk/Net metrik toplayıcısı
│   │   │   ├── UptimeCheckerService.cs       # HTTP/TCP ping, SSL sertifika ve Snitch denetimi
│   │   │   └── RetentionCleanupService.cs    # Zaman aşımına uğrayan kayıtları temizleme (24h)
│   │   ├── Data/                  # Veri erişim katmanı (Dapper.AOT + SQLite)
│   │   │   ├── DbConnectionFactory.cs        # SQLite WAL, busy_timeout=5000 ve PRAGMA optimizasyonları
│   │   │   ├── DatabaseMigrator.cs           # DbUp göç yöneticisi
│   │   │   ├── ServicesRepository.cs         # Servis ve override sorguları
│   │   │   ├── PushMonitorRepository.cs      # Dead Man's Snitch veri erişimi
│   │   │   ├── UptimeRepository.cs           # Uptime geçmişi
│   │   │   ├── MetricsRepository.cs          # Host metrikleri
│   │   │   ├── BackupRepository.cs           # Push backup logları
│   │   │   ├── UserRepository.cs             # Kullanıcı hesapları
│   │   │   ├── SettingsRepository.cs         # Key-value ayarlar
│   │   │   └── Migrations/                   # Sıralı göç SQL dosyaları
│   │   │       ├── 001_init.sql
│   │   │       ├── 002_add_users.sql
│   │   │       └── 003_roadmap_features.sql
│   │   ├── Models/                 # DTO'lar ve Veritabanı Varlıkları
│   │   │   ├── Service.cs                    # Servis modeli (check_type, port, ssl, is_public, display_order)
│   │   │   ├── ServiceOverride.cs            # Docker override modeli
│   │   │   ├── PushMonitor.cs                # Dead Man's Snitch modeli
│   │   │   ├── DockerModels.cs               # Docker API modelleri
│   │   │   ├── SystemMetric.cs               # Host metrik modeli
│   │   │   ├── UptimeCheck.cs                # Uptime kayıt modeli
│   │   │   ├── BackupEvent.cs                # Backup push modeli
│   │   │   ├── User.cs                       # Kullanıcı modeli
│   │   │   └── CorvusJsonSerializerContext.cs # .NET 9 Native AOT JsonSourceGeneration context
│   │   └── Services/                # İş mantığı servisleri
│   │       ├── DockerHttpClient.cs           # SocketsHttpHandler ile Docker REST istemcisi
│   │       ├── DockerService.cs              # Konteyner işlemleri ve etiket eşleme
│   │       ├── DockerLogDemuxer.cs           # Multiplexed Docker log akış ayrıştırıcısı
│   │       ├── NotificationService.cs        # Discord, Telegram, Ntfy ve Webhook alarm motoru
│   │       ├── EventBroadcaster.cs           # Bounded Channel SSE olay yayıncısı
│   │       └── AuthService.cs                # Zero-Trust SSO proxy headers & SHA-256 session auth
│   │
│   └── Corvus.Web/                 # Frontend — TypeScript + React 19 + Vite + Tailwind CSS v4
│       ├── vite.config.ts          # manualChunks ile optimize edilmiş Vite yapılandırması
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx             # React.lazy rota kod ayrıştırma (code-splitting) & SSE bağlantısı
│       │   ├── pages/              # Uygulama ve Durum Sayfaları
│       │   │   ├── Dashboard.tsx        # KPI özeti ve anlık durum
│       │   │   ├── Services.tsx         # Servis launcher, sıralama ve SSL rozetleri
│       │   │   ├── Containers.tsx       # Canlı stats, Compose stack gruplama, yaşam döngüsü
│       │   │   ├── SystemMetrics.tsx    # Recharts host zaman serisi
│       │   │   ├── Uptime.tsx           # Uptime grafikleri ve Dead Man's Snitch sekmesi
│       │   │   ├── Settings.tsx         # Çok kanallı alarm ayarları ve kullanıcı tercihleri
│       │   │   ├── AuthPage.tsx         # Giriş ve kayıt ekranı
│       │   │   └── PublicStatus.tsx     # Şifresiz halka açık durum sayfası (/status)
│       │   ├── components/         # Ortak bileşenler
│       │   │   ├── Sidebar.tsx          # Masaüstü kalıcı, mobil/tablet slide-over drawer
│       │   │   ├── ContainerLogsModal.tsx # Canlı log terminal modalı
│       │   │   ├── RegistrationPromptModal.tsx
│       │   │   └── StatusBadge.tsx
│       │   └── api/
│       │       └── client.ts            # Tip güvenli fetch istemcisi
│       └── wwwroot/                # Derlenmiş statik dosyaların çıktığı yer
│
├── tests/
│   └── Corvus.Api.Tests/           # xUnit Test Projesi (34 Test)
│       ├── AuthServiceTests.cs
│       ├── DockerServiceTests.cs
│       ├── DockerLogDemuxerTests.cs
│       ├── NotificationServiceTests.cs
│       ├── RoadmapFeaturesTests.cs
│       └── DatabaseMigrationAndRepositoryTests.cs
│
└── docs/                           # Proje teknik şartname, analiz ve tasarım dokümanları
    ├── architecture.md             # Sistem mimarisi (English)
    ├── architecture.tr.md          # Sistem mimarisi (Türkçe)
    ├── specification.md            # Teknik şartname (English)
    ├── specification.tr.md         # Teknik şartname (Türkçe)
    ├── scope.md                    # Kapsam ve sınırlar (English)
    ├── scope.tr.md                 # Kapsam ve sınırlar (Türkçe)
    ├── design-system.md            # Tasarım sistemi (English)
    └── design-system.tr.md         # Tasarım sistemi (Türkçe)
```

---

## ⚡ Temel Mimari Prensipler

1. **Native AOT Uyumluluğu:** 
   - Backend genelinde çalışma zamanı yansıması (reflection) kesinlikle kullanılmaz.
   - Tüm JSON serileştirme işlemleri `CorvusJsonSerializerContext` üzerinden kaynak üretimiyle (source generation) yapılır.
   - Veritabanı sorguları `Dapper.AOT` ile derleme zamanında tip denetiminden geçer.

2. **Düşük Bellek ve Yüksek Başarım:**
   - Docker daemon iletişimi harici kütüphane bağımlılığı olmaksızın doğrudan soket seviyesinde `SocketsHttpHandler` ile yürütülür.
   - Konteyner log akışları `DockerLogDemuxer` ile sıfır bellek ayırmalı (zero allocation) olarak ayrıştırılır.
   - SQLite veritabanı `WAL` kipinde `PRAGMA busy_timeout = 5000` ve `temp_store = MEMORY` ile eşzamanlı kilitlenme yaşamaksızın yüksek başarım sağlar.

3. **Frontend Optimizasyonu:**
   - Rotalar `React.lazy` ile parçalara ayrılarak ilk yükleme paketi 200 KB'ın altında tutulur; Recharts, Lucide ve React vendor chunk'ları ayrıştırılmıştır.
