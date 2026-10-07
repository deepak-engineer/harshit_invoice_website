<?php
require_once __DIR__ . '/db.php';
echo "getenv: " . getenv('RESEND_API_KEY') . "\n";
echo "_ENV keys: " . implode(', ', array_keys($_ENV)) . "\n";
foreach ($_ENV as $k => $v) {
    if (strpos($k, 'RESEND') !== false) {
        echo "Found key: '$k' = '$v'\n";
    }
}
