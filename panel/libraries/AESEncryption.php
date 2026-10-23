<?php

class AESEncryption {
    private static $key = 'SuperBettingTips2024!@#AES256Key'; // 32 byte key for AES-256
    private static $method = 'AES-256-CBC';
    
    /**
     * Encrypt data using AES-256-CBC
     * @param string $data Data to encrypt
     * @return array Array containing encrypted data and IV
     */
    public static function encrypt($data) {
        $iv = openssl_random_pseudo_bytes(16); // 16 bytes IV for AES-256-CBC
        $encrypted = openssl_encrypt($data, self::$method, self::$key, OPENSSL_RAW_DATA, $iv);
        
        if ($encrypted === false) {
            throw new Exception('Encryption failed');
        }
        
        return [
            'data' => base64_encode($encrypted),
            'iv' => base64_encode($iv)
        ];
    }
    
    /**
     * Decrypt data using AES-256-CBC
     * @param string $encryptedData Base64 encoded encrypted data
     * @param string $iv Base64 encoded IV
     * @return string Decrypted data
     */
    public static function decrypt($encryptedData, $iv) {
        $encrypted = base64_decode($encryptedData);
        $iv = base64_decode($iv);
        
        $decrypted = openssl_decrypt($encrypted, self::$method, self::$key, OPENSSL_RAW_DATA, $iv);
        
        if ($decrypted === false) {
            throw new Exception('Decryption failed');
        }
        
        return $decrypted;
    }
    
    /**
     * Encrypt and return as single encrypted string (data + iv combined)
     * @param string $data Data to encrypt
     * @return string Combined encrypted data and IV
     */
    public static function encryptToString($data) {
        $encrypted = self::encrypt($data);
        return base64_encode(json_encode($encrypted));
    }
    
    /**
     * Decrypt from single encrypted string
     * @param string $encryptedString Combined encrypted data and IV
     * @return string Decrypted data
     */
    public static function decryptFromString($encryptedString) {
        $encryptedData = json_decode(base64_decode($encryptedString), true);
        
        if (!$encryptedData || !isset($encryptedData['data']) || !isset($encryptedData['iv'])) {
            throw new Exception('Invalid encrypted data format');
        }
        
        return self::decrypt($encryptedData['data'], $encryptedData['iv']);
    }
}

?>
