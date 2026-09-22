# Corvus — Proje ve Mimari Dokümanı

## 1. Proje Tanımı

Corvus, self-hosted sunucular için açık kaynak, düşük kaynak tüketimli, tek panelden erişim + izleme aracıdır.

**Ne yapıyor:**
- **Launcher:** Sunucudaki servisleri (uygulamalar, veritabanları, yönetim araçları) tek panelden listeler ve erişim sağlar — canlı durum bilgisiyle birlikte
- **Monitoring:** Sistem kaynakları (CPU/RAM/disk), container durumu, uptime/endpoint sağlığı, backup durumu tek yerde toplanır
- **Boşluk doldurma:** Coolify gibi araçlar deploy/container yönetimini yapıyor ama dış gözlemlenebilirlik (uptime, eşik tabanlı uyarı, launcher) sağlamıyor — Corvus bu boşluğu kapatıyor

**Servis keşfi — iki modlu:**
- **Otomatik:** Docker socket'ten çalışan container'ları algılar
- **Manuel:** Docker dışı/uzak servisler için kullanıcı elle ekleyebilir

**Genel kullanım prensibi:** Açık kaynak bir araç olarak belirli bir reverse proxy, orkestrasyon aracı veya VPN'e bağımlı olmamalı — kullanıcı bunları tercihine göre kullanır ya da kullanmaz, Corvus hiçbirini şart koşmaz.

**Marka:** Corvus (Latince kuzgun) — "gözcü, yukarıdan izleyen" teması. Koyu tema, gümüş/platin accent, monochrome icon-only logo. (Detaylar: design.md, SCOPE.md)

---

## 2. Teknoloji Seçimi

### Backend
- Dil: **C#**
- .NET sürümü: **.NET 9**
- Web framework: **ASP.NET Core Minimal API**
- Derleme modu: **Native AOT**
- Docker erişimi: **Custom SocketsHttpHandler + System.Text.Json Source Generator** (Docker daemon REST API'sine Unix Socket ve Windows Named Pipe üzerinden doğrudan erişim; Docker.DotNet reflection kısıtları nedeniyle elendi)
- Hedef RAM: <30 MB

### Frontend
- **TypeScript + React + Vite**
- Stil: **Tailwind CSS**
- Grafikler: **Recharts**
- Build çıktısı (`dist/`) backend tarafından statik dosya olarak servis edilir — tek Docker image, ayrı port yok
- API iletişimi: REST + polling (WebSocket/SignalR yok)

### Veri katmanı
- **SQLite (Microsoft.Data.Sqlite) + Dapper (Dapper.AOT)** (tek dosya, ekstra servis/daemon gerektirmez, Native AOT ile tam uyumlu ve düşük bellek tüketimi)
- **DbUp**: SQL-first sıralı migration yönetimi (`src/Corvus.Api/Data/Migrations/*.sql`)

### Dağıtım
- Docker image (Native AOT binary içeren, minimal base image)
- Tek binary olarak da doğrudan çalıştırılabilir (Docker dışı senaryolar için)

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
| status | TEXT | `healthy` / `degraded` / `down` / `unknown` — arka plan servisi tarafından güncellenir |
| created_at, updated_at | DATETIME | |

### `service_overrides`
Glance modelindeki gibi: Docker'dan otomatik algılanan bir container için kullanıcının panel üzerinden yaptığı manuel düzenlemeler (label yoksa ya da label'ı ezmek istiyorsa).

| Alan | Tip | Açıklama |
|---|---|---|
| container_id | TEXT | Birincil anahtar, `services.container_id` ile eşleşir |
| name, description, url, icon, category | TEXT (nullable) | Override edilen alanlar — doluysa label/varsayılanın önüne geçer |

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

*Eski kayıtlar belirli bir süre (örn. 30 gün) sonra otomatik temizlenir (retention job) — SQLite dosyasının şişmesini önlemek için.*

### `uptime_checks`
Her endpoint kontrolünün sonucu (zaman serisi).

| Alan | Tip | Açıklama |
|---|---|---|
| id | INTEGER (autoincrement) | |
| service_id | TEXT | `services.id` referansı |
| checked_at | DATETIME | |
| status | TEXT | `up` / `down` |
| response_time_ms | INTEGER (nullable) | |
| error_message | TEXT (nullable) | |

