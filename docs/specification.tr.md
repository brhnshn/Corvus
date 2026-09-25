<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](specification.md)
[![Türkçe](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge)](specification.tr.md)

</div>

# Corvus — Proje ve Mimari Dokümanı

## 1. Proje Tanımı

Corvus, self-hosted sunucular için açık kaynak, düşük kaynak tüketimli, tek panelden erişim + izleme aracıdır.

**Ne yapıyor:**
- **Launcher:** Sunucudaki servisleri (uygulamalar, veritabanları, yönetim araçları) tek panelden listeler, sürükle-bırak/ok tuşlarıyla sıralar ve erişim sağlar — canlı durum bilgisiyle birlikte.
- **Monitoring:** Sistem kaynakları (CPU/RAM/disk), konteyner canlı CPU/RAM/Net istatistikleri, container logları, uptime/endpoint sağlığı (HTTP/TCP/SSL), backup ve cron durumu tek yerde toplanır.
- **Boşluk doldurma:** Dağıtım araçları container yönetimini yaparken dış gözlemlenebilirlik (uptime, eşik tabanlı uyarı, launcher) sağlamaz — Corvus bu boşluğu kapatır.

**Servis keşfi — iki modlu:**
- **Otomatik:** Docker socket'ten çalışan container'ları algılar, Compose projelerine göre gruplar.
- **Manuel:** Docker dışı/uzak servisler veya TCP portları için kullanıcı elle ekleyebilir.

**Genel kullanım prensibi:** Açık kaynak bir araç olarak belirli bir reverse proxy, orkestrasyon aracı veya VPN'e bağımlı olmamalı — kullanıcı bunları tercihine göre kullanır ya da kullanmaz, Corvus hiçbirini şart koşmaz. Ters vekil arkasında Zero-Trust SSO başlıklarını (`Tailscale`, `Cloudflare Access`, `Remote-User`, `X-Forwarded-User`) otomatik tanır.

**Marka:** Corvus (Latince kuzgun) — "gözcü, yukarıdan izleyen" teması. Koyu tema, gümüş/platin accent, monochrome icon-only logo.

---

## 2. Teknoloji Seçimi

