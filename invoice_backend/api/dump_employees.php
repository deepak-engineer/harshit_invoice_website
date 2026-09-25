<?php
require_once 'db.php';
$stmt = $pdo->query("SELECT id, emp_id, name, city FROM employees ORDER BY id DESC LIMIT 10");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows);
?>
