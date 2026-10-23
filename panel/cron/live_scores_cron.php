<?php
/**
 * Live Scores Cron Job
 * Her dakika çalışır ve live scores'u günceller
 */

require_once __DIR__ . '/../scrapers/live_scores_updater.php';

echo "[" . date('Y-m-d H:i:s') . "] Live Scores Cron Job başlatılıyor...\n";

try {
    $updater = new LiveScoresUpdater();
    $result = $updater->update();
    
    if ($result) {
        echo "[" . date('Y-m-d H:i:s') . "] Live scores başarıyla güncellendi!\n";
    } else {
        echo "[" . date('Y-m-d H:i:s') . "] Live scores güncellenirken hata oluştu!\n";
    }
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] Hata: " . $e->getMessage() . "\n";
}

echo "[" . date('Y-m-d H:i:s') . "] Live Scores Cron Job tamamlandı.\n";
?>
