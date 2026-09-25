<?php
$host = '127.0.0.1';
$db   = 'harshit_invoice';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    $sql = file_get_contents('update_schema.sql');
    $pdo->exec($sql);
    echo "Success\n";
} catch (PDOException $e) {
    echo "PDO Error: " . $e->getMessage() . "\n";
}
