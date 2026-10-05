<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once 'db.php';
try {
    $username = 'superadmin';
    $password = 'superadmin123';
    
    $stmt = $pdo->prepare("SELECT id, password_hash, is_super_admin, is_active FROM admin_users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if ($user && (password_verify($password, $user['password_hash']) || $password === $user['password_hash'])) {
        echo "Login Success!";
    } else {
        echo "Invalid credentials or user not found.";
        if (!$user) {
            echo " User not found in DB.";
        }
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage();
}
?>
