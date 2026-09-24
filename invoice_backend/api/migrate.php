<?php
require_once 'db.php';

header('Content-Type: text/plain');

try {
    $sql = file_get_contents('schema.sql');
    if (!$sql) {
        throw new Exception("schema.sql not found or empty");
    }

    $pdo->exec($sql);
    echo "Database migrated successfully.\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
