<?php

require_once __DIR__ . '/libraries/Bot.php';

require_once __DIR__ . '/vendor/autoload.php';

$jar = new \GuzzleHttp\Cookie\CookieJar;

$client = new \GuzzleHttp\Client([
    'cookies' => $jar,
    'verify' => false,
    'timeout' => 30,
    'connect_timeout' => 10,
    'headers' => [
        'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-language' => 'en-US,en;q=0.9',
        'accept-encoding' => 'gzip, deflate, br',
        'cache-control' => 'no-cache',
        'pragma' => 'no-cache'
    ]
]);

$bot = new Bot($client, $jar);

// Web arayüzünden mi çalıştırılıyor kontrol et
$isWebRequest = isset($_SERVER['HTTP_HOST']);

if ($isWebRequest) {
    echo "<!DOCTYPE html><html><head><title>Bot Test</title></head><body>";
    echo "<h2>🤖 Bot Test Sonuçları</h2>";
    echo "<div style='font-family: monospace; background: #f5f5f5; padding: 20px; border-radius: 5px;'>";
}

echo "Starting bot collection...\n";
$startTime = microtime(true);

// Bot metodlarını tek tek çalıştır ve sonuçları göster
$methods = [
    'betstudy' => 'BetStudy - Ana Sayfa',
    'betstudyComputer' => 'BetStudy - Computer Predictions',
    'sportytrader' => 'SportyTrader',
    'betstudyPredictions' => 'BetStudy - Predictions',
    'betstudyOverUnder' => 'BetStudy - Over/Under',
    'mybets' => 'MyBets - Ana Sayfa',
    'mybetsUnderOver' => 'MyBets - Under/Over',
    'mybetsCorrectScore' => 'MyBets - Correct Score',
    'mybetsHtFt' => 'MyBets - HT/FT',
    'tipsbetting' => 'TipsBetting',
    'tipsbet' => 'TipsBet',
    'vitibet' => 'VitiBet',
    'bettipsfootball' => 'BetTipsFootball',
    'tipSoccer' => 'TipSoccer'
];

$successCount = 0;
$errorCount = 0;
$totalData = 0;

foreach ($methods as $method => $description) {
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "🔄 Çalıştırılıyor: {$description}\n";
    echo "Method: {$method}\n";
    echo str_repeat("=", 60) . "\n";
    
    $methodStartTime = microtime(true);
    
    try {
        $bot->$method();
        $methodEndTime = microtime(true);
        $methodDuration = round($methodEndTime - $methodStartTime, 2);
        
        // JSON dosyasını kontrol et
        $jsonFile = __DIR__ . '/tips/' . $method . '.json';
        $dataCount = 0;
        
        if (file_exists($jsonFile)) {
            $data = file_get_contents($jsonFile);
            $decodedData = json_decode($data, true);
            $dataCount = is_array($decodedData) ? count($decodedData) : 0;
        }
        
        echo "✅ BAŞARILI - {$dataCount} veri çekildi ({$methodDuration}s)\n";
        $successCount++;
        $totalData += $dataCount;
        
    } catch (Exception $e) {
        $methodEndTime = microtime(true);
        $methodDuration = round($methodEndTime - $methodStartTime, 2);
        
        echo "❌ HATA - {$e->getMessage()} ({$methodDuration}s)\n";
        $errorCount++;
    }
    
    // Botlar arası bekleme
    sleep(2);
}

$endTime = microtime(true);
$executionTime = round($endTime - $startTime, 2);

echo "\n" . str_repeat("=", 60) . "\n";
echo "📊 ÖZET RAPOR\n";
echo str_repeat("=", 60) . "\n";
echo "✅ Başarılı Botlar: {$successCount}\n";
echo "❌ Hatalı Botlar: {$errorCount}\n";
echo "📈 Toplam Veri: {$totalData}\n";
echo "⏱️ Toplam Süre: {$executionTime} saniye\n";
echo str_repeat("=", 60) . "\n";

if ($isWebRequest) {
    echo "</div></body></html>";
}