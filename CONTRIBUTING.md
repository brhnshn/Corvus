# Katkıda Bulunma Kılavuzu (Contributing Guide)

Corvus projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Açık kaynak bir self-hosted izleme ve launcher aracı olarak topluluk katkılarını memnuniyetle karşılıyoruz.

## 🛠️ Yerel Geliştirme Ortamı

### Gereksinimler
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/)

### Kurulum Adımları
1. Repoyu fork'layın ve yerel makinenize klonlayın:
   ```bash
   git clone https://github.com/brhnshn/Corvus.git
   cd Corvus
   ```
2. Frontend bağımlılıklarını yükleyin ve derleyin:
   ```bash
   cd src/Corvus.Web
   npm install
   npm run build
   ```
3. Backend testlerini çalıştırın:
   ```bash
   cd ../..
   dotnet test tests/Corvus.Api.Tests
   ```
4. Backend'i yerel ortamda başlatın:
   ```bash
   dotnet run --project src/Corvus.Api
   ```

---

## 📝 Commit Mesajı Standartları

[Conventional Commits](https://www.conventionalcommits.org/) formatına uymanızı rica ederiz:
- `feat: yeni bir özellik eklendiğinde`
- `fix: bir hata düzeltildiğinde`
- `docs: dokümantasyon güncellemelerinde`
- `style: kod formatı, stil düzeltmelerinde`
- `refactor: işlevselliği değiştirmeyen kod iyileştirmelerinde`
- `test: test eklendiğinde veya güncellendiğinde`
- `chore: derleme, bağımlılık veya altyapı güncellemelerinde`

---

## 🚀 Pull Request (PR) Süreci

1. Yeni bir özellik veya hata düzeltmesi için anlamlı bir dal (branch) açın:
   ```bash
   git checkout -b feat/yeni-ozellik
   ```
2. Değişikliklerinizi yapın ve testlerin geçtiğinden emin olun (`dotnet test`).
3. Temiz ve açıklayıcı commit'lerle dalınızı GitHub'a gönderin.
4. `main` dalına yönelik bir Pull Request açın ve PR şablonundaki maddeleri doldurun.
