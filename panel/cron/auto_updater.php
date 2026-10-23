<?php
/**
 * Otomatik Güncelleme Scripti
 * Her dakika çalışacak cron job
 */

// Sadece CLI'den çalıştırılabilir
if (php_sapi_name() !== 'cli') {
    die('Bu script sadece komut satırından çalıştırılabilir.');
}

require_once __DIR__ . '/../scrapers/live_scores_updater.php';

echo "[" . date('Y-m-d H:i:s') . "] Otomatik güncelleme başlatılıyor...\n";

try {
    $updater = new LiveScoresUpdater();
    $success = $updater->update();
    
    if ($success) {
        echo "[" . date('Y-m-d H:i:s') . "] ✅ Live scores başarıyla güncellendi\n";
    } else {
        echo "[" . date('Y-m-d H:i:s') . "] ❌ Live scores güncellenirken hata oluştu\n";
    }
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] ❌ Hata: " . $e->getMessage() . "\n";
}

echo "[" . date('Y-m-d H:i:s') . "] Otomatik güncelleme tamamlandı\n";
?>
