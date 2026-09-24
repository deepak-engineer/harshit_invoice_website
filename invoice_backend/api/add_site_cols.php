<?php
require_once 'c:/xampp/htdocs/harshit_invoice_website/invoice_backend/api/db.php';

try {
    $pdo->exec("ALTER TABLE sites 
        ADD COLUMN operational_status VARCHAR(50) DEFAULT 'N/A' AFTER address,
        ADD COLUMN requirements_note TEXT DEFAULT NULL AFTER operational_status;
    ");
    echo "Sites columns added successfully.\n";
} catch (Exception $e) {
    echo "Error on sites: " . $e->getMessage() . "\n";
}
?>
