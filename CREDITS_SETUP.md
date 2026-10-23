# Betleriz 1.3 — Tek tahmin ve tek sayfa görüntüleme modeli

## Son onaylanan kural

- **İlk 10 tamamlanan video → yalnızca 1 tekli tahmin açma hakkı.** İlk 10 video birer kredi verir. Bir tahmin 10 kredi tutar; günde en fazla 1 yeni tekli tahmin kalıcı açılabilir. Aynı tahmini yeniden okumak tekrar ücretlendirilmez.
- **Sonraki 50 tamamlanan video → tüm güncel tahminleri içeren tek sayfayı yalnızca 1 kez görüntüleme hakkı.** Bu 50 video ek kredi veya ek tekli tahmin hakkı vermez. Toplam eşik 60 videodur.
- Tam sayfa otomatik açılmaz. Kullanıcı hazır olduğunda `Tüm tahminleri 1 kez görüntüle` düğmesine basar ve tek kullanımlık hakkını harcamayı onaylar.
- Sayfadan çıkınca veya uygulama süreci kapanınca aynı hakla yeniden açılamaz. Sayfa içindeki tüm tahminler tek kaydırılabilir görünümde bulunur. Başka ekranlara tekrar tekrar girilebilen bir günlük VIP aboneliği yoktur.
- Kullanılmamış tam sayfa hakkı ve açık sayfa **Kıbrıs / Asia/Famagusta saatiyle 00.00'da sona erer**. Önceki talepteki gece yarısı sınırı korunmuştur; 24 saatlik süre verilmez. Günlük videolar ve tekli yeni açma sınırı da bu saatte yenilenir.
- İlk 10 videodan kalan kullanılmamış krediler korunur; ancak günde 1 yeni tekli açma sınırı değişmez. Bu krediler ekstra 50 videodan kazanılmış kredi değildir. Krediler para değildir ve nakde çevrilemez.

Reklam doluluğu garanti değildir. Reklam yüklenemezse veya tamamlanmadan kapatılırsa video sayacı ve kredi artmaz. Üretimde yalnızca imzası doğrulanmış Google SSV callback'i sayılır; istemcinin `earned` bildirimi tek başına yeterli değildir.

## Mac'te yerel test

Gerekenler: PHP 8+, PDO_SQLite/OpenSSL, Node.js 18+, JDK 17, Android SDK. Reklam köprüsü native kod içerir; Metro reload yerine yeniden derleme gerekir.

```bash
# Proje klasöründe, birinci Terminal:
BETLERIZ_AD_MODE=test ./START_API.command

# İkinci Terminal:
./START_ANDROID.command
```

Varsayılan Android debug reklam kimlikleri Google'ın resmi test kimlikleridir. Test reklamı gerçek gelir üretmez. Yerel `test-complete` endpoint'i yalnızca açıkça test moduna alınan loopback serviste çalışır; production modunda kullanılamaz.

Tahminler ve Ayarlar ekranında sayaç görünür. İlk 10 video tekli açma seçeneğini hazırlar; 11–60 arasındaki videolar sadece tam sayfa sayacını ilerletir. 60. videodan sonra bir defalık sayfa düğmesi açılır.

**Projeyle gelen arşiv eski tarihlidir.** Güncel/future tahmin yoksa sayfa hakkı tüketilmez; önce gerçek veri kaynağını güncelleyin. Varsayılan kaynak `panel/tips/*.json`; alternatif klasör `BETLERIZ_TIP_DIR` ortam değişkeniyle seçilebilir. Uygulama maç/tahmin uydurmaz.

Normal API modu `off` olduğundan gerçek hesap kurulmadan reklam düğmesi kapalıdır.

## Gerçek AdMob bağlantısı

Bu kaynak paketinde gerçek AdMob hesabı/kimliği yoktur; hiçbir şey yayınlanmamıştır.

1. AdMob'da `com.betleriz.app` uygulamasını ve ödüllü reklam birimini tanımlayın. AdMob ödül miktarı **1**, ödül türü **video** olmalıdır. Bu, tamamlanan bir videoyu temsil eder. İlk 10 videonun krediye dönüşmesi ve sonraki 50'nin sadece sayfa sayacına yazılması sunucuda yapılır.
2. Özel Gradle kullanıcı özelliklerine veya `android/gradle.properties` dosyasına ekleyin:

```properties
BETLERIZ_ADMOB_APP_ID=ca-app-pub-YOUR_PUBLISHER~YOUR_APP
BETLERIZ_REWARDED_AD_UNIT=ca-app-pub-YOUR_PUBLISHER/YOUR_REWARDED_UNIT
```

3. Sunucuyu HTTPS üzerinde çalıştırın. Web kökü **yalnızca `server/public`** olmalıdır. Apache `.htaccess` dosyası pakette bulunur. Diğer sunucularda yolları `server/public/index.php` ön denetleyicisine yönlendirin. Eski `panel` veya kaynak proje web kökü yapılmamalıdır; doğrudan eski `/api/tips.php` kredi kilidini atlatmamalıdır. Yeni yönlendirici bu eski yolu açmaz.
4. Sunucu ortamı:

```text
BETLERIZ_AD_MODE=production
BETLERIZ_REWARDED_AD_UNIT=ca-app-pub-YOUR_PUBLISHER/YOUR_REWARDED_UNIT
BETLERIZ_REWARD_TIMEZONE=Asia/Famagusta
BETLERIZ_DATA_DIR=/private/persistent/betleriz-data
```

