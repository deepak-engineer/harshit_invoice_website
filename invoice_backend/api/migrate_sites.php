<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once 'db.php';
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `employee_sites` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `employee_id` INT NOT NULL,
      `site_id` INT NOT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY `unique_emp_site` (`employee_id`, `site_id`)
    )");

    // migrate existing
    $stmt = $pdo->query("SELECT id, site_id FROM employees WHERE site_id IS NOT NULL");
    $emps = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $ins = $pdo->prepare("INSERT IGNORE INTO employee_sites (employee_id, site_id) VALUES (?, ?)");
    foreach($emps as $emp) {
        $ins->execute([$emp['id'], $emp['site_id']]);
    }
    echo "Migration done";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
