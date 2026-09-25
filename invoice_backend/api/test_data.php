<?php
// c:\xampp\htdocs\harshit_invoice_website\invoice_backend\api\test_data.php
require_once 'db.php';

try {
    $pdo->beginTransaction();

    // Sites
    $pdo->exec("INSERT INTO sites (name, code, city, latitude, longitude) VALUES ('Ahmedabad Branch', 'S-GUJ-01', 'Gujarat', 23.0225, 72.5714) ON DUPLICATE KEY UPDATE city='Gujarat'");
    $guj_site_id = $pdo->lastInsertId();
    if (!$guj_site_id) {
        $stmt = $pdo->query("SELECT id FROM sites WHERE code='S-GUJ-01'");
        $guj_site_id = $stmt->fetchColumn();
    }

    $pdo->exec("INSERT INTO sites (name, code, city, latitude, longitude) VALUES ('Ludhiana Branch', 'S-PUN-01', 'Punjab', 30.9010, 75.8573) ON DUPLICATE KEY UPDATE city='Punjab'");
    $pun_site_id = $pdo->lastInsertId();
    if (!$pun_site_id) {
        $stmt = $pdo->query("SELECT id FROM sites WHERE code='S-PUN-01'");
        $pun_site_id = $stmt->fetchColumn();
    }

    // Teams
    $pdo->exec("INSERT IGNORE INTO teams (name, site_id) VALUES ('Gujarat Alpha Team', $guj_site_id)");
    $pdo->exec("INSERT IGNORE INTO teams (name, site_id) VALUES ('Punjab Bravo Team', $pun_site_id)");
    
    $stmt = $pdo->query("SELECT id FROM teams WHERE name='Gujarat Alpha Team'");
    $guj_team_id = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT id FROM teams WHERE name='Punjab Bravo Team'");
    $pun_team_id = $stmt->fetchColumn();

    // Employees
    $hash = password_hash('password123', PASSWORD_DEFAULT);
    
    $pdo->exec("INSERT IGNORE INTO employees (emp_id, name, username, password_hash, city, team_id, site_id) VALUES ('EMP-G01', 'Rahul Patel', 'rahul_patel', '$hash', 'Gujarat', $guj_team_id, $guj_site_id)");
    $stmt = $pdo->query("SELECT id FROM employees WHERE emp_id='EMP-G01'");
    $guj_emp_id = $stmt->fetchColumn();

    $pdo->exec("INSERT IGNORE INTO employees (emp_id, name, username, password_hash, city, team_id, site_id) VALUES ('EMP-P01', 'Gurpreet Singh', 'gurpreet_singh', '$hash', 'Punjab', $pun_team_id, $pun_site_id)");
    $stmt = $pdo->query("SELECT id FROM employees WHERE emp_id='EMP-P01'");
    $pun_emp_id = $stmt->fetchColumn();

    // Attendance
    $today = date('Y-m-d');
    $pdo->exec("INSERT IGNORE INTO attendance (employee_id, site_id, attendance_date, status, check_in_time) VALUES ($guj_emp_id, $guj_site_id, '$today', 'PRESENT', NOW())");
    $pdo->exec("INSERT IGNORE INTO attendance (employee_id, site_id, attendance_date, status, check_in_time) VALUES ($pun_emp_id, $pun_site_id, '$today', 'PRESENT', NOW())");

    $pdo->commit();
    echo "<h1>Test data created successfully!</h1>";
    echo "Added sites, teams, employees and attendance records for Gujarat and Punjab.";
} catch (Exception $e) {
    $pdo->rollBack();
    echo "Error: " . $e->getMessage();
}
?>
