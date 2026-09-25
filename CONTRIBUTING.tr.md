<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](CONTRIBUTING.md)
[![Türkçe](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge)](CONTRIBUTING.tr.md)

</div>

# Corvus'a Katkıda Bulunma

Corvus'a katkı sağlamak istediğiniz için teşekkür ederiz! Açık kaynak topluluğuyla birlikte en hafif, en hızlı ve Native AOT destekli sunucu başlatıcı ve izleme panelini geliştirmekten mutluluk duyuyoruz.

Projemizin açık kaynak dünyasında her zaman temiz, profesyonel, sürdürülebilir ve yeni geliştiricilerin kolayca adapte olabileceği bir yapıda kalması için lütfen aşağıdaki mimari kuralları ve standartları takip edin.

---

## 🛠️ Yerel Geliştirme Ortamı Kurulumu

### Ön Gereksinimler
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Engine veya Docker Desktop](https://www.docker.com/)

### Başlarken
1. **Depoyu forklayın ve klonlayın:**
   ```bash
   git clone https://github.com/brhnshn/Corvus.git
   cd Corvus
   ```
2. **Frontend bağımlılıklarını kurun ve derleyin:**
   ```bash
   cd src/Corvus.Web
   npm install
   npm run build
   ```
3. **Backend testlerini çalıştırın:**
   ```bash
   cd ../..
   dotnet test tests/Corvus.Api.Tests
   ```
4. **Backend'i yerel olarak başlatın:**
   ```bash
   dotnet run --project src/Corvus.Api
   ```
   Tarayıcınızda `http://localhost:8090` adresini açın.

---

## 🏛️ Temiz Mimari ve Kod Standartları

Corvus sıkı modülerlik kuralları uygular. Lütfen PR açmadan önce bu kurallara uyduğunuzdan emin olun:

### 1. 🚫 Tek Dosyaya Kod Yığma Yasağı (Anti-Monolith Kuralı)
- Yüzlerce satırlık iş mantığı, formlar, modallar ve veri çekme kodları tek bir sayfaya doldurulamaz.
- Bileşenlerinizi odaklı ve **200–300 satırın altında** tutun. Dosya büyüdüğünde alt bileşenlere bölün.

### 2. 📂 Modüler Sayfa Klasör Yapısı
- Her sayfa `src/Corvus.Web/src/pages/<SayfaAdi>/index.tsx` şeklinde kendi klasöründe yaşar.
- Yalnızca o sayfada kullanılan modallar, sekmeler ve alt bileşenler doğrudan o klasörün altına yerleştirilir:
  ```
  pages/Containers/
  ├── index.tsx                 # Sayfa orkestratörü ve durum yöneticisi
  ├── ContainerList.tsx         # Mobil kart ve masaüstü tablo düzeni
  ├── ComposeStackGroup.tsx     # Docker Compose proje akordiyonları
  ├── ContainerStatsBadges.tsx  # Canlı CPU, RAM, Ağ rozetleri
  ├── ContainerActionButtons.tsx# Aksiyon butonları (Start, Stop vb.)
  └── ContainerLogsModal.tsx    # Canlı terminal modalı
  ```

### 3. 🧩 Ortak Bileşenler vs. Sayfa Bileşenleri
- `src/Corvus.Web/src/components/` dizini **kesinlikle yalnızca** birden çok sayfada paylaşılan genel bileşenlere (`Sidebar.tsx`, `StatusBadge.tsx`, `LanguageSwitch.tsx`, `RegistrationPromptModal.tsx`) ayrılmıştır.
- Yalnızca tek bir sayfayı ilgilendiren bileşenler o sayfanın kendi klasöründe olmalıdır.

### 4. 🌐 Merkezileştirilmiş API Servisi
- **UI bileşenleri içinde asla doğrudan raw `fetch()` yazmayın.**
- Tüm API istekleri ve TypeScript tipleri `src/Corvus.Web/src/api/client.ts` dosyasına eklenir. Sayfalar `api.metotAdi()` şeklinde çağrı yapar.

### 5. 🛠️ Yardımcı Fonksiyonlar (Utils)
- Sayı/bayt dönüştürme, tarih biçimlendirme ve URL formatlama mantıkları `src/Corvus.Web/src/utils/` (`url.ts`, `format.ts`) altında toplanır.

### 6. ⚙️ Backend Temiz Mimarisi
- **Endpoints (`src/Corvus.Api/Endpoints/`):** Minimal API rotaları `MapXEndpoints()` extension sınıflarında tanımlanır. Rota içinde iş mantığı veya doğrudan SQL sorgusu yazılmaz.
- **Services (`src/Corvus.Api/Services/`):** İş mantıkları ve entegrasyonlar (Docker, Bildirimler, Auth) burada toplanır.
- **Data Access (`src/Corvus.Api/Data/`):** Dapper.AOT ile parametreli SQL sorguları yürüten Repository sınıfları yer alır.
- **Background Workers (`src/Corvus.Api/BackgroundServices/`):** Arka planda bağımsız çalışan `BackgroundService` sınıflarıdır.

---

## 💡 Yeni Bir Sayfa veya Özellik Nasıl Eklenir?

1. **Backend Uç Noktası:**
   - `src/Corvus.Api/Endpoints/` altında ilgili endpoint sınıfını oluşturun veya güncelleyin.
   - `src/Corvus.Api/Program.cs` dosyasına `app.MapYeniEndpoints()` şeklinde kaydedin.
   - Veritabanı şema değişikliği gerekiyorsa `src/Corvus.Api/Data/Migrations/` altına yeni bir göç dosyası ekleyin.

2. **API İstemcisi:**
   - `src/Corvus.Web/src/api/client.ts` içine ilgili TypeScript interface ve metodunu ekleyin.

3. **Frontend Sayfası:**
   - `src/Corvus.Web/src/pages/YeniOzellik/` klasörünü açın.
   - Ana sayfayı `index.tsx` olarak yazın, sekmeleri veya modalları yan dosyalara çıkarın.
   - `App.tsx` ve `Sidebar.tsx` dosyalarına rotayı ekleyin.

4. **Çoklu Dil (i18n):**
   - Eklenen metinleri hem `src/Corvus.Web/src/i18n/en.ts` hem de `src/Corvus.Web/src/i18n/tr.ts` dosyalarına ekleyin.

5. **Otomasyon Doğrulaması:**
   - Frontend'in derlendiğini doğrulayın: `npm run build`.
   - `tests/Corvus.Api.Tests/` testlerini çalıştırın: `dotnet test`.

---

## 📝 Commit Mesaj Kuralları

[Conventional Commits](https://www.conventionalcommits.org/) standartlarını kullanıyoruz:
- `feat:` yeni bir özellik eklendiğinde
- `fix:` hata düzeltildiğinde
- `docs:` dokümantasyon güncellemelerinde
- `style:` mantık değiştirmeyen kod formatlamalarında
- `refactor:` davranış değiştirmeyen kod yapılandırmalarında
- `test:` test ekleme veya güncelleme işlemlerinde
- `chore:` derleme, bağımlılık veya CI/CD işlerinde

---

## 🚀 Pull Request Akışı

1. `main` dalından yeni bir özellik dalı (feature branch) oluşturun:
   ```bash
   git checkout -b feat/ozellik-adiniz
   ```
2. Değişikliklerinizi yukarıdaki temiz mimari standartlarına göre yazın.
3. Hem frontend derlemesinin (`npm run build`) hem de backend testlerinin (`dotnet test`) 0 hata ile geçtiğinden emin olun.
4. Açıklayıcı bir commit mesajıyla commit atın.
5. Dalınızı GitHub'a push edin ve `main` dalına yönelik bir Pull Request açın.
