<?php
$env_path = __DIR__ . '/../.env';
echo file_exists($env_path) ? file_get_contents($env_path) : 'No .env';
