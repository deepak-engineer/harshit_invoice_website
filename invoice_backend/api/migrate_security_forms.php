<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE `security_forms` ADD COLUMN IF NOT EXISTS `employee_id` INT DEFAULT NULL AFTER `id`");
    // Optionally add foreign key
    // $pdo->exec("ALTER TABLE `security_forms` ADD FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL");
    echo "Migration done";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
