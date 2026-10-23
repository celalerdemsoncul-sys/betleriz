<?php

require_once dirname(__DIR__, 2) . '/EnvLoader.php';

class Notification
{
    /** @var array<string, mixed> */
    private array $serviceAccount;

    public function __construct()
    {
        EnvLoader::load(dirname(__DIR__, 2) . '/.env');
        $path = EnvLoader::path(
            'FIREBASE_SERVICE_ACCOUNT_JSON',
            'panel/configs/google-play-service-account.json',
        );
        $json = file_get_contents($path);
        if ($json === false) {
            throw new RuntimeException('Firebase service account dosyası okunamadı: ' . $path);
        }
        $account = json_decode($json, true);
        if (!is_array($account)) {
            throw new RuntimeException('Geçersiz Firebase service account JSON: ' . $path);
        }
        $this->serviceAccount = $account;
    }

    public function sendNotificationWithServiceAccount($notification)
    {
        try {
            $accessToken = $this->getAccessToken();
            
            $arrayToSend = array(
                'message' => array(
                    'topic' => 'notification',
                    'notification' => $notification,
                    'android' => array(
                        'priority' => 'high',
                        'notification' => array(
                            'sound' => 'default'
                        )
                    )
                )
            );

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://fcm.googleapis.com/v1/projects/super-betting-tips-13cc7/messages:send');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json'
            ));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($arrayToSend));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200) {
                return ['success' => true, 'response' => $response];
            } else {
                return ['success' => false, 'error' => 'HTTP ' . $httpCode];
            }
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function getAccessToken()
    {
        $now = time();
        $jwt = $this->createJWT($now);
        
        $postData = array(
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        );

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);
        return $data['access_token'] ?? '';
    }

    private function createJWT($now)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'RS256']);
        $payload = json_encode([
            'iss' => $this->serviceAccount['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => $this->serviceAccount['token_uri'],
            'iat' => $now,
            'exp' => $now + 3600
        ]);

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = '';
        openssl_sign($base64Header . '.' . $base64Payload, $signature, $this->serviceAccount['private_key'], 'SHA256');
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
    }
}