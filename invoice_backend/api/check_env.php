<?php
$env_path = __DIR__ . '/../.env';
$env_contents = file_exists($env_path) ? file_get_contents($env_path) : 'No .env file';
echo "getenv: " . getenv('RESEND_API_KEY') . "\n\n";
echo "env file contents:\n" . $env_contents;
