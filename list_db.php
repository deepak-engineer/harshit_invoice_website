<?php
$host = '127.0.0.1';
$db   = 'harshit_invoice';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $stmt = $pdo->query("SELECT * FROM security_equipment_master WHERE id > 26");
    print_r($stmt->fetchAll());
} catch (\PDOException $e) {}
?>