### `backup_events`
Uptime Kuma'nın "push monitor" mantığına dayanan, harici script'lerin bildirdiği olaylar (RESEARCH.md §7).

| Alan | Tip | Açıklama |
|---|---|---|
| id | INTEGER (autoincrement) | |
| token | TEXT | Hangi backup job'ı bildirdiğini ayırt eden basit anahtar |
| received_at | DATETIME | |
| status | TEXT | `success` / `failure` |
| size_bytes | INTEGER (nullable) | |
| message | TEXT (nullable) | |

### `settings`
Tek satırlık key-value tablo (auth bilgisi hariç — bkz. §5): bildirim webhook URL'si, retention süresi gibi kullanıcı ayarları.

---

## 4. API Endpoint'leri (Minimal API)

| Method & Path | Açıklama |
|---|---|
| `GET /api/services` | Tüm servisleri (otomatik + manuel, override uygulanmış haliyle) döner |
| `POST /api/services` | Manuel servis ekler |
| `PUT /api/services/{id}` | Manuel servisi günceller, ya da bir Docker servisi için override oluşturur/günceller |
| `DELETE /api/services/{id}` | Manuel servisi siler (Docker servisleri silinemez, sadece override temizlenir) |
| `GET /api/containers` | Docker socket'ten anlık container listesi (durum, kaynak kullanımı) |
| `POST /api/containers/{id}/restart` | Container yeniden başlatma (v1'de opsiyonel, ayarlardan açılıp kapatılabilir bir yetki) |
| `GET /api/metrics/system?range=24h` | Sistem metrikleri zaman serisi |
| `GET /api/uptime?service_id=...&range=7d` | Belirli bir servisin uptime geçmişi |
| `POST /api/push/{token}` | Harici script'lerin backup/job durumu bildirmesi için (Uptime Kuma push mantığı) |
| `GET /api/backup-events?limit=10` | Son backup olaylarının listesi |
| `GET /api/dashboard/summary` | Dashboard sayfası için tek çağrıda özet veri (servis sayıları, son backup, kritik uyarılar) |
| `GET /api/settings` / `PUT /api/settings` | Genel ayarlar |
| `POST /api/auth/login` / `POST /api/auth/logout` | Basit oturum yönetimi (bkz. §5) |

---

## 5. Arka Plan Servisleri (Background Services)

.NET'in `BackgroundService` sınıfı ile çalışan, her biri kendi periyoduna sahip bağımsız döngüler:

| Servis | Periyot | İş |
|---|---|---|
| `ContainerDiscoveryService` | 10 sn | Docker socket'ten container listesini çeker, `services` tablosunu senkronize eder (yeni container ekle, kaybolanı `unknown` işaretle) |
| `SystemMetricsCollector` | 15 sn | Host CPU/RAM/disk/network ölçer, `system_metrics` tablosuna yazar |
| `UptimeCheckerService` | Servis bazlı, varsayılan 60 sn | Her servisin `health_check_url` (varsa) adresine istek atar, sonucu `uptime_checks`'e yazar, `services.status` günceller |
| `RetentionCleanupService` | Günde 1 kez | `system_metrics` ve `uptime_checks` tablolarındaki eski kayıtları temizler (varsayılan 30 gün) |

---

## 6. Kimlik Doğrulama (Auth)

- **v1 yaklaşımı:** Tek-kullanıcılı basit kullanıcı adı/şifre girişi, oturum cookie'siyle (Dozzle'ın `simple` auth provider mantığına benzer — bkz. RESEARCH.md)
- **Opsiyonel kapatma:** Kullanıcı zaten Tailscale gibi bir ağ katmanıyla erişimi kısıtlıyorsa, auth ortam değişkeniyle tamamen kapatılabilir (`CORVUS_AUTH_ENABLED=false`)
- Şifre bcrypt ile hash'lenip `settings` tablosundan ayrı, ayrıca korunan bir tabloda saklanır
- SSO/OAuth2 v1 kapsamında değil — genişletilebilir bırakılır ama ilk sürümde gerekli değil (tek kullanıcı senaryosu için aşırı mühendislik olur)

---

