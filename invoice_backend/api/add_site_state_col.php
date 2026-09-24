<?php
require_once 'db.php';
try {
    $pdo->exec("ALTER TABLE sites ADD COLUMN state VARCHAR(50) DEFAULT NULL");
    echo "Column state added to sites table.";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column state already exists.";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
