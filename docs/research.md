# Açık Kaynak Referans Araştırması — Container Algılama ve Mimari

Bu doküman, Corvus'a mimari fikir vermesi için beş açık kaynak projenin (Beszel, Portainer, Glance, Uptime Kuma, Dozzle) **container algılama yöntemini ve genel mimarisini** inceler.

---

## 1. Beszel

**Dil:** Go (hem hub hem agent)
**Mimari:** Hub + Agent (iki bileşen)

- **Hub:** PocketBase üzerine inşa edilmiş web uygulaması — dashboard'u sağlar, verileri saklar
- **Agent:** İzlenecek her sistemde çalışır, container/sistem metriklerini toplar
- **İletişim:** Hub ve agent birbirine **SSH üzerinden** bağlanıyor — dışarıya açık port gerektirmiyor, harici bir auth katmanı (örn. Authelia) önüne konulsa bile bağlantı bozulmuyor
- **Container algılama:** Agent, Docker/Podman socket'ine erişip container CPU/RAM/network istatistiklerini topluyor
- **Kimlik doğrulama:** Hub ilk açılışta bir ED25519 anahtar çifti üretiyor, agent'ın SSH sunucusu sadece bu anahtarla bağlantı kabul ediyor
- **Veri katmanı:** PocketBase (SQLite tabanlı) — REST API'si otomatik geliyor

**Corvus için çıkarım:** Çoklu sunucu senaryosunda (SCOPE.md'de bahsettiğimiz "uzak servisler" ihtiyacı) hub+agent modeli iyi bir referans olabilir, ama tek sunucu senaryosunda gereksiz karmaşıklık katar. SSH tabanlı iletişim, "dışarıya port açmadan uzak sunucu izleme" için akıllıca bir çözüm.

---

## 2. Portainer

**Dil:** Go (backend), Vue.js (frontend)
**Mimari:** Server + (opsiyonel) Agent

- **Temel sorun çözümü:** Docker API'sinin bir kısıtlaması var — container/network/volume/image gibi kaynaklar "node-specific" (küme genelinde değil, sadece istek yapılan node'a özel). Portainer Agent bu kısıtlamayı aşmak için bir **proxy katmanı** olarak çalışıyor.
- **Agent'ın işlevi:** Docker Swarm kümesindeki her node'a bir agent konur; agent, `X-PortainerAgent-Target` header'ı ile hangi node'a istek yönlendirileceğini belirler ve birden fazla node'un yanıtını tek bir Docker API yanıtı gibi birleştirir (aggregate)
- **Container algılama:** Doğrudan Docker API'si (`/containers/json` vb.) üzerinden — agent yokken de tek node'da bu doğrudan çalışır
- **Tek node senaryosu:** Agent'a gerek yok, Portainer doğrudan Docker socket'e bağlanıp container'ları listeleyebiliyor

**Corvus için çıkarım:** Senin mevcut kurulumun (tek sunucu, Coolify zaten var) için agent karmaşıklığına hiç gerek yok — doğrudan Docker socket erişimi yeterli. Çoklu sunucu/swarm senaryosu v1 kapsamı dışında tutulabilir.

---

## 3. Glance

**Dil:** Go
**Mimari:** Tek binary, config dosyası tabanlı (YAML)

- **Container algılama — iki yöntem bir arada:**
  1. **Docker label tabanlı** (varsayılan): Container'lara özel label'lar eklenerek Glance'ın `docker-containers` widget'ında nasıl görüneceği (isim, açıklama, ikon, URL) belirleniyor
  2. **Config dosyası tabanlı override** (topluluk isteğiyle eklenen özellik): Kullanıcı `glance.yml` içinde container adını referans göstererek label eklemeden de override yapabiliyor — bu, "compose dosyalarını değiştirmeden container'ları özelleştirebilme" ihtiyacından doğmuş
- **Genel felsefe:** Label yoksa varsayılan görünümle listelenmeye devam ediyor, hiçbir container "görünmez" olmuyor
- **Performans:** Tek binary <20 MB, tüm istekler paralel yapılıyor, minimal JS

**Corvus için çıkarım:** Bu tam olarak SCOPE.md'de tanımladığımız "otomatik + manuel" ikilisine denk düşüyor — Glance'ın çözümü, label + config dosyası override'ının **aynı sistemde bir arada** çalışması. Corvus'ta da benzer mantık kurulabilir: label varsa oradan zenginleştir, yoksa varsayılan + kullanıcının panel içinden yaptığı manuel override'ı kullan (config dosyası yerine veritabanında saklanan override).

---

## 4. Uptime Kuma

**Dil:** Node.js (backend), Vue.js (frontend), Socket.IO (gerçek zamanlı iletişim)
**Mimari:** Tek uygulama, gömülü SQLite