## 7. Yapılandırma (Ortam Değişkenleri)

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `CORVUS_PORT` | `8090` | Web arayüzünün dinleyeceği port |
| `CORVUS_DATA_DIR` | `/data` | SQLite dosyasının ve diğer kalıcı verinin tutulduğu dizin |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker socket yolu |
| `CORVUS_AUTH_ENABLED` | `true` | Auth açık/kapalı |
| `CORVUS_AUTH_USER` / `CORVUS_AUTH_PASS` | — | İlk kurulumda admin kullanıcı (sonrasında UI'dan değiştirilebilir) |
| `CORVUS_METRICS_RETENTION_DAYS` | `30` | Metrik/uptime verisinin saklama süresi |

---

## 8. Dağıtım

- **Docker image:** Çok aşamalı (multi-stage) Dockerfile —
  1. Node/Vite aşaması: React frontend'i build eder (`dist/`)
  2. .NET AOT aşaması: Backend'i Native AOT ile derler, frontend'in `dist/` çıktısını statik dosya olarak gömer
  3. Minimal runtime image (distroless veya alpine tabanlı) — tek binary + statik dosyalar
- **Tek binary (Docker dışı):** Aynı AOT binary doğrudan çalıştırılabilir, frontend dosyaları yanında bir klasörde taşınır
- **Docker socket bağlama:** `docker-compose.yml` örneğinde `/var/run/docker.sock:/var/run/docker.sock:ro` (salt okunur — container restart gibi yazma gerektiren işlemler için ayrı, opsiyonel bir yetki bayrağı düşünülebilir)

---

## 9. Araştırmadan Gelen Somut Kararlar (RESEARCH.md entegrasyonu)

| Karar | Kaynak proje |
|---|---|
| Docker socket'e doğrudan bağlan, agent'sız (v1) | Portainer (tek-node), Dozzle, Glance |
| Label varsa oradan zenginleştir → yoksa `service_overrides` tablosuna bak → o da yoksa ham veriyle listele | Glance |
| Backup/harici job durumu için push endpoint'i (`POST /api/push/{token}`) | Uptime Kuma |
| Çoklu sunucu desteği (SSH tabanlı hub+agent) | Beszel — **v1 kapsamında değil, v2 notu** |
| Log streaming (stateless, DB'siz) | Dozzle — **v1 kapsamında değil, v2 notu ("Loglar" sayfası)** |

---

## 10. Sayfalar (UI kapsamı — v1)

| Sayfa | İçerik |
|---|---|
| Dashboard | Genel durum özeti: servis up/down sayısı, sistem kaynak özeti, son backup durumu, kritik uyarı banner'ı |
| Servisler (Launcher) | Servis kartları grid görünümü, durum rozetleri, kategoriye göre gruplama, arama |
| Sistem Metrikleri | CPU/RAM/disk/network zaman içinde grafik |
| Container'lar | Docker container listesi: isim, durum, kaynak kullanımı, uptime |
| Uptime | Endpoint izleme listesi, response time geçmişi, down geçmişi |
| Ayarlar | Servis ekleme/düzenleme (manuel mod), bildirim ayarları |

*(Tasarım referansları: design.md, örnek HTML mockup'lar — Dashboard ve Servisler sayfaları için üretildi)*

---

## 11. Tamamlanan ve Sonraki Adımlar
 
 - [x] Native AOT + Docker.DotNet doğrulama testi (Docker.DotNet reflection nedeniyle custom SocketsHttpHandler + System.Text.Json kararı alındı)
 - [x] Veri katmanı seçimi (Dapper + Dapper.AOT + Microsoft.Data.Sqlite + DbUp olarak netleşti)
 - [x] `STRUCTURE.md` mimarisiyle `Corvus.Api` ve `Corvus.Web` iskeletinin kurulması
 - [x] SQLite veri modeli ve DbUp migration'larının (`001_init.sql`) oluşturulması
 - [x] Custom Docker istemcisi ve `ContainerDiscoveryService` ile uçtan uca akışın tamamlanması
 - [x] React frontend (Dashboard, Servisler, Container'lar, Metrikler, Uptime, Ayarlar) sayfalarının tamamlanması ve single-binary `wwwroot` entegrasyonu
 - [x] Çok aşamalı (multi-stage) `Dockerfile` ve `docker-compose.yml` dağıtım yapılandırması
 - [x] `Corvus.Api.Tests` xUnit test projesinin oluşturulması ve tüm testlerin geçmesi
 - [x] Canlı Docker testinde <30 MB hedefinin aşılması (13.88 MiB RAM ile doğrulandı)
