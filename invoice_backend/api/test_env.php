<?php
require_once __DIR__ . '/db.php';
echo "getenv: " . getenv('RESEND_API_KEY') . "\n";
echo "_ENV: " . ($_ENV['RESEND_API_KEY'] ?? 'not set') . "\n";
