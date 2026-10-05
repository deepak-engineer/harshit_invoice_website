<?php
$host = '127.0.0.1';
$db   = 'harshit_invoice';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // Add columns to admin_users
    $pdo->exec("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role ENUM('ADMIN', 'SUPERADMIN') DEFAULT 'ADMIN'");
    $pdo->exec("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT 1");
    $pdo->exec("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255) NULL");
    
    // Update existing admin to SUPERADMIN
    $pdo->exec("UPDATE admin_users SET role = 'SUPERADMIN', plain_password = 'admin' WHERE username = 'admin'");
    
    // Add columns to employees
    $pdo->exec("ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT 1");
    $pdo->exec("ALTER TABLE employees ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255) NULL");

    echo "Schema updated successfully!";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
