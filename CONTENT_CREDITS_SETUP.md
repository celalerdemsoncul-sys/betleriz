# Betleriz içerik ve kredi güncellemesi

## Kullanılabilen ekranlar

- Açılışta 16 kategori kartı: önceki uygulamadaki 8 normal ve 8 VIP tahmin kategorisi.
- Yan menüden kategoriler, kredi kazanma, kredi satın alma, arşiv ve backend bilgi sayfalarına erişim.
- Dün / bugün / yarın / öbür gün ve gerçek tarihli geçmiş tahmin arşivi.
- Eski dosyalardaki kategori etiketleri aynen kullanılır. Etiketsiz tahminler rastgele bir kategoriye atanmaz.
- Önceki uygulamanın dört JSON dosyası korunmuştur. İçerikleri 7–10 Nisan 2026 tarihlidir; bugün için güncel tahmin gibi gösterilmez.
- Güncel içerik yayımlama: http://127.0.0.1:8002/admin/tips
- Bilgi sayfaları: http://127.0.0.1:8002/admin

## İçerik ekleme

Yerel tahmin ekranında takımlar, lig, saat dilimi içeren gelecek maç tarihi, kategori ve tahmin girilir. Aynı maç/kategori yeniden kaydedilirse çift kayıt oluşmaz; farklı kategori mevcut tahminleri korur. Kayıtlar `panel/tips/*_managed.json` içinde tutulur ve mevcut dosyalar silinmez. Uygulama aynı backend'den okur; ekranda yenileme veya 60 saniyelik yenileme yeterlidir. Basketbol/tenis kaynak içeriği şu anda yoktur; bu kategoriler içerik eklenene kadar boş görünür.

## Kredi modeli

- İlk 10 doğrulanmış reklam videosu: 10 kredi ve günde bir tahmin açma hakkı.
- Sonraki 50 video: ek kredi verilmez; gece yarısına kadar kullanılabilen tek sayfa görüntüleme hakkı.
- Satın alınan krediler ayrı bakiye olarak izlenir. 10 satın alınan kredi bir güncel tahmini açar; reklamın günlük sınırını tüketmez.
- Ödeme önce Google Play üzerinden backend'de doğrulanır, sonra SQLite işlemiyle tek kez hesaba eklenir. Ürün tüketimi bundan sonra yapılır. Bekleyen/iptal edilmiş ödemeler, farklı hesaba bağlı fişler ve izin verilmeyen ürünler reddedilir.
- Kullanıcıdan para, kredi miktarı veya fiyat alınarak bakiye oluşturulmaz. Fiyat Google Play ürün yanıtından gelir.

## Satışı etkinleştirmeden önce

Satış varsayılan olarak kapalıdır. Yerel emülatörde gerçek ödeme yapılmamıştır. Play Console'da `com.betleriz.app` için tüketilebilir tek seferlik ürünleri oluşturun:

| Ürün kimliği | Kredi |
|---|---:|
| betleriz_credits_10 | 10 |
| betleriz_credits_50 | 50 |
| betleriz_credits_100 | 100 |

Fiyatları Play Console'da belirleyin. Google Play Developer API yetkili servis hesabı dosyası yalnızca sunucuda ve web kökü dışında tutulmalıdır. Sunucu ortam değişkenleri:

```
BETLERIZ_PLAY_CREDITS=on
BETLERIZ_PLAY_SERVICE_ACCOUNT=/private/path/service-account.json
```

Lisans testleri için ayrıca `BETLERIZ_PLAY_ALLOW_TEST=on` gerekir; bu seçenek gerçek kullanıcı ortamında açık bırakılmamalıdır. Google test işlemlerini gerçek bakiye ortamından ayrı bir `BETLERIZ_DATA_DIR` ile test edin.

Canlı satıştan önce ayrıca HTTPS sunucusu, Play internal test yüklemesi ve test hesabıyla ödeme/tüketim/yeniden deneme akışı, hesap kurtarma, iade/iptal mutabakatı ve güncel veri sağlayıcısı bağlantısı tamamlanmalıdır. Mevcut cüzdan cihazda saklanan konuk anahtarı kullanır; uygulama silinmesi veya cihaz değişiminde satın alınan bakiyeyi kurtaracak hesap sistemi henüz yoktur. Otomatik RTDN/iade bakiyesi düzeltmesi henüz uygulanmamıştır. Bu nedenle mevcut çalışma canlı satışa hazır olarak değerlendirilmemelidir.

## Kontroller

Proje dizininde `npm run typecheck`, `npm run test:betleriz`, `php tests/credits.test.php`, `php tests/content.test.php`, `php tests/purchases.test.php`.

Google belgeleri: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products ve https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/get
