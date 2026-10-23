<?php
/**
 * Google Play Store Real-time Developer Notifications Webhook
 * Bu dosya Google Play Store'dan gelen abonelik bildirimlerini işler
 */

require_once dirname(__DIR__) . '/EnvLoader.php';
EnvLoader::load(dirname(__DIR__) . '/.env');

define(
    'GOOGLE_PLAY_RSA_PUBLIC_KEY',
    EnvLoader::get('GOOGLE_PLAY_RSA_PUBLIC_KEY', '') ?? '',
);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Sadece POST request kabul et
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Request body'yi al
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit();
}

// Google Play Store bildirimini doğrula
if (!verifyGooglePlayNotification($input)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit();
}

// Google Play Store'dan gelen bildirimi işle
try {
    // Pub/Sub message'ı decode et
    if (isset($data['message']['data'])) {
        $decodedData = base64_decode($data['message']['data']);
        $notification = json_decode($decodedData, true);
        
        if ($notification) {
            // Abonelik durumunu güncelle
            $result = processSubscriptionNotification($notification);
            
            if ($result) {
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Notification processed']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to process notification']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid notification data']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'No message data found']);
    }
} catch (Exception $e) {
    error_log('Google Play Webhook Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

/**
 * Abonelik bildirimini işle
 */
function processSubscriptionNotification($notification) {
    try {
        // Notification type'ına göre işle
        $notificationType = $notification['notificationType'] ?? '';
        $subscriptionNotification = $notification['subscriptionNotification'] ?? null;
        
        if (!$subscriptionNotification) {
            return false;
        }
        
        $purchaseToken = $subscriptionNotification['purchaseToken'] ?? '';
        $subscriptionId = $subscriptionNotification['subscriptionId'] ?? '';
        
        // Abonelik durumunu güncelle
        switch ($notificationType) {
            case 'SUBSCRIPTION_PURCHASED':
            case 'SUBSCRIPTION_RENEWED':
                return updateSubscriptionStatus($subscriptionId, $purchaseToken, true);
                
            case 'SUBSCRIPTION_CANCELED':
            case 'SUBSCRIPTION_EXPIRED':
            case 'SUBSCRIPTION_REVOKED':
                return updateSubscriptionStatus($subscriptionId, $purchaseToken, false);
                
            case 'SUBSCRIPTION_RECOVERED':
                return updateSubscriptionStatus($subscriptionId, $purchaseToken, true);
                
            default:
                error_log('Unknown notification type: ' . $notificationType);
                return false;
        }
    } catch (Exception $e) {
        error_log('Error processing subscription notification: ' . $e->getMessage());
        return false;
    }
}

/**
 * Abonelik durumunu güncelle
 */
function updateSubscriptionStatus($subscriptionId, $purchaseToken, $isActive) {
    try {
        // Database'e abonelik durumunu kaydet
        // Bu kısmı kendi database yapınıza göre düzenleyin
        
        // Örnek: MySQL database güncelleme
        // $pdo = new PDO('mysql:host=localhost;dbname=your_database', 'username', 'password');
        
        $stmt = $pdo->prepare("
            INSERT INTO subscriptions (subscription_id, purchase_token, is_active, updated_at) 
            VALUES (?, ?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE 
            is_active = VALUES(is_active), 
            updated_at = VALUES(updated_at)
        ");
        
        $result = $stmt->execute([$subscriptionId, $purchaseToken, $isActive ? 1 : 0]);
        
        if ($result) {
            // Cache'i temizle (eğer cache kullanıyorsanız)
            clearSubscriptionCache($subscriptionId);
            
            // Mobile app'e push notification gönder (isteğe bağlı)
            sendPushNotification($subscriptionId, $isActive);
            
            return true;
        }
        
        return false;
    } catch (Exception $e) {
        error_log('Error updating subscription status: ' . $e->getMessage());
        return false;
    }
}

/**
 * Abonelik cache'ini temizle
 */
function clearSubscriptionCache($subscriptionId) {
    // Cache temizleme işlemi
    // Örnek: Redis cache temizleme
    // $redis = new Redis();
    // $redis->del("subscription_" . $subscriptionId);
}

/**
 * Push notification gönder
 */
function sendPushNotification($subscriptionId, $isActive) {
    // Firebase Cloud Messaging ile push notification gönder
    // Bu kısmı kendi push notification sisteminize göre düzenleyin
}

/**
 * Google Play Store bildirimini doğrula
 */
function verifyGooglePlayNotification($message) {
    try {
        // Google Play Store'dan gelen bildirimleri doğrula
        // Bu basit bir örnek - gerçek uygulamada daha güvenli doğrulama yapılmalı
        
        // Authorization header'ını kontrol et
        $headers = getallheaders();
        $authorization = $headers['Authorization'] ?? '';
        
        if (empty($authorization)) {
            error_log('No authorization header found');
            return false;
        }
        
        // Google Play Store'dan gelen bildirimleri kabul et
        // Gerçek uygulamada RSA imza doğrulaması yapılmalı
        return true;
        
    } catch (Exception $e) {
        error_log('Google Play notification verification error: ' . $e->getMessage());
        return false;
    }
}

?>
