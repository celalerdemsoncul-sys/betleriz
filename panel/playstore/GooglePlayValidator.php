<?php

/**
 * Google Play Developer API Validator
 * 
 * Bu sınıf Google Play Developer API kullanarak abonelik doğrulaması yapar.
 * Service Account JSON key dosyası ile JWT token oluşturur ve API'ye istek atar.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Google\Client;
use Google\Service\AndroidPublisher;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class GooglePlayValidator
{
    private $client;
    private $androidPublisher;
    private $packageName;
    private $serviceAccountKey;
    private $accessToken;
    private $accessTokenExpiry;

    public function __construct($packageName, $serviceAccountKeyPath)
    {
        $this->packageName = $packageName;
        $this->serviceAccountKey = $this->loadServiceAccountKey($serviceAccountKeyPath);
        $this->initializeClient();
    }

    /**
     * Service Account JSON key dosyasını yükler
     */
    private function loadServiceAccountKey($keyPath)
    {
        if (!file_exists($keyPath)) {
            throw new Exception("Service Account key file not found: {$keyPath}");
        }

        $keyContent = file_get_contents($keyPath);
        $keyData = json_decode($keyContent, true);

        if (!$keyData) {
            throw new Exception("Invalid Service Account key file format");
        }

        return $keyData;
    }

    /**
     * Google API Client'ı başlatır
     */
    private function initializeClient()
    {
        $this->client = new Client();
        $this->client->setAuthConfig($this->serviceAccountKey);
        $this->client->addScope(AndroidPublisher::ANDROIDPUBLISHER);
        $this->client->setSubject($this->serviceAccountKey['client_email']);
        
        $this->androidPublisher = new AndroidPublisher($this->client);
    }

    /**
     * Access token alır veya yeniler
     */
    private function getAccessToken()
    {
        $now = time();
        
        
        if ($this->accessToken && $this->accessTokenExpiry && $now < $this->accessTokenExpiry - 300) {
            return $this->accessToken;
        }

        
        $this->accessToken = $this->client->fetchAccessTokenWithAssertion();
        
        if (isset($this->accessToken['expires_in'])) {
            $this->accessTokenExpiry = $now + $this->accessToken['expires_in'];
        }

        return $this->accessToken['access_token'];
    }

    /**
     * Abonelik doğrulaması yapar
     * 
     * @param string $subscriptionId Google Play subscription ID (productId)
     * @param string $purchaseToken Google Play purchase token
     * @return array Doğrulama sonucu
     */
    public function verifySubscription($subscriptionId, $purchaseToken)
    {
        try {
            $accessToken = $this->getAccessToken();
            
            
            $url = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{$this->packageName}/purchases/subscriptions/{$subscriptionId}/tokens/{$purchaseToken}";
            
            $headers = [
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json'
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                throw new Exception("cURL Error: {$error}");
            }

            if ($httpCode !== 200) {
                $errorData = json_decode($response, true);
                $errorMessage = $errorData['error']['message'] ?? "HTTP Error: {$httpCode}";
                throw new Exception("Google Play API Error: {$errorMessage}");
            }

            $data = json_decode($response, true);
            
            return $this->parseSubscriptionData($data);

        } catch (Exception $e) {
            throw new Exception("Subscription validation failed: " . $e->getMessage());
        }
    }

    private function parseSubscriptionData($data)
    {
        $result = [
            'success' => false,
            'isActive' => false,
            'expiryDate' => null,
            'autoRenewing' => false,
            'paymentState' => 0
        ];

        $expiryTimeMillis = $data['expiryTimeMillis'] ?? null;
        $autoRenewing = $data['autoRenewing'] ?? false;
        $paymentState = $data['paymentState'] ?? 0;

        if ($expiryTimeMillis) {
            $expiryDate = date('Y-m-d H:i:s', $expiryTimeMillis / 1000);
            $result['expiryDate'] = $expiryDate;
            
            $now = time();
            $expiryTime = $expiryTimeMillis / 1000;
            $result['isActive'] = ($now < $expiryTime) && ($paymentState == 1);
        }

        $result['autoRenewing'] = $autoRenewing;
        $result['paymentState'] = $paymentState;
        $result['success'] = true;

        return $result;
    }

    /**
     * Access token'ın var olduğundan emin ol
     */
    private function ensureAccessToken()
    {
        if (!$this->accessToken) {
            $this->getAccessToken();
        }
    }

    /**
     * Google Play Store'dan aktif abonelikleri getir
     */
    public function getActiveSubscriptions()
    {
        try {
            $this->ensureAccessToken();
            
            
            $subscriptions = $this->androidPublisher->purchases_subscriptions->listPurchases(
                $this->packageName,
                'starter_vip_monthly,premium_vip_monthly' 
            );
            
            $activeSubscriptions = [];
            
            if (isset($subscriptions['subscriptionPurchases'])) {
                foreach ($subscriptions['subscriptionPurchases'] as $purchase) {
                    $productId = $purchase['productId'] ?? '';
                    $expiryTimeMillis = $purchase['expiryTimeMillis'] ?? null;
                    $autoRenewing = $purchase['autoRenewing'] ?? false;
                    $paymentState = $purchase['paymentState'] ?? 0;
                    
                    
                    if ($paymentState == 1 && $expiryTimeMillis) {
                        $expiryDate = date('Y-m-d H:i:s', $expiryTimeMillis / 1000);
                        $now = time();
                        $expiryTime = $expiryTimeMillis / 1000;
                        
                        
                        if ($now < $expiryTime) {
                            $activeSubscriptions[] = [
                                'productId' => $productId,
                                'expiryDate' => $expiryDate,
                                'autoRenewing' => $autoRenewing,
                                'paymentState' => $paymentState,
                                'purchaseToken' => $purchase['purchaseToken'] ?? '',
                                'orderId' => $purchase['orderId'] ?? '',
                                'startTimeMillis' => $purchase['startTimeMillis'] ?? null,
                                'expiryTimeMillis' => $expiryTimeMillis,
                                'rawData' => $purchase
                            ];
                        }
                    }
                }
            }
            
            return $activeSubscriptions;
            
        } catch (Exception $e) {
            throw new Exception('Failed to get active subscriptions: ' . $e->getMessage());
        }
    }

}
