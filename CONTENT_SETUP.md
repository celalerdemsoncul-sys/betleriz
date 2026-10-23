# Betleriz: merkezi uygulama bilgileri

Yerel backend: `./START_API.command`

- Yönetim ekranı: http://127.0.0.1:8002/admin
- Uygulama yapılandırması: http://127.0.0.1:8002/api/app-config.php?lang=tr
- Sayfalar: http://127.0.0.1:8002/api/pages.php?lang=tr
- Tek sayfa: http://127.0.0.1:8002/api/pages.php?action=content&page_id=cookie-policy&lang=tr
- Tarayıcı: http://127.0.0.1:8002/pages/cookie-policy?lang=tr

Gizlilik, kullanım ve çerez sayfalarının dokuz dildeki metinleri ile Android/iOS mağaza adresleri `server/content/app.json` dosyasında tutulur. Panelde yapılan kayıtlar bu dosyaya atomik olarak yazılır. Dosyayı ve özel kredi veritabanını yedekleyin. Aynı anda eski içerikle kaydetme reddedilir.

Uygulamada Ayarlar > Uygulama ve Bilgiler. Ekran açılışında, dil değişiminde, uygulamaya dönüşte veya Bilgileri yenile düğmesiyle sunucudan yeniden okunur. Sayfa içerikleri API'den gelir; uygulamaya sabit yasal metin gömülmez. Taslaklar açıkça etiketlenir. Varsayılan mağaza durumu Yakında; sahte mağaza adresi ve destek e-postası kullanılmaz.

Yönetim yalnızca localhost + loopback IP ile çalışır. Oturum, CSRF token, Origin ve Host kontrolü içerir. İnternete yönetim panelini açmak için ayrı kimlik doğrulama ve HTTPS gereklidir; bu yerel panel uzaktan yönetim sağlamaz. Özel içerik dosyası sunucu web kökünün dışındadır. Sayfa içerikleri HTML olarak çalıştırılmaz.

Tarayıcıya açılan sayfalar da aynı kaynağı okur. `/privacy-policy.html`, `/privacy-policy`, `/terms-of-service` ve `/cookie-policy` eski bağlantıları desteklenir. Çerez sayfası, çerez rıza yönetiminin kendisi değildir. Metinler taslaktır; canlı kullanım öncesi işletmeci, iletişim ve fiilî veri işleme bilgileri tamamlanmalıdır.

Üretimde `src/betleriz/config.ts` içindeki PUBLIC_API_BASE değerini HTTPS backend adresiyle değiştirin. Mağaza adresi ve sayfa düzenlemesi sonrasında yeni uygulama sürümü gerekmez; backend adresi değişikliği için yeni derleme gerekir.

Güncel sürüm: 1.3.2 (Android versionCode 6). Metro portu 8082. Dosya izleme sınırı varsa START_PREVIEW.command ile izleme olmadan çalıştırın. Emülatörde geliştirme sunucusu localhost:8082 olarak ayarlanmıştır; adb reverse tcp:8082 tcp:8082 gerekir. Bu yalnızca geliştirme önizlemesini etkiler.
