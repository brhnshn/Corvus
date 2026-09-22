# Design Sistemi — Self-Hosted Dashboard

## 1. Genel Yaklaşım

- Koyu tema varsayılan (açık tema opsiyonel, v2)
- Teknik/pro his: monitoring panellerinde endüstri standardı koyu arayüz
- Renk, durum bilgisini taşıyan fonksiyonel bir katman — dekoratif değil

---

## 2. Renk Paleti

### Koyu Tema (varsayılan)

| Kullanım | Renk | Hex |
|---|---|---|
| Ana arkaplan | Çok koyu lacivert-gri | `#0f1117` |
| Yüzey / kart arkaplanı | Bir ton açık gri | `#1a1d29` |
| Yüzey (hover/ikinci katman) | `#1e2130` |
| Ayırıcı çizgiler (border) | `#2a2e3f` |
| Ana metin | `#e5e7eb` |
| İkincil metin | `#9ca3af` |

### Vurgu Renkleri (Accent)

| Kullanım | Renk | Hex |
|---|---|---|
| Ana accent | Soluk gümüş / platin | `#d4d4d8` |
| İkincil accent | Daha parlak metalik gümüş (hover/vurgu) | `#e4e4e7` |
| Accent üstü metin (dolgulu buton içi) | Koyu arkaplan tonu | `#0f1117` |

> Gümüş/platin, kuzgun tüyünün parlak/cilalı yansımasını çağrıştırıyor ve monokrom sistemde tek "parlak nokta" olacak şekilde tasarlandı. Durum renkleriyle (yeşil/turuncu/kırmızı/gri) hiçbir tonda çakışmıyor, bu yüzden ayrım notuna gerek yok.
> Accent nötr olduğu için markayı "sakin/teknik" tarafa çekiyor — çok parlak/neon bir vurgu istenirse ileride yeniden değerlendirilebilir.

### Durum Renkleri (sabit, evrensel)

| Durum | Renk | Hex |
|---|---|---|
| Sağlıklı / çalışıyor | Yeşil | `#22c55e` |
| Uyarı / degraded | Turuncu | `#f59e0b` |
| Kritik / down | Kırmızı | `#ef4444` |
| Bilinmiyor / izlenmiyor | Gri | `#6b7280` |

### Açık Tema (opsiyonel, v2)

| Kullanım | Hex |
|---|---|
| Ana arkaplan | `#f8fafc` |
| Kart arkaplanı | `#ffffff` |
| Ana metin | `#111827` |

Accent ve durum renkleri açık temada da aynı kalır.

---

## 3. Tipografi

| Kullanım | Font | Örnek |
|---|---|---|
| Başlıklar, arayüz metni | Sans-serif | Inter, Geist |
| Sayısal metrikler (CPU %, RAM, uptime) | Monospace | JetBrains Mono, Fira Code |

Monospace kullanımı, sayısal değerlerin hizalanmasını ve teknik okunabilirliği artırır.

---

## 4. Bileşen Prensipleri

- **Kartlar:** Yuvarlatılmış köşe (8–12px), hafif border (`#2a2e3f`), gölge yok veya çok hafif
- **Durum rozetleri:** Küçük nokta + renk (yeşil/sarı/kırmızı/gri), metinle birlikte
- **Grafikler:** Accent rengini (gümüş/platin) kullan, durum renklerini grafiklerde sadece eşik/alarm çizgileri için kullan
- **Butonlar:** Ana aksiyon → gümüş dolgulu (koyu metin `#0f1117` ile), ikincil aksiyon → sadece border/outline

---

## 5. Sayfa Bazlı Notlar

| Sayfa | Öncelikli renk kullanımı |
|---|---|
| Dashboard | Durum renkleri (özet banner, mini kartlar) |
| Servisler / Launcher | Durum rozetleri (grid kartlarda) |
| Sistem Metrikleri | Accent renk (gümüş grafik çizgileri) |
| Container'lar | Durum renkleri (running/stopped) |
| Uptime | Durum renkleri + accent (response time grafiği) |
| Backup Durumu | Durum renkleri (başarılı/başarısız) |

---

## 6. Logo

- **Ana logo (master):** Tek renk (monochrome), sadece kuzgun kafası silüeti — yazı/wordmark içermiyor, icon olarak tasarlandı
- Wordmark ("Corvus" yazısı) ayrı bir lockup olarak icon'un yanına eklenecek, icon'a bağımlı değil
- Türetilecek varyantlar: vektörel SVG, favicon seti (16×16/32×32/48×48), gümüş/platin renkli versiyon (opsiyonel, hero görseli için), açık tema versiyonu

---

## 7. Sonraki Adım

- Bu paletle Dashboard ve Servisler sayfalarının wireframe/mockup'ı çıkarılabilir
- Figma veya kod tabanlı (Tailwind config) uygulamaya geçmeden önce 1-2 ekran üzerinde renk kombosu test edilmeli
