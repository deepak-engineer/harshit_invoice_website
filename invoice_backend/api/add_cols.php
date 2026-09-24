<?php
require_once 'c:/xampp/htdocs/harshit_invoice_website/invoice_backend/api/db.php';

try {
    $pdo->exec("ALTER TABLE attendance 
        ADD COLUMN check_in_lat DECIMAL(10,8) DEFAULT NULL AFTER check_in_time,
        ADD COLUMN check_in_lng DECIMAL(11,8) DEFAULT NULL AFTER check_in_lat,
        ADD COLUMN check_in_acc DECIMAL(10,2) DEFAULT NULL AFTER check_in_lng,
        ADD COLUMN check_out_lat DECIMAL(10,8) DEFAULT NULL AFTER check_out_time,
        ADD COLUMN check_out_lng DECIMAL(11,8) DEFAULT NULL AFTER check_out_lat,
        ADD COLUMN check_out_acc DECIMAL(10,2) DEFAULT NULL AFTER check_out_lng;
    ");
    echo "Attendance location columns added successfully.\n";
} catch (Exception $e) {
    echo "Error on attendance: " . $e->getMessage() . "\n";
}
?>
