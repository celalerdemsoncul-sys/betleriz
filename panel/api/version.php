<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Uygulama sürümünden düşük veya eşit tutun; aksi halde güncelleme zorunlu modalı çıkar.
echo json_encode([
    'success' => true,
    'minimumVersion' => '1.0.0',
], JSON_UNESCAPED_UNICODE);
