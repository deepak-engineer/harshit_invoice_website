<?php
require_once 'c:/xampp/htdocs/harshit_invoice_website/invoice_backend/api/db.php';

try {
    $pdo->exec("ALTER TABLE sites DROP COLUMN latitude, DROP COLUMN longitude, DROP COLUMN radius_meters;");
    echo "Sites altered successfully.\n";
} catch (Exception $e) {
    echo "Error on sites: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE attendance DROP COLUMN check_in_lat, DROP COLUMN check_in_lng, DROP COLUMN check_in_acc, DROP COLUMN check_out_lat, DROP COLUMN check_out_lng, DROP COLUMN check_out_acc;");
    echo "Attendance altered successfully.\n";
} catch (Exception $e) {
    echo "Error on attendance: " . $e->getMessage() . "\n";
}
?>
