<?php

/**
 * API Base Class
 * 
 * Tüm API endpoint'leri için ortak fonksiyonlar
 */

class ApiBase
{
    protected $config;
    
    public function __construct($config = null)
    {
        // Configuration yükle
        $this->config = $config ?: require __DIR__ . '/../config.php';
        
        // Headers'ı ayarla
        $this->setHeaders();
        $this->handlePreflight();
    }
    
    /**
     * Headers'ı ayarla
     */
    private function setHeaders()
    {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
    
    /**
     * Preflight request'i handle et
     */
    private function handlePreflight()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
    
    /**
     * JSON input al
     */
    protected function getJsonInput()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            throw new Exception('Invalid JSON input');
        }
        return $input;
    }

    /**
     * Required fields kontrolü
     */
    protected function validateRequiredFields(array $input, array $fields)
    {
        foreach ($fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                throw new Exception("Missing required field: {$field}");
            }
        }
    }

    /**
     * Rate limiting uygula (JWT olmadan)
     */
    protected function applyRateLimit($endpoint, $maxRequests = 100)
    {
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $cacheDir = __DIR__ . '/../cache';
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
        $cacheFile = $cacheDir . '/rate_limit_' . md5($clientIp . '_' . $endpoint) . '.json';

        $now = time();
        $requests = [];
        
        if (file_exists($cacheFile)) {
            $requests = json_decode(file_get_contents($cacheFile), true) ?: [];
        }
        
        // 1 saatten eski istekleri temizle
        $requests = array_filter($requests, function($timestamp) use ($now) {
            return ($now - $timestamp) < 3600;
        });
        
        if (count($requests) >= $maxRequests) {
            http_response_code(429);
            echo json_encode([
                'success' => false,
                'error' => 'Rate limit exceeded',
                'code' => 'RATE_LIMIT_EXCEEDED'
            ]);
            exit();
        }
        
        $requests[] = $now;
        file_put_contents($cacheFile, json_encode($requests));
    }

    /**
     * Response gönder
     */
    protected function sendResponse($data, $statusCode = 200)
    {
        http_response_code($statusCode);
        echo json_encode($data);
        exit();
    }

    /**
     * Error response gönder
     */
    protected function sendError($message, $statusCode = 400, $error = null)
    {
        error_log("API Error: " . $message . ($error ? " - " . $error : ""));
        $this->sendResponse([
            'success' => false,
            'error' => $error ?? $message,
            'message' => $message
        ], $statusCode);
    }
    
    /**
     * Log kaydı
     */
    protected function log($message, $level = 'info')
    {
        if ($this->config['debug'] ?? false) {
            $logFile = __DIR__ . '/../logs/api.log';
            $timestamp = date('Y-m-d H:i:s');
            file_put_contents($logFile, "[{$timestamp}] [{$level}] {$message}\n", FILE_APPEND);
        }
    }
}
