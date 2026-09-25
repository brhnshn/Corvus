# Corvus — Workspace Kuralları (GEMINI.md)

## 📌 Temiz Mimari ve Modüler Ayrım Kuralı (ASLA Tek Dosyaya Kod Yığma!)
- **Tek Sayfaya / Dosyaya Kod Yığma Yasağı:** Tek bir sayfaya veya dosyaya tonlarca kod YAZILAMAZ. İster frontend (`.tsx`, `.ts`, `.js`), ister backend (`.cs`, `.py` vb.) olsun; bir dosya monolitik hale getirilemez (formlar, modallar, raw fetch'ler, iş mantığı tek dosyada toplanamaz).
- **Servisler Ayrı Dosyada Olacak, Sayfadan Çekilecek:** UI sayfaları içinde doğrudan `fetch()` veya API iletişim mantığı yazılamaz. Veri iletişim katmanı daima ayrı bir servis dosyasında (`api/client.ts`, `*Service.cs` vb.) tanımlanır ve sayfaya oradan çağrılır / import edilir.
- **Modallar ve Alt Sekmeler Ayrı Dosyada Olacak:** Formlar, modallar veya sekmeler (ör. `AddServiceModal.tsx`, `*Tab.tsx`) ana sayfanın içine gömülmez; bağımsız dosyalara çıkarılıp sayfadan import edilir.
- **Mantık ve Yardımcı Fonksiyonlar Ayrı Dosyada Olacak:** URL dönüştürme, veri formatlama ve yardımcı kodlar UI sayfalarına gömülemez; `utils/` altında modülerleştirilip ihtiyaç duyan yerlere oradan çekilir. Böylelikle mimari daima temiz, modüler ve test edilebilir kalır.
