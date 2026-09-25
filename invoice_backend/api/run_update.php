<?php
require_once 'db.php';

try {
    $sql = file_get_contents('update_schema.sql');
    if (!$sql) {
        die("Failed to read update_schema.sql");
    }
    
    // Split the SQL into individual queries to execute them one by one if pdo->exec fails on multiple statements
    $pdo->exec($sql);
    
    echo "<h1>Database Schema Updated Successfully!</h1>";
} catch (PDOException $e) {
    echo "<h1>PDO Error</h1><p>" . $e->getMessage() . "</p>";
}
?>
