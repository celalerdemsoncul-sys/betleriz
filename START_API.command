#!/bin/bash
set -e
cd "$(dirname "$0")"
if ! command -v php >/dev/null 2>&1; then
 echo 'PHP 8+ bulunamadı. PHP kurulduktan sonra bu dosyayı yeniden açın.'
 exit 1
fi
php -r 'if (!extension_loaded("pdo_sqlite") || !extension_loaded("openssl")) {fwrite(STDERR, "PDO_SQLite ve OpenSSL uzantıları gerekiyor.\n"); exit(1);}'
php -S 127.0.0.1:8002 -t server/public server/router.php
