<?php
// Environment variables for Resend
putenv('RESEND_API_KEY=your_resend_api_key_here');
putenv('RESEND_FROM_EMAIL=noreply@yourdomain.com');

// c:\Users\Morningstar\Desktop\harshit_invoice_website\backend\api\db.php
$host = 'localhost';
$db   = 'u698707169_harshit';
$user = 'u698707169_harshit';
$pass = '9=8GhB~8XqF';
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
