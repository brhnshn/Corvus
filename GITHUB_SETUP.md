# GitHub Açık Kaynak Repo Kurulumu — Araştırma ve Kontrol Listesi

Bu doküman, Corvus'u GitHub'da açık kaynak olarak yayınlarken repo ayarlarının, dosya yapısının ve CI/CD akışının nasıl kurulması gerektiğini kapsar.

---

## 1. Temel Repo Ayarları

| Ayar | Öneri |
|---|---|
| Visibility | Public |
| Default branch | `main` |
| Description + topics | Kısa açıklama + `self-hosted`, `docker`, `monitoring`, `dashboard`, `dotnet` gibi topic'ler (keşfedilebilirlik için önemli) |
| Wiki | Kapalı (dokümantasyon README/docs klasöründe tutulacaksa gereksiz) |
| Issues | Açık |
| Discussions | Açık (bug/feature'dan ayrı, genel soru-cevap ve topluluk tartışması için) |
| Projects | Opsiyonel — roadmap görselleştirmek istersen açık, ilk aşamada gerekli değil |

---

## 2. Community Health Dosyaları (`.github/` ve kök dizin)

GitHub, bir reposun "topluluk standartları" karşılayıp karşılamadığını bu dosyalara göre değerlendiriyor (Insights → Community Standards sekmesinde görülebilir):

| Dosya | Konum | İçerik |
|---|---|---|
| `README.md` | Kök | Proje tanıtımı, kurulum (docker-compose örneği), ekran görüntüsü, lisans/CI badge'leri |
| `LICENSE` | Kök | MIT önerilir — bu nişteki tüm referans projeler (Beszel, Uptime Kuma, Glance, Dozzle) MIT kullanıyor, katkı/fork bariyerini düşürür |
| `CONTRIBUTING.md` | Kök veya `.github/` | Nasıl katkı yapılır, commit formatı (Conventional Commits önerilir), PR süreci |
| `CODE_OF_CONDUCT.md` | Kök veya `.github/` | Standart bir topluluk davranış kuralı (Contributor Covenant şablonu yaygın) |
| `SECURITY.md` | `.github/` | Güvenlik açığı nasıl bildirilir (Docker socket erişimi olan bir araç için bu özellikle önemli) |
| `ISSUE_TEMPLATE/bug_report.md`, `feature_request.md` | `.github/ISSUE_TEMPLATE/` | Yapılandırılmış issue formları (GitHub'ın YAML form desteği kullanılabilir) |
| `PULL_REQUEST_TEMPLATE.md` | `.github/` | PR açıklama şablonu, kontrol listesi |
| `CODEOWNERS` | `.github/` | Şu an tek geliştirici olduğun için opsiyonel, katkıcı sayısı artınca eklenir |
| `FUNDING.yml` | `.github/` | Opsiyonel — GitHub Sponsors vb. bağlantısı, istersen sonra eklenir |

---

## 3. Branch Protection / Rulesets

`main` dalı için önerilen kurallar (Settings → Branches veya yeni Rulesets arayüzü):

- Doğrudan push yasak, sadece PR ile merge
- Merge öncesi CI status check'lerinin (lint, test, build) geçmesi zorunlu
- En az 1 onay gerekliliği (tek geliştiriciyken bu kuralı gevşetebilirsin, katkıcı geldiğinde sıkılaştırılır)
- Force push ve dal silme yasak
- Linear history (opsiyonel, merge commit karmaşasını önlemek için tercih edilebilir)
- Conversation resolution zorunlu (PR'daki yorumlar kapatılmadan merge edilemez)

**Not:** Tek geliştirici aşamasında "admin enforcement" kapalı bırakılabilir (kendi reponda sıkışıp kalmamak için), katkıcı sayısı arttıkça sıkılaştırılır.

---

## 4. GitHub Actions — CI/CD Akışı

### `.github/workflows/ci.yml` — Her PR ve push'ta çalışır
- .NET 9 kurulumu (`actions/setup-dotnet@v4`)
- `dotnet restore`, `dotnet build`, `dotnet test`
- Frontend: `npm install`, `npm run build`, `npm run lint`
- Native AOT derleme denemesi (en az bir platform için) — erken aşamada AOT uyumsuzluklarını yakalamak için
- Minimal izin: `permissions: contents: read`

### `.github/workflows/codeql.yml` — Güvenlik taraması
- Push, PR ve haftalık zamanlanmış tetikleyici
- C# ve TypeScript için CodeQL analizi
- Docker socket'e erişen bir araç olduğu için güvenlik taramasının önemi normalden yüksek

### `.github/workflows/docker-publish.yml` — Image yayınlama
- Tag push'ta (örn. `v1.2.0`) tetiklenir
- Multi-arch build (linux/amd64 + linux/arm64 — Raspberry Pi gibi düşük güçlü cihazlar da hedef kitle içinde olduğu için ARM desteği önemli)
- **GHCR (GitHub Container Registry)**'ye push — Docker Hub'a göre GitHub reposuyla doğrudan entegre, ek hesap gerektirmiyor
- `docker/build-push-action` + `docker/setup-buildx-action` + `docker/metadata-action` (otomatik tag/label üretimi için) kombinasyonu yaygın kullanılan yaklaşım

### `.github/workflows/release.yml` — Sürüm yayınlama
- Manuel tetiklenir (`workflow_dispatch`) — patch/minor/major seçimi ile
- Versiyon numarasını günceller, CHANGELOG oluşturur/günceller, tag atar, GitHub Release oluşturur
- Native AOT binary'lerini (Linux x64/arm64 en azından) release asset'i olarak ekler — Docker dışı kullanıcılar için

### `.github/dependabot.yml`
- NuGet paketleri, npm paketleri ve GitHub Actions için otomatik güncelleme PR'ları
- Haftalık zamanlama yeterli, günlük gereksiz gürültü yaratır

---

## 5. Sürüm Yönetimi (Versioning)

- **Semantic Versioning (SemVer)** — `MAJOR.MINOR.PATCH` — bu nişteki tüm projeler bu yaklaşımı kullanıyor
- Docker image tag'leri: `latest`, `v1.2.0`, `1.2`, `1` gibi çoklu tag stratejisi (kullanıcı ihtiyacına göre sabitleme esnekliği sağlar)
- `CHANGELOG.md` — her release'de güncellenir, "Keep a Changelog" formatı yaygın ve okunabilir

---

## 6. Etiketler (Labels)

Varsayılan GitHub etiketlerine ek olarak önerilenler:
- `good first issue` — yeni katkıcıları yönlendirmek için (topluluk büyümesi hedefleniyorsa önemli)
- `help wanted`
- `area:backend`, `area:frontend`, `area:docker` gibi alan bazlı etiketler
- `priority:low/medium/high`

---

## 7. README İçeriği (öncelik sırası)

1. Kısa tanıtım + tek cümlelik değer önermesi
2. Ekran görüntüsü/GIF (self-hosted araçlarda kullanıcı kararını görsel verir)
3. Hızlı kurulum — tek `docker-compose.yml` bloğu (kopyala-yapıştır çalışacak şekilde)
4. Özellik listesi
5. Badge'ler: CI durumu, lisans, Docker image boyutu/versiyonu, GitHub stars (opsiyonel)
6. Konfigürasyon tablosu (ortam değişkenleri — PROJECT.md §7'deki tablo doğrudan buraya taşınabilir)
7. Katkı/lisans linkleri (CONTRIBUTING.md, LICENSE)

---

## 8. Corvus'a Özel Notlar

- Docker.DotNet + Native AOT doğrulama testi CI'da erken bir aşamada otomatik çalıştırılmalı — bu proje için özellikle riskli bir nokta olduğu için (bkz. PROJECT.md §2) manuel kontrole bırakılmamalı
- ARM64 desteği (Raspberry Pi/homelab kitlesi) build matrisinde v1'den itibaren düşünülmeli — bu nişin (Beszel, Glance, Dozzle) kullanıcı kitlesi büyük oranda ARM cihazlarda çalıştırıyor
- SECURITY.md özellikle vurgulanmalı: Docker socket'e salt-okunur bağlanma önerisi, container restart gibi yazma yetkisi gerektiren özelliklerin opsiyonel/bayrakla açılabilir olması (PROJECT.md §8'de zaten planlandı) güvenlik politikasında açıkça belirtilmeli

---

## 9. Öncelik Sırası (İlk Yayın İçin Minimum Gereken)

| Öncelik | Kalem |
|---|---|
| 1 | README.md, LICENSE (MIT) |
| 2 | ci.yml (build+test) |
| 3 | docker-publish.yml (GHCR) |
| 4 | CONTRIBUTING.md, ISSUE_TEMPLATE'ler |
| 5 | Branch protection (main) |
| 6 | codeql.yml, dependabot.yml |
| 7 | release.yml, CHANGELOG.md |
| 8 | CODE_OF_CONDUCT.md, SECURITY.md, PR template |

*(1-3 olmadan repo "kullanılabilir" değil; 4-8 topluluk büyüdükçe önem kazanır ama baştan iskelet olarak kurulması ilerideki sürtünmeyi azaltır.)*
