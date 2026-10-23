<?php

require_once __DIR__ . '/../libraries/NotificationManager.php';

$notificationManager = new NotificationManager();

// Komut satırı veya web'den type parametresini al
$type = $argv[1] ?? $_GET['type'] ?? 'morning';

if ($type === 'morning') {
    $result = $notificationManager->sendMorningNotification();
    $message = "Morning notification sent successfully at " . date('Y-m-d H:i:s');
} elseif ($type === 'evening') {
    $result = $notificationManager->sendEveningNotification();
    $message = "Evening notification sent successfully at " . date('Y-m-d H:i:s');
} else {
    echo "Invalid type parameter. Use 'morning' or 'evening'\n";
    echo "Usage: php send_notifications.php [morning|evening]\n";
    exit;
}

if ($result['success']) {
    echo $message . "\n";
} else {
    echo "Failed to send " . $type . " notification: " . $result['error'] . "\n";
}
