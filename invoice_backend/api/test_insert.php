<?php
require_once 'db.php';

try {
    $stmt = $pdo->prepare("INSERT INTO employees (emp_id, name, phone, username, password_hash, daily_salary, site_id, team_id, photo, status, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute(['TEST-999', 'Test Employee', '1234567890', 'test_emp_999', 'hash', '500.00', null, null, null, 'ACTIVE', 'Gujarat']);
    echo "Success!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