5. AdMob SSV adresi: `https://YOUR_DOMAIN/v1/ssv`. Native kod rastgele oturum nonce'ını `custom_data`, rastgele cüzdan kimliğini `user_id` olarak bağlar. Sunucu Google ECDSA imzasını ham sorgu üzerinde doğrular; reklam birimi, miktar/tür, zaman, işlem kimliği ve tek kullanımlık nonce kontrol edilir.
6. `src/betleriz/creditApi.ts` içindeki `CREDIT_API` adresini HTTPS `/v1` adresine bağlayın. Genel fikstür adresini de güncelleyin.
7. AdMob Privacy & messaging mesajlarını yapılandırın. UMP izin durumu reklamdan önce yenilenir; gerekirse form gösterilir. `canRequestAds` olmadan reklam yüklenmez. Gizlilik seçeneklerine kredi panelinden ulaşılabilir.

AdMob hesabı, yayıncı/onay işlemleri ve reklam sağlanması bu entegrasyondan ayrıdır. Gerçek SDK/video ve canlı callback testi hâlâ yapılmalıdır.

## Tek sayfa hakkı nasıl korunur?

`full_views` tablosu cüzdan ve yerel gün için tek kayıt tutar. İçerik yalnızca hakkı tüketen `/v1/full-view` isteğiyle döner. Normal tahmin API'si, 60 video tamamlanmış olsa bile kilitli tahminleri açmaz.

Tek kullanımlık sayfanın verisi yalnızca o açık görünümün belleğinde tutulur; yerel diske, geri gezinme geçmişine veya kalıcı açılmış tahminler arasına yazılmaz. Çıkışta silinir. Sunucu geçici sayfa kullanımı için kalıcı `unlocks` kaydı oluşturmaz.

Ağ yanıtının kaybolması halinde aynı sayfa açma isteği bellekteki aynı istek anahtarıyla, teslim onayı gelene kadar en fazla 120 saniye yeniden denenebilir. Bu yeni görüntüleme hakkı değildir. İstemci veri teslimini onayladığında aynı anahtarla da içerik tekrar istenemez. Yeni anahtarla ikinci bir sayfa açmak her durumda reddedilir. Süreç kapanırsa anahtar geri yüklenmez.

Bu, normal uygulamada tek sayfa görüntüleme hakkıdır; ekranda gösterilen bilgilerin kullanıcı tarafından fotoğraflanmasını veya kopyalanmasını teknik olarak engellediği iddia edilmez.

## Cüzdan, saat ve günlük sınır

SQLite sunucudadır. `BEGIN IMMEDIATE` ve benzersiz işlem/nonce kayıtları tekrar ödüllendirmeyi engeller. 11–60. video kayıtları ilerlemeyi artırır, bakiye artırmaz. Tekli açmalar ve tek sayfa hakkı ayrı kayıtlardır. İkinci bir yeni tekli açma aynı gün reddedilir. Tüm erişim sınırları sunucu saatine dayanır.

Kullanıcıya bağlı bir hesap sistemi yerine bu sürüm **cihaza bağlı misafir cüzdanı** kullanır. Bearer token cihazda, hash'i sunucudadır. Yeniden kurulum veya başka telefona geçiş otomatik taşıma sağlamaz. Günlük sınır kişi bazında değil, cüzdan bazındadır. Çok cihazlı hesap/kurtarma için giriş sistemi ayrıca bağlanmalıdır.

Test ve production ayrı veritabanları/token'lar kullanır; test bakiyesi canlı bakiyeye taşınmaz. Mod değişiminden sonra uygulamayı yeniden açın. `BETLERIZ_DATA_DIR` kalıcı, yedekli ve web kökü dışında tutulmalıdır. Yayında saat dilimini değiştirmeyin; mevcut günlük kayıtların tarih anlamı değişir.

Callback'i beklenen oturumlar 30 dakika kota slotu ayırır. Yarım bırakılan reklam slotu serbest bırakılır. Gece yarısından önce tamamlanan fakat sonra doğrulanan video yeni gün için tam sayfa hakkı başlatmaz.

## Diller

Toplam 9 dil: Türkçe, İngilizce, Azerice, Urduca, Hintçe, Tayca, Endonezce, Arapça ve Kürtçe **Kurmancî**. Arapça/Urduca RTL'dir. Soranî dahil değildir. Sağlayıcının takım/lig/tahmin metni ve reklamın kendi dili uygulama tercüme sözlüğünden bağımsızdır.

## Doğrulama ve kalan cihaz testi

- TypeScript kontrolü, 8 özellik testi, 9 dil anahtar/yer tutucu kontrolü.
- `php tests/credits.test.php`: ilk 10 kredi, sonraki 50'de kredi verilmemesi, günlük tekli sınır, tekrar ödül engeli, 59/60 eşiği, tek sayfa tüketimi, ikinci anahtarın reddi, teslim sonrası tekrar reddi ve Kıbrıs gece yarısı.
- PHP 8.3 WebAssembly API isteklerinde auth, 60 tamamlanan video, kilitli içerik, tekli açma sınırı, tek sayfa içeriği, ağ tekrarı ve teslim sonrası erişim sınırı test edildi.
- ECDSA test imzası, değiştirilmiş parametre ve bilinmeyen anahtar kontrolleri çalıştırıldı. Test fixture'ı yalnızca genel anahtar/imza içerir, özel anahtar içermez.
- DOM kontrolünde favori kalıcılığı ve Arapça/Kurmancî dahil dil geçişleri doğrulandı.

**Kalanlar:** Android APK/native reklam SDK derlemesi, gerçek cihazda video/UMP, gerçek Google SSV callback'i ve production sunucusu. iOS reklam köprüsü bu sürümde yoktur.

Resmi kaynaklar:
- https://developers.google.com/admob/android/rewarded
- https://developers.google.com/admob/android/ssv
- https://developers.google.com/admob/android/privacy
- https://developers.google.com/admob/android/quick-start
