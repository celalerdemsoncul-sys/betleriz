<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../libraries/notification_sender.php';

class NotificationApi {
    private $notification;
    
    public function __construct() {
        $this->notification = new Notification();
    }
    
    public function handleRequest() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $this->handlePost();
        } else {
            $this->sendError('Method not allowed', 405);
        }
    }
    
    private function handlePost() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->sendError('Invalid JSON data');
            return;
        }
        
        $action = $input['action'] ?? '';
        
        if ($action === 'send_notification') {
            $this->sendNotification($input);
        } else {
            $this->sendError('Invalid action');
        }
    }
    
    private function sendNotification($data) {
        $title = $data['title'] ?? '';
        $body = $data['body'] ?? '';
        // Service Account kullanıyoruz, app parametresi gerekmiyor
        
        if (empty($title) || empty($body)) {
            $this->sendError('Title and body are required');
            return;
        }
        
        try {
            $message = ['title' => $title, 'body' => $body];
            $result = $this->notification->sendNotificationWithServiceAccount($message);
            
            if ($result['success']) {
                $this->sendResponse([
                    'success' => true,
                    'message' => 'Notification sent successfully',
                    'sent_count' => $result['sent_count'] ?? 0,
                    'failed_count' => $result['failed_count'] ?? 0
                ]);
            } else {
                $this->sendError('Failed to send notification: ' . ($result['error'] ?? 'Unknown error'));
            }
        } catch (Exception $e) {
            $this->sendError('Notification sending error: ' . $e->getMessage());
        }
    }
    
    
    private function sendResponse($data) {
        echo json_encode($data);
        exit();
    }
    
    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit();
    }
}

// API'yi çalıştır
$api = new NotificationApi();
$api->handleRequest();
?>
