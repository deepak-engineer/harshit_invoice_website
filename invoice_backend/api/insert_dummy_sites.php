<?php
require_once __DIR__ . '/db.php';

$sites = [
    [
        'name' => 'Mumbai Branch Office',
        'code' => 'BOM-001',
        'address' => 'Andheri East, Mumbai',
        'state' => 'Maharashtra',
        'city' => 'Mumbai',
        'operational_status' => 'Pending',
        'requirements_note' => 'Need 2 technicians for DSC panel setup.'
    ],
    [
        'name' => 'Delhi Regional Hub',
        'code' => 'DEL-101',
        'address' => 'Connaught Place, New Delhi',
        'state' => 'Delhi',
        'city' => 'New Delhi',
        'operational_status' => 'N/A',
        'requirements_note' => ''
    ],
    [
        'name' => 'Bangalore Tech Park',
        'code' => 'BLR-202',
        'address' => 'Electronic City, Bangalore',
        'state' => 'Karnataka',
        'city' => 'Bangalore',
        'operational_status' => 'Panel Fault',
        'requirements_note' => 'Alarm test failed.'
    ],
    [
        'name' => 'Chennai Warehousing',
        'code' => 'MAA-303',
        'address' => 'Guindy, Chennai',
        'state' => 'Tamil Nadu',
        'city' => 'Chennai',
        'operational_status' => 'Requirements',
        'requirements_note' => 'Require PIR Sensor replacements.'
    ],
    [
        'name' => 'Pune Operations',
        'code' => 'PNQ-404',
        'address' => 'Hinjewadi, Pune',
        'state' => 'Maharashtra',
        'city' => 'Pune',
        'operational_status' => 'N/A',
        'requirements_note' => ''
    ]
];

$stmt = $pdo->prepare("INSERT INTO sites (name, code, address, state, city, operational_status, requirements_note) VALUES (?, ?, ?, ?, ?, ?, ?)");

$count = 0;
foreach ($sites as $site) {
    try {
        $stmt->execute([
            $site['name'],
            $site['code'],
            $site['address'],
            $site['state'],
            $site['city'],
            $site['operational_status'],
            $site['requirements_note']
        ]);
        $count++;
    } catch (\PDOException $e) {
        if ($e->getCode() == 23000) {
            echo "Site " . $site['code'] . " already exists.\n";
        } else {
            echo "Error inserting " . $site['code'] . ": " . $e->getMessage() . "\n";
        }
    }
}

echo "Successfully inserted $count dummy sites.\n";
?>
