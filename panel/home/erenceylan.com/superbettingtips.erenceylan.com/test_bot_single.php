<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/libraries/Bot.php';
require_once __DIR__ . '/vendor/autoload.php';

$input = json_decode(file_get_contents('php://input'), true);
$method = $input['method'] ?? '';

if (empty($method)) {
    echo json_encode(['success' => false, 'error' => 'Method belirtilmedi']);
    exit;
}

try {
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
    
    // Bot metodunu çalıştır
    $startTime = microtime(true);
    $bot->$method();
    $endTime = microtime(true);
    $duration = round($endTime - $startTime, 2);
    
    // JSON dosyasını oku ve veri sayısını kontrol et
    $jsonFile = __DIR__ . '/tips/' . $method . '.json';
    $dataCount = 0;
    
    if (file_exists($jsonFile)) {
        $data = file_get_contents($jsonFile);
        $decodedData = json_decode($data, true);
        $dataCount = is_array($decodedData) ? count($decodedData) : 0;
    }
    
    echo json_encode([
        'success' => true,
        'dataCount' => $dataCount,
        'duration' => $duration,
        'method' => $method
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'method' => $method
    ]);
}
?>
