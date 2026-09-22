# Corvus — Ajan Başlatma Promptu

Aşağıdaki metni, projeyi kodlamaya başlayacak ajana (Claude Code veya benzeri) birebir verebilirsin. `PROJECT.md`, `design.md`, `SCOPE.md`, `RESEARCH.md` dosyalarını da aynı klasöre koyup ekleyerek başlat.

---

## Prompt

Ekteki dört markdown dosyasını (`PROJECT.md`, `design.md`, `SCOPE.md`, `RESEARCH.md`) oku ve referans al. Bunlar **Corvus** adlı açık kaynak, self-hosted sunucu izleme + launcher panelinin mimari kararlarını içeriyor. Kodlamaya başlamadan önce hepsini incele, kararları sorgulama — bunlar zaten netleşmiş durumda, sen bunları uygulayacaksın.

### Projenin özeti
Corvus, self-hosted sunucular için tek panelden erişim + izleme sağlayan açık kaynak bir araç. İki temel işlevi var: (1) sunucudaki servisleri listeleyip erişim sağlayan bir launcher, (2) sistem kaynakları/container/uptime/backup durumunu izleyen bir monitoring paneli. Kişiye özel değil — herhangi bir reverse proxy, orkestrasyon aracı veya VPN'e bağımlı olmadan çalışmalı (detaylar `SCOPE.md`'de).

### Teknoloji yığını (PROJECT.md §2'den — değiştirme)
- Backend: C# / .NET 9 / ASP.NET Core Minimal API / Native AOT derleme
- Docker erişimi: Docker.DotNet
- Frontend: TypeScript + React + Vite + Tailwind CSS + Recharts
- Veri katmanı: SQLite (tek dosya, ekstra servis yok)
- Dağıtım: tek `docker-compose.yml`, tek servis, Docker socket salt-okunur bağlanacak

### İlk adım — doğrulama prototipi
Büyük mimariye geçmeden önce şunu doğrula: .NET 9 Native AOT derlemesiyle Docker.DotNet kütüphanesi gerçekten sorunsuz çalışıyor mu? Küçük bir konsol uygulaması yaz: Docker socket'e bağlan, çalışan container'ların listesini (isim, durum, ID) çek ve terminale yazdır. Bunu Native AOT ile derleyip çalıştır. Eğer reflection/trimming kaynaklı bir hata çıkarsa, bana raporla — mimariyi buna göre gözden geçiririz.

### Doğrulama başarılıysa — proje iskeleti
1. `PROJECT.md §3`'teki veri modelini (services, service_overrides, system_metrics, uptime_checks, backup_events, settings) SQLite şeması olarak oluştur
2. `PROJECT.md §4`'teki API endpoint listesini Minimal API ile iskelet olarak kur (önce boş/mock response'larla, sonra gerçek mantıkla doldur)
3. `PROJECT.md §5`'teki dört arka plan servisini (`ContainerDiscoveryService`, `SystemMetricsCollector`, `UptimeCheckerService`, `RetentionCleanupService`) `BackgroundService` sınıfları olarak oluştur — önce container discovery ile başla, en kritik parça o
4. React + Vite + Tailwind ile frontend iskeletini kur, `design.md`'deki renk paletini (`tailwind.config` içine) ve `corvus.html` / Stitch'ten üretilen Servisler sayfası HTML'ini referans alarak Dashboard ve Servisler sayfalarını React bileşenlerine dönüştür

### Sırayla ilerle, atlama
Önce doğrulama prototipi → sonra veri modeli → sonra en az bir uçtan uca çalışan akış (container discovery servisi → API → frontend'de görünmesi). Her adımda bana ne yaptığını özetle, büyük mimari kararları (örn. auth implementasyonu, EF Core vs Dapper seçimi) tek taraflı verme, önce sor.

### Sorma gerekmeyenler
Aşağıdakiler zaten kararlaştırıldı, tekrar sorma: dil/framework seçimi, renk paleti, sayfa listesi, veri modeli şeması, API endpoint isimleri, auth yaklaşımı (tek kullanıcı, opsiyonel kapatılabilir).

---

## Kullanım notu
Bu prompt'u verirken dört .md dosyasını da (PROJECT.md, design.md, SCOPE.md, RESEARCH.md) aynı konuşmaya/klasöre ekle — ajan bunları "ekteki dosyalar" diye referans alacak.
