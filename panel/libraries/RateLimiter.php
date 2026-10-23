<?php

class RateLimiter
{
    private $storageDir;
    
    public function __construct()
    {
        $this->storageDir = __DIR__ . '/../storage/rate_limits';
        
        // Storage dizinini oluştur
        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0755, true);
        }
    }
    
    /**
     * Rate limit kontrolü yapar
     * 
     * @param string $key Benzersiz anahtar (örn: IP adresi)
     * @param int $maxRequests Maksimum istek sayısı
     * @param int $timeWindow Zaman penceresi (saniye)
     * @return bool İzin verilip verilmediği
     */
    public function isAllowed(string $key, int $maxRequests, int $timeWindow): bool
    {
        $filePath = $this->storageDir . '/' . md5($key) . '.json';
        $currentTime = time();
        
        // Mevcut veriyi oku
        $data = [];
        if (file_exists($filePath)) {
            $content = file_get_contents($filePath);
            $data = json_decode($content, true) ?: [];
        }
        
        // Eski kayıtları temizle
        $data = array_filter($data, function($timestamp) use ($currentTime, $timeWindow) {
            return ($currentTime - $timestamp) < $timeWindow;
        });
        
        // Yeni isteği ekle
        $data[] = $currentTime;
        
        // Veriyi kaydet
        file_put_contents($filePath, json_encode($data));
        
        // Limit kontrolü
        return count($data) <= $maxRequests;
    }
    
    /**
     * Belirli bir anahtar için kalan istek sayısını döner
     * 
     * @param string $key
     * @param int $maxRequests
     * @param int $timeWindow
     * @return int
     */
    public function getRemainingRequests(string $key, int $maxRequests, int $timeWindow): int
    {
        $filePath = $this->storageDir . '/' . md5($key) . '.json';
        $currentTime = time();
        
        if (!file_exists($filePath)) {
            return $maxRequests;
        }
        
        $content = file_get_contents($filePath);
        $data = json_decode($content, true) ?: [];
        
        // Eski kayıtları temizle
        $data = array_filter($data, function($timestamp) use ($currentTime, $timeWindow) {
            return ($currentTime - $timestamp) < $timeWindow;
        });
        
        return max(0, $maxRequests - count($data));
    }
    
    /**
     * Belirli bir anahtar için reset time'ı döner
     * 
     * @param string $key
     * @param int $timeWindow
     * @return int
     */
    public function getResetTime(string $key, int $timeWindow): int
    {
        $filePath = $this->storageDir . '/' . md5($key) . '.json';
        
        if (!file_exists($filePath)) {
            return time() + $timeWindow;
        }
        
        $content = file_get_contents($filePath);
        $data = json_decode($content, true) ?: [];
        
        if (empty($data)) {
            return time() + $timeWindow;
        }
        
        $oldestRequest = min($data);
        return $oldestRequest + $timeWindow;
    }
}