### Backend
- Dil: **C#**
- .NET sürümü: **.NET 9**
- Web framework: **ASP.NET Core Minimal API**
- Derleme modu: **Native AOT** (Zero Reflection)
- Docker erişimi: **Custom SocketsHttpHandler + System.Text.Json Source Generator** (Docker daemon REST API'sine Unix Socket ve Windows Named Pipe üzerinden doğrudan erişim)
- Hedef RAM: <30 MB (Canlı ölçümlerde ~14-18 MB)

### Frontend
- **TypeScript + React 19 + Vite**
- Stil: **Tailwind CSS v4**
- Grafikler: **Recharts**
- Çoklu Dil (i18n): **Derleme anında tip güvenli yerli React 19 Context** (`DeepStringify`), sıfır dış kütüphane ek yükü (~1.2 KB), varsayılan İngilizce (`en`) ve tam kapsamlı Türkçe (`tr`) desteği, dinamik dil seçici
- Kod Ayrıştırma (Code-Splitting): **React.lazy + Suspense** ve Vite `manualChunks` ile <200 KB ilk yükleme
- İletişim: REST + **Server-Sent Events (SSE)** üzerinden anlık durum yayını

### Veri katmanı
- **SQLite (Microsoft.Data.Sqlite) + Dapper (Dapper.AOT)**: WAL modu, `PRAGMA busy_timeout = 5000;`, `PRAGMA synchronous = NORMAL;`, `PRAGMA temp_store = MEMORY;`, `PRAGMA cache_size = -64000;` ve periyodik `PRAGMA optimize;`
- **DbUp**: SQL-first sıralı migration yönetimi (`001_init.sql`, `002_add_users.sql`, `003_roadmap_features.sql`, `004_performance_indexes.sql`)
- Zaman serisi tablolarında kompozit performans indeksleri (`system_metrics(recorded_at)`, `uptime_checks(service_id, checked_at)`)
- **Yedekleme ve Saklama Motoru**: Kilitlenmesiz SQLite anlık görüntü indirme (`VACUUM INTO`), gerçek zamanlı veritabanı disk boyutu telemetrisi (`GET /api/settings/db-stats`), Sınırsız mod destekli dinamik retention temizleyicisi

---

## 3. Veri Modeli (SQLite Şeması)

### `services`
Otomatik algılanan veya manuel eklenen tüm servisler (launcher + durum takibi için tek kaynak).

| Alan | Tip | Açıklama |
|---|---|---|
| id | TEXT (UUID) | Birincil anahtar |
| source | TEXT | `docker` veya `manual` |
| container_id | TEXT (nullable) | `source=docker` ise Docker container ID'si |
| name | TEXT | Görünen isim (label'dan, manuel girişten veya container adından) |
| description | TEXT (nullable) | Kısa açıklama |
| url | TEXT (nullable) | Launcher'da "Aç" butonunun gideceği adres |
| icon | TEXT (nullable) | İkon adı/URL |
| category | TEXT (nullable) | Gruplama için (Uygulamalar, Veritabanları, vb.) |
| health_check_url | TEXT (nullable) | Uptime kontrolü için ayrı endpoint (boşsa `url` kullanılır) |
| status | TEXT | `healthy` / `degraded` / `down` / `unknown` |
| check_type | TEXT | `http` veya `tcp` |
| port | INTEGER (nullable) | TCP port numarası |
| ssl_expiry_days | INTEGER (nullable) | Kalan SSL sertifika günü |
| ssl_issuer | TEXT (nullable) | Sertifikayı veren kurum |
| is_public | INTEGER | `1`: Halka açık durum sayfasında görünür, `0`: gizli |
| display_order | INTEGER | Özel sıralama sırası |
| created_at, updated_at | DATETIME | |

### `service_overrides`
Docker'dan otomatik algılanan bir container için kullanıcının panel üzerinden yaptığı düzenlemeler.

| Alan | Tip | Açıklama |
|---|---|---|
| container_id | TEXT | Birincil anahtar, `services.container_id` ile eşleşir |
| name, description, url, icon, category | TEXT (nullable) | Override edilen alanlar |

### `push_monitors` (Dead Man's Snitch)
Periyodik cron veya yedekleme scriptlerinin zamanında çalışıp çalışmadığını izleyen monitörler.

| Alan | Tip | Açıklama |
|---|---|---|
| id | TEXT (UUID) | Birincil anahtar |
| token | TEXT (UNIQUE) | Push URL'sinde kullanılan rastgele anahtar |
| name | TEXT | Monitör adı |
| expected_interval_minutes | INTEGER | Beklenen çalışma periyodu (varsayılan: 1440 dk = 24 saat) |
| grace_period_minutes | INTEGER | Tolerans süresi (varsayılan: 60 dk) |
| last_seen_at | TEXT (nullable) | Son başarılı sinyal zamanı |
| status | TEXT | `healthy` / `down` / `unknown` |
| created_at | DATETIME | |

### `system_metrics`
Host düzeyinde periyodik ölçümler (zaman serisi).

| Alan | Tip | Açıklama |
|---|---|---|
| id | INTEGER (autoincrement) | |
| recorded_at | DATETIME | |
| cpu_percent | REAL | |
| ram_used_mb, ram_total_mb | INTEGER | |
| disk_used_gb, disk_total_gb | INTEGER | |
| network_rx_bytes, network_tx_bytes | INTEGER | |

### `uptime_checks`
Her endpoint kontrolünün sonucu (zaman serisi).

| Alan | Tip | Açıklama |
|---|---|---|
| id | INTEGER (autoincrement) | |
| service_id | TEXT | `services.id` referansı |
| checked_at | DATETIME | |
| status | TEXT | `up` / `down` |
| response_time_ms | INTEGER (nullable) | Yanıt süresi |
| error_message | TEXT (nullable) | |

### `backup_events`
Push monitor üzerinden gelen son yedekleme sinyalleri.

| Alan | Tip | Açıklama |
|---|---|---|
| id | INTEGER (autoincrement) | |
| token | TEXT | Bildiren job anahtarı |
| received_at | DATETIME | |
| status | TEXT | `success` / `failure` |
| size_bytes | INTEGER (nullable) | |
| message | TEXT (nullable) | |

### `users` ve `settings`
- `users`: `id`, `username`, `password_hash` (SHA-256), `role`, `created_at`
- `settings`: `key`, `value`, `updated_at` (bildirim ayarları, kayıt açık/kapalı)

---

## 4. API Endpoint'leri (Minimal API)

| Method & Path | Açıklama |
|---|---|
| `GET /api/dashboard/summary` | Servis sayıları, konteyner durumu, metrik ve backup özetini döner |
| `GET /api/services` | Servis listesi (sıralı, override ve SSL bilgileriyle) |
| `POST /api/services` | Yeni manuel servis ekler (HTTP veya TCP kontrolü) |
| `PUT /api/services/{id}` | Servisi günceller veya Docker servisi için override yazar |
| `PUT /api/services/reorder` | Servislerin görsel sıralamasını kaydeder |
| `DELETE /api/services/{id}` | Manuel servisi siler veya Docker override'ını kaldırır |
| `GET /api/status-page` | **Şifresiz:** Halka açık durum sayfası için servis özetlerini döner |
| `GET /api/containers` | Docker container listesi (durum, portlar, etiketler) |
| `GET /api/containers/{id}/stats` | Anlık konteyner CPU%, bellek kullanımı ve ağ I/O istatistikleri |
| `GET /api/containers/{id}/logs` | Son 100 konteyner log satırını döner |
| `GET /api/containers/{id}/logs/stream` | **SSE:** Gerçek zamanlı canlı konteyner log akışı |
| `POST /api/containers/{id}/start` | Konteyneri başlatır |
| `POST /api/containers/{id}/stop` | Konteyneri durdurur |
| `POST /api/containers/{id}/pause` | Konteyneri duraklatır |
| `POST /api/containers/{id}/unpause` | Konteyneri devam ettirir |
| `POST /api/containers/{id}/restart` | Konteyneri yeniden başlatır |
| `GET /api/push-monitors` | Dead Man's Snitch monitörlerini listeler |
| `POST /api/push-monitors` | Yeni beklenen periyotlu push monitörü oluşturur |
| `PUT /api/push-monitors/{id}` | Push monitörünü günceller |
| `DELETE /api/push-monitors/{id}` | Push monitörünü siler |
| `POST /api/push/{token}` | Cron veya yedekleme sinyalini alır, snitch durumunu günceller |
| `GET /api/metrics/system` | Sistem kaynakları zaman serisi (`?range=1h\|24h\|7d`) |
| `GET /api/uptime` | Servis uptime geçmişi (`?service_id=...&range=7d`) |
| `POST /api/notifications/test` | Alarm kanallarını (Discord, Telegram, Ntfy, Webhook) test eder |
| `GET /api/stream/events` | **SSE:** Servis durumu ve sistem olaylarının anlık yayını |
| `GET /api/auth/status` | Oturum durumu ve Zero-Trust SSO başlık denetimi |
| `POST /api/auth/login` | Giriş yapar ve oturum çerezi üretir |
| `POST /api/auth/logout` | Oturumu sonlandırır |

---

## 5. Arka Plan Servisleri (Background Services)

| Servis | Periyot | İş |
|---|---|---|
| `ContainerDiscoveryService` | 10 sn | Docker socket'ten container listesini senkronize eder |
| `SystemMetricsCollector` | 15 sn | Host CPU/RAM/disk/network ölçer, `system_metrics` tablosuna yazar |
| `UptimeCheckerService` | 60 sn | HTTP yanıtlarını, TCP soket bağlantılarını ve SSL sertifika geçerlilik günlerini denetler; Dead Man's Snitch periyot aşımında DOWN uyarısı üretir; durum değişiminde Discord/Telegram/Ntfy alarmlarını tetikler ve SSE ile yayınlar |
| `RetentionCleanupService` | Günde 1 kez | `retention_days` ayarını dinamik okur; > 0 ise `system_metrics` ve `uptime_checks` eski kayıtlarını temizler, 0 (Sınırsız) ise silmeyi atlar ve `PRAGMA optimize;` çalıştırır |

---

## 6. Kimlik Doğrulama ve Zero-Trust SSO

1. **Zero-Trust SSO / Reverse Proxy Desteği:**
   - Ters vekil sunucudan (Tailscale, Cloudflare Access, Authelia, Traefik) gelen `Tailscale-User-Login`, `Cf-Access-Authenticated-User-Email`, `Remote-User` veya `X-Forwarded-User` başlıkları otomatik algılanır; şifresiz oturum açılır.
2. **Kullanıcı Adı / Şifre Girişi:**
   - SHA-256 hash'li yerleşik kimlik doğrulama ve oturum çerezi (`corvus_session`).
   - İlk kullanıcı oluşturulduktan sonra arayüzden yeni kayıtlar kapatılabilir.
3. **Opsiyonel Kapatma:**
   - `CORVUS_AUTH_ENABLED=false` ile tamamen kimlik doğrulamasız çalıştırılabilir.

---

## 7. Sayfalar ve Kullanıcı Arayüzü

| Sayfa | URL | Özellikler |
|---|---|---|
| **Dashboard** | `/` | Sağlıklı/arızalı servis sayıları, container durumu, canlı metrik grafikleri ve anlık güncellenen son yedekleme |
| **Servisler** | `/` | Servis kartları, durum rozetleri, TCP port göstergeleri, SSL kalan gün rozeti, yukarı/aşağı sıralama butonları |
| **Container'lar** | `/` | Canlı CPU%, RAM ve Net I/O rozetleri, Start/Stop/Pause/Restart aksiyonları, Compose Stack akordeon gruplaması, canlı log terminali |
| **Sistem Metrikleri**| `/` | 1h, 6h, 12h, 24h, 7d aralıklarında CPU, RAM, Disk ve Ağ I/O grafikleri |
| **Uptime & Snitch** | `/` | HTTP/TCP yanıt süreleri geçmişi ve Dead Man's Snitch periyodik cron/yedekleme izleme sekmesi |
| **Ayarlar** | `/` | Sekmeli alarm yapılandırması (Discord, Telegram, Ntfy, Webhook), test bildirimleri, çift yönlü yedekleme (dahili `VACUUM INTO` indirme + harici curl entegrasyonu), esnek veri saklama (7-365 gün, Sınırsız mod, risk uyarısı) ve anlık veritabanı boyutu |
| **Canlı Durum** | `/status` | **Şifresiz:** Tüm sistemler operasyonel banner'ı, servis uptime oranları, SSL günleri |

---

## 8. Tamamlanan Yol Haritası Adımları

- [x] Native AOT + Docker.DotNet doğrulama ve custom SocketsHttpHandler istemcisi
- [x] Dapper + Dapper.AOT + Microsoft.Data.Sqlite + DbUp veri katmanı (001-004)
- [x] Docker socket multiplexed log demuxer ve canlı log akışı
- [x] Çok kanallı alarm motoru (Discord, Telegram, Ntfy, Webhook) ve dil senkronizasyonu
- [x] Konteyner başına canlı kaynak kullanımı (Docker Stats: CPU, RAM, Net I/O)
- [x] Genişletilmiş Uptime: TCP Port Ping & SSL Sertifika bitiş günü takibi
- [x] Dead Man's Snitch: Beklenen periyotlu push monitörü ve otomatik gecikme alarmları
- [x] Halka Açık / Şifresiz Durum Sayfası (`/status` ve `/api/status-page`)
- [x] Server-Sent Events (SSE) Canlı Veri Yayını (`/api/stream/events`)
- [x] Docker Compose Stack Hiyerarşisi ve Gruplama (`com.docker.compose.project`)
- [x] Zero-Trust SSO / Reverse Proxy Auth başlıkları desteği
- [x] Servis görsel sıralama düzeni (`display_order` ve `/api/services/reorder`)
- [x] Frontend Code-Splitting ve Recharts paket optimizasyonu (<200 KB chunking)
- [x] SQLite WAL, kompozit indeksler ve yüksek performans PRAGMA optimizasyonları
- [x] Mobil ve tablet uyumlu slide-over drawer ve responsive çift modlu tablolar
- [x] Derleme anında tip korumalı çift dilli i18n sistemi (İngilizce varsayılan, Türkçe tam destek)
- [x] Çift yönlü yedekleme yönetimi: Tek tıkla kilitlenmesiz SQLite anlık yedek indirme (`GET /api/backup/download`), SSE canlı Dashboard güncellemesi ve harici push entegrasyonu
- [x] Esnek veri saklama süresi ve disk telemetrisi: Hazır periyotlar, Sınırsız mod, risk uyarısı, canlı DB boyutu ve dinamik `RetentionCleanupService`
- [x] 64/64 xUnit birim ve entegrasyon testi doğrulaması
