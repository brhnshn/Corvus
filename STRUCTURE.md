# Corvus — Klasör Mimarisi

> **Not:** Bu dosya PROJECT.md, design.md, SCOPE.md, RESEARCH.md ve AGENT_PROMPT.md'den **sonra** eklendi. Daha önce bu dosyaları okumuş olsan bile bu dosyayı da mutlaka oku — proje iskeletini kurarken kendi klasör düzenini icat etme, burada tanımlanan yapıyı birebir uygula.

```
corvus/
├── docker-compose.yml
├── Dockerfile                    # multi-stage: frontend build + .NET AOT build + runtime
├── README.md
├── LICENSE
│
├── src/
│   ├── Corvus.Api/                # Backend — ASP.NET Core Minimal API, Native AOT
│   │   ├── Program.cs             # uygulama girişi, endpoint kayıtları (app.MapGet vb.)
│   │   ├── Corvus.Api.csproj
│   │   ├── Endpoints/             # her kaynak için endpoint gruplama dosyaları
│   │   │   ├── ServicesEndpoints.cs
│   │   │   ├── ContainersEndpoints.cs
│   │   │   ├── MetricsEndpoints.cs
│   │   │   ├── UptimeEndpoints.cs
│   │   │   ├── PushEndpoints.cs
│   │   │   └── AuthEndpoints.cs
│   │   ├── BackgroundServices/    # PROJECT.md §5'teki dört servis
│   │   │   ├── ContainerDiscoveryService.cs
│   │   │   ├── SystemMetricsCollector.cs
│   │   │   ├── UptimeCheckerService.cs
│   │   │   └── RetentionCleanupService.cs
│   │   ├── Data/                  # veri erişim katmanı
│   │   │   ├── CorvusDbContext.cs (veya Dapper kullanılırsa bağlantı/sorgu sınıfları)
│   │   │   └── Migrations/
│   │   ├── Models/                 # PROJECT.md §3'teki tablo karşılığı sınıflar
│   │   │   ├── Service.cs
│   │   │   ├── ServiceOverride.cs
│   │   │   ├── SystemMetric.cs
│   │   │   ├── UptimeCheck.cs
│   │   │   └── BackupEvent.cs
│   │   └── Services/                # iş mantığı (Docker.DotNet sarmalayıcı, auth servisi vb.)
│   │       ├── DockerService.cs
│   │       └── AuthService.cs
│   │
│   └── Corvus.Web/                 # Frontend — TypeScript + React + Vite
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts     # design.md renk paletiyle
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── pages/               # PROJECT.md §10'daki sayfalar
│           │   ├── Dashboard.tsx
│           │   ├── Services.tsx
│           │   ├── SystemMetrics.tsx
│           │   ├── Containers.tsx
│           │   ├── Uptime.tsx
│           │   └── Settings.tsx
│           ├── components/          # ortak bileşenler (Sidebar, Card, StatusDot, TabPill vb.)
│           ├── api/                 # backend API çağrıları (fetch sarmalayıcıları)
│           └── styles/
│
├── tests/
│   ├── Corvus.Api.Tests/           # backend birim/entegrasyon testleri
│   └── Corvus.Web.Tests/           # frontend testleri (opsiyonel, v1'de şart değil)
│
├── docs/                            # PROJECT.md, design.md, SCOPE.md, RESEARCH.md buraya taşınabilir
│
└── .github/
    ├── workflows/                   # GITHUB_SETUP.md'de detaylandırılan CI/CD dosyaları
    └── ISSUE_TEMPLATE/
```

## Notlar

- `Corvus.Api` ve `Corvus.Web` ayrı projeler ama tek Dockerfile'da birleştiriliyor — build sırasında `Corvus.Web`'in `dist/` çıktısı `Corvus.Api`'nin `wwwroot/` klasörüne kopyalanır, tek binary + statik dosyalar olarak servis edilir (PROJECT.md §8)
- Doğrulama prototipi (AGENT_PROMPT.md'de bahsedilen ilk adım) bu yapının dışında, geçici bir `prototype/` klasöründe veya ayrı bir scratch projede yapılabilir — asıl yapıya dahil edilmez, sadece sonucu raporlanır
