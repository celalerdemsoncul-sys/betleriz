<?php
require_once __DIR__ . '/../libraries/AESEncryption.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$cardType = $_GET['cardType'] ?? '';
$date = $_GET['date'] ?? 'today';

$dateFiles = [
    'yesterday' => 'bettingtips_yesterday.json',
    'today' => 'bettingtips_today.json',
    'tomorrow' => 'bettingtips_tomorrow.json',
    'after-tomorrow' => 'bettingtips_after-tomorrow.json'
];

$sportFiles = [
    'basketball' => [
        'yesterday' => 'basketball_yesterday.json',
        'today' => 'basketball_today.json',
        'tomorrow' => 'basketball_tomorrow.json',
        'after-tomorrow' => 'basketball_after-tomorrow.json'
    ],
    'tennis' => [
        'yesterday' => 'tennis_yesterday.json',
        'today' => 'tennis_today.json',
        'tomorrow' => 'tennis_tomorrow.json',
        'after-tomorrow' => 'tennis_after-tomorrow.json'
    ]
];

$validCardTypes = [
    'daily-sure', 'football', 'over-under', 'single', 'daily-odds',
    'bonus', 'basketball', 'tennis', 'special', 'fixed',
    'correct-score', 'ht-ft', 'multi-50', 'multi-10', 'single-vip', 'mixed'
];

if (!$cardType || !in_array($cardType, $validCardTypes)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid cardType',
        'message' => 'Invalid cardType'
    ]);
    exit();
}

if (!isset($dateFiles[$date])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid date',
        'message' => 'Invalid date'
    ]);
    exit();
}

if ($cardType === 'basketball' || $cardType === 'tennis') {
    $filename = $sportFiles[$cardType][$date];
} else {
    $filename = $dateFiles[$date];
}

$filepath = __DIR__ . '/../tips/' . $filename;

if (!file_exists($filepath)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Data file not found',
        'message' => 'Data file not found'
    ]);
    exit();
}

$data = json_decode(file_get_contents($filepath), true);

if (!$data || !is_array($data)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid data format',
        'message' => 'Invalid data format'
    ]);
    exit();
}

$filteredData = [];

foreach ($data as $item) {
    if (!isset($item['predictions'])) {
        continue;
    }
    
    $filteredPrediction = findFilteredPrediction($item['predictions'], $cardType);
    
    if ($filteredPrediction) {
        $item['filteredPrediction'] = $filteredPrediction;
        $filteredData[] = $item;
    }
}

$responseData = [
    'success' => true,
    'message' => 'Tips data retrieved successfully',
    'data' => [
        'data' => $filteredData,
        'total' => count($filteredData),
        'cardType' => $cardType,
        'date' => $date
    ]
];

try {
    $jsonString = json_encode($responseData);
    $encryptedData = AESEncryption::encryptToString($jsonString);
    
    echo $encryptedData;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Encryption failed',
        'message' => 'Failed to encrypt data: ' . $e->getMessage()
    ]);
}

function findFilteredPrediction($predictions, $cardType) {
    foreach ($predictions as $predictionType => $prediction) {
        if (isset($prediction['cardType'])) {
            $predictionCardTypes = $prediction['cardType'];
            
            if (is_string($predictionCardTypes)) {
                if ($predictionCardTypes === $cardType) {
                    return [
                        'type' => $prediction['type'],
                        'prediction' => $prediction['prediction'],
                        'percentage' => $prediction['percentage'],
                        'cardType' => $predictionCardTypes
                    ];
                }
            }
            
            if (is_array($predictionCardTypes)) {
                if (in_array($cardType, $predictionCardTypes)) {
                    return [
                        'type' => $prediction['type'],
                        'prediction' => $prediction['prediction'],
                        'percentage' => $prediction['percentage'],
                        'cardType' => $predictionCardTypes
                    ];
                }
            }
        }
    }
    
    return null;
}
?>