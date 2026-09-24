<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](design-system.md)
[![Türkçe](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge)](design-system.tr.md)

</div>

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

> Gümüş/platin, kuzgun tüyünün parlak/cilalı yansımasını çağrıştırıyor ve monokrom sistemde tek "parlak nokta" olacak şekilde tasarlandı. Durum renkleriyle hiçbir tonda çakışmıyor.

### Durum Renkleri (sabit, evrensel)

| Durum | Renk | Hex |
|---|---|---|
| Sağlıklı / çalışıyor | Yeşil | `#22c55e` |
| Uyarı / degraded | Turuncu | `#f59e0b` |
| Kritik / down | Kırmızı | `#ef4444` |
| Bilinmiyor / izlenmiyor | Gri | `#6b7280` |

---

## 3. Tipografi

| Kullanım | Font | Örnek |
|---|---|---|
| Başlıklar, arayüz metni | Sans-serif | Inter, Geist |
| Sayısal metrikler (CPU %, RAM, uptime) | Monospace | JetBrains Mono, Fira Code |

---

## 4. Bileşen Prensipleri

- **Kartlar:** Yuvarlatılmış köşe (8–12px), hafif border (`#2a2e3f`), sade gölge
- **Durum rozetleri:** Küçük nokta + renk (yeşil/sarı/kırmızı/gri), metinle birlikte
- **Grafikler:** Accent rengini (gümüş/platin) kullan, durum renklerini eşik/alarm çizgileri için kullan
- **Butonlar:** Ana aksiyon → gümüş dolgulu (`#0f1117` koyu metin ile), ikincil aksiyon → sadece border/outline

---

## 5. Logo

- **Ana logo (master):** Tek renk (monochrome), kuzgun kafası silüeti — icon-only tasarım
- **Wordmark:** "Corvus" tipografisi ikonun yanında responsive olarak konumlandırılır