- **Monitor tipleri:** HTTP(S), TCP, ping, DNS, **Docker container** (doğrudan socket üzerinden kontrol ediliyor), gRPC, ve **push tipi** monitörler
- **Push monitor mantığı:** Dıştan bir cron/script, Uptime Kuma'ya periyodik olarak bir HTTP isteği ("heartbeat") gönderiyor; belirlenen sürede heartbeat gelmezse "down" sayılıyor — bu, SCOPE.md'de bahsettiğimiz "genel backup bildirimi" ihtiyacına birebir uyan bir model
- **Gerçek zamanlılık:** Frontend, backend'e Socket.IO ile bağlanıyor, sayfa yenilemeden canlı güncelleniyor
- **Veri katmanı:** SQLite, harici veritabanı gerektirmiyor — ama çok fazla monitör (50-100+) olduğunda performans sorunları yaşandığı GitHub issue'larında belirtiliyor (bazı kullanıcılar dakikalarca yavaşlama bildiriyor)

**Corvus için çıkarım:** Push monitor mantığı, backup.sh gibi harici script'lerin durum bildirmesi için doğrudan kopyalanabilir bir model. SQLite ölçek sorunu bizim için risk değil çünkü Corvus'un hedef kullanım senaryosu (tek/az sayıda sunucu, düzinelerce servis) Uptime Kuma'nın sorun yaşadığı ölçeğin (yüzlerce monitör) çok altında.

---

## 5. Dozzle

**Dil:** Go (backend), Vue.js/TypeScript (frontend)
**Mimari:** Tek binary, agent'sız (opsiyonel agent modu var)

- **Container log algılama:** Docker socket'e bağlanıp `docker logs` API'sini **stream** ederek canlı log akışı sağlıyor — hiçbir log dosyası diske yazılmıyor, sadece anlık görüntüleme
- **Agent modu (opsiyonel):** Çoklu Docker host izlemek için `dozzle agent` komutu ile her hostta bir agent çalıştırılabiliyor, merkezi Dozzle bu agent'lara bağlanıyor
- **Swarm/Podman desteği:** Aynı kod tabanı, farklı runtime'larla (Docker, Podman, Swarm, K8s) uyumlu çalışabiliyor
- **Performans:** ~7 MB image, veritabanı gerektirmiyor (stateless)
- **Yetkilendirme:** Kullanıcı bazlı filtre desteği var — belirli bir kullanıcıyı sadece belirli label'a sahip container'ları görecek şekilde kısıtlayabiliyorsun

**Corvus için çıkarım:** "Loglar" sayfası (v2 kapsamında düşünülen) için doğrudan referans — stateless streaming yaklaşımı bizim "düşük RAM" hedefimizle tam örtüşüyor, log'ları veritabanında saklamaya gerek yok.

---

## 6. Ortak Desenler ve Corvus'a Uygulanabilecek Sonuçlar

| Desen | Hangi projede | Corvus'a uygulanabilirliği |
|---|---|---|
| Docker socket doğrudan erişim (agent'sız) | Portainer (tek node), Glance, Dozzle | v1 için temel yaklaşım — otomatik keşif bunun üzerine kurulmalı |
| Label + config override birlikte | Glance | SCOPE.md'deki "otomatik + manuel" ikilisi için doğrudan model |
| Push/heartbeat monitörü | Uptime Kuma | Backup durumu bildirimi için birebir uygulanabilir |
| Hub + Agent (SSH üzerinden) | Beszel | Çoklu sunucu senaryosu v2'de düşünülebilir, v1'de gereksiz karmaşıklık |
| Stateless log streaming | Dozzle | "Loglar" sayfası (v2) için model |
| Tek binary + gömülü SQLite | Beszel (PocketBase), Uptime Kuma, Glance (config dosyası) | Hepsi bizim "tek binary + SQLite" kararımızı destekliyor |
| SQL-first sıralı şema migration | Uptime Kuma (`patch-*.sql`) | DbUp ile numaralandırılmış `.sql` scriptleri üzerinden Native AOT uyumlu şema evrimi |

---

## 7. Sonuç — Corvus v1 için Önerilen Yaklaşım

1. **Container algılama:** Docker socket'e doğrudan bağlan (Portainer'ın tek-node modeli, Dozzle, Glance gibi) — agent'a v1'de gerek yok
2. **Zenginleştirme:** Glance'ın modeli gibi, önce Docker label'larına bak (varsa oradan isim/ikon/kategori al), yoksa veritabanındaki manuel override'a bak, o da yoksa ham container bilgisiyle listele
3. **Manuel servisler:** SCOPE.md'de tanımlandığı gibi, Docker dışı servisler için ayrı bir tablo/mekanizma (Homer'ın yaptığı gibi ama durum kontrolü eklenmiş hali)
4. **Backup/harici durum bildirimi:** Uptime Kuma'nın push monitor mantığını birebir uygula — basit bir `POST /api/push/{token}` endpoint'i
5. **Çoklu sunucu (v2 için not):** İleride gerekirse Beszel'in SSH tabanlı hub+agent modeli iyi bir referans olur, ama v1 kapsamı dışında tutulmalı
