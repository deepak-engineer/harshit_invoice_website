<?php
// c:\Users\Morningstar\Desktop\harshit_invoice_website\backend\api\db.php
$host = '127.0.0.1';
$db   = 'u698707169_harshit';
$user = 'u698707169_harshit';
$pass = 'c~5XDl;AEwO';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // For API responses, return JSON error
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit;
}
?>
