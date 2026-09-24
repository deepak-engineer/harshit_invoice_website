<?php
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE employees MODIFY COLUMN status ENUM('ACTIVE', 'INACTIVE', 'PENDING') DEFAULT 'PENDING'");
    echo "Status enum modified successfully";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
