<?php
require 'db.php';
try {
    $pdo->exec('ALTER TABLE teams ADD COLUMN state VARCHAR(100) DEFAULT NULL');
    echo 'done';
} catch (Exception $e) {
    echo $e->getMessage();
}
