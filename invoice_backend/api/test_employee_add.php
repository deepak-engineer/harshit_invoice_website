<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'db.php';
require_once 'attendance_helper.php';

$data = [
    'emp_id' => 'EMP-TEST-'.rand(1000,9999),
    'name' => 'Test Employee',
    'phone' => '9999999999',
    'username' => 'test_'.rand(1000,9999),
    'password' => '123456',
    'daily_salary' => '500',
    'site_id' => '',
    'team_id' => '',
    'photo' => '',
    'status' => 'ACTIVE',
    'state' => 'Haryana'
];

echo "<pre>";
try {
    $hash = password_hash($data['password'] ?? '', PASSWORD_DEFAULT);
    $photo_filename = null;
    if (!empty($data['photo']) && strpos($data['photo'], 'data:image') === 0) {
        $photo_filename = processBase64Image($data['photo'], '../uploads/employees/');
    }
    
    $daily_salary = empty($data['daily_salary']) ? 0.00 : (float)$data['daily_salary'];
    $site_id = empty($data['site_id']) ? null : $data['site_id'];
    $team_id = empty($data['team_id']) ? null : $data['team_id'];
    
    $stmt = $pdo->prepare("INSERT INTO employees (emp_id, name, phone, username, password_hash, daily_salary, site_id, team_id, photo, status, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$data['emp_id'], $data['name'], $data['phone'] ?? null, $data['username'], $hash, $daily_salary, $site_id, $team_id, $photo_filename, $data['status'] ?? 'ACTIVE', $data['state'] ?? null]);
    echo "Success! ID: " . $pdo->lastInsertId();
} catch(\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
echo "</pre>";
?>
