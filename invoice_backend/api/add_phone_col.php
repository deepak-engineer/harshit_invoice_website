<?php
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE employees ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER name");
    echo "Phone column added successfully";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
