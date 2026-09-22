# Corvus — Kapsam ve Mimari İlkeler

## 1. Temel İlke

Corvus, belirli bir kişinin veya kurulumun paneli değildir. Açık kaynak bir proje olarak **herhangi bir self-hosted sunucu için genel bir izleme + launcher paneli** olmalı. Geliştiricinin kendi sunucusu (Coolify + Caddy + Tailscale tabanlı kurulum) yalnızca ilk geliştirme/test senaryosudur — nihai ürün bu kuruluma bağımlı olmamalıdır.

---

## 2. Servis Keşfi: İki Modlu Yaklaşım

### A) Otomatik Keşif (varsayılan)
- Docker socket'e bağlanıp sunucuda çalışan container'ları otomatik algılar
- Herhangi bir reverse proxy'e (Caddy, Traefik, Nginx) veya orkestrasyon aracına (Coolify, Portainer) bağımlı değildir — sadece standart Docker API'sini kullanır
- Container bilgisi (isim, port, durum, kaynak kullanımı) otomatik çekilir
- Opsiyonel: Docker label'ları üzerinden ek metadata (ikon, kategori, görünen isim) tanımlanabilir — ama label yoksa da container listelenir, sadece varsayılan görünümle

### B) Manuel Ekleme
- Docker socket'in erişemediği servisler için (uzak sunucu, harici SaaS, IoT cihaz, farklı bir ağdaki servis)
- Kullanıcı arayüzden URL, isim, ikon, kategori ve (opsiyonel) health-check endpoint'i girerek servis ekleyebilir
- Bu mod, Homer'ın yaptığı "sadece link" işlevinin doğal devamı — otomatik keşif hiçbir zaman manuel ekleme ihtiyacını tamamen ortadan kaldırmaz

### Neden ikisi birden gerekli
- Tek sunucu + tek Docker host senaryosunda otomatik keşif yeterli
- Çoklu sunucu, hibrit (bulut + ev sunucusu), veya Docker dışı servisler (bare-metal, harici API) için manuel ekleme şart
- Açık kaynak kullanıcı kitlesi çok çeşitli kurulumlara sahip olacağı için ikisi de v1 kapsamında olmalı

---

## 3. Dışarıdan Bağımsız Olması Gereken Alanlar

| Alan | Kişisel kurulum (bağımlı olunmayacak) | Genel yaklaşım |
|---|---|---|
| Reverse proxy | Caddy | Herhangi bir proxy ile çalışır, proxy'e özel entegrasyon yok |
| Orkestrasyon | Coolify | Sadece Docker socket okur, Coolify şart değil |
| Ağ/VPN | Tailscale | Ağ durumu widget'ı genel "bağlantı sağlığı" göstergesi, VPN aracına kilitlenmez |
| Backup bildirimi | `/opt/scripts/backup.sh` | Genel bir push/webhook endpoint'i — herhangi bir script bu endpoint'e HTTP isteğiyle durum bildirebilir (Uptime Kuma push monitor mantığı) |
| Auth | (henüz belirlenmedi) | Self-hosted herkese açık olacağı için genel bir auth katmanı (örn. basic auth / opsiyonel SSO) düşünülmeli, tek bir sağlayıcıya bağımlı olmamalı |

---

## 4. UI/Tasarım Yansıması

- Servis kartları, kategoriler, container listesi kullanıcının kendi eklediği/algılanan veriye göre dinamik olmalı
- Tasarım mockup'larındaki örnek veriler (Nextcloud, Gitea, PostgreSQL vb.) yalnızca demo/seed data'dır — koda veya varsayılan davranışa sabitlenmemeli
- Boş durum (hiç servis yokken) hem "otomatik algılanan servis yok" hem "manuel ekle" seçeneklerini net şekilde göstermeli

---

## 5. Sonraki Adım

- Docker socket okuma ve manuel ekleme veri modelinin (aynı servis listesinde nasıl birleşecekleri) teknik tasarımı yapılmalı
- Auth yaklaşımı netleştirilmeli
