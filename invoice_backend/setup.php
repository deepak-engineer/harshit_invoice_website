<?php
// c:\xampp\htdocs\harshit_invoice_website\invoice_backend\api\setup.php

$host = '127.0.0.1';
$db   = 'u698707169_harshit';
$user = 'u698707169_harshit';
$pass = 'c~5XDl;AEwO';
$charset = 'utf8mb4';

echo "<h1>Database Setup</h1>";

// 1. Connect to MySQL without specifying database first
try {
    $pdo = new PDO("mysql:host=$host;charset=$charset", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "Connected to MySQL successfully.<br>";
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// 2. Create Database
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "Database `$db` created or already exists.<br>";
    $pdo->exec("USE `$db`");
} catch (PDOException $e) {
    die("Database creation failed: " . $e->getMessage());
}

// 3. Define Tables
$tables = [
    "admin_users" => "CREATE TABLE IF NOT EXISTS `admin_users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `username` VARCHAR(100) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `session_token` VARCHAR(255) NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "vendors" => "CREATE TABLE IF NOT EXISTS `vendors` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(255),
        `address` TEXT,
        `email` VARCHAR(100),
        `pan_no` VARCHAR(50),
        `bank_holder_name` VARCHAR(255),
        `bank_name` VARCHAR(255),
        `account_no` VARCHAR(100),
        `ifsc_code` VARCHAR(50),
        `bank_address` TEXT,
        `signature_image` LONGTEXT
    )",
    "clients" => "CREATE TABLE IF NOT EXISTS `clients` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `address` TEXT
    )",
    "invoices" => "CREATE TABLE IF NOT EXISTS `invoices` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `invoice_no` VARCHAR(100) NOT NULL UNIQUE,
        `invoice_date` DATE,
        `payment_terms` VARCHAR(255),
        `vendor_id` INT,
        `client_id` INT,
        `project_site_details` TEXT,
        `client_project` VARCHAR(255),
        `site_id` VARCHAR(100),
        `location` VARCHAR(255),
        `amount_in_words` TEXT,
        `total_amount` DECIMAL(12,2),
        `status` ENUM('PENDING', 'ONGOING', 'COMPLETED', 'DRAFT') DEFAULT 'PENDING',
        `terms_conditions` TEXT,
        `signature_image` LONGTEXT,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "invoice_items" => "CREATE TABLE IF NOT EXISTS `invoice_items` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `invoice_id` INT NOT NULL,
        `sr_no` INT,
        `project_site_details` TEXT,
        `client_project` VARCHAR(255),
        `site_id` VARCHAR(100),
        `location` VARCHAR(255),
        `description` TEXT,
        `qty` DECIMAL(10,2),
        `rate` DECIMAL(12,2),
        `amount` DECIMAL(12,2),
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )",
    "sites" => "CREATE TABLE IF NOT EXISTS `sites` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `code` VARCHAR(50) NOT NULL UNIQUE,
        `address` TEXT,
        `operational_status` VARCHAR(50) DEFAULT 'N/A',
        `requirements_note` TEXT,
        `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        `latitude` DECIMAL(10,8) DEFAULT NULL,
        `longitude` DECIMAL(11,8) DEFAULT NULL,
        `geofence_radius` INT DEFAULT 100,
        `city` VARCHAR(100) DEFAULT NULL,
        `dsc_panel_info` TEXT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "teams" => "CREATE TABLE IF NOT EXISTS `teams` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL UNIQUE,
        `site_id` INT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "employees" => "CREATE TABLE IF NOT EXISTS `employees` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `emp_id` VARCHAR(50) NOT NULL UNIQUE,
        `name` VARCHAR(255) NOT NULL,
        `phone` VARCHAR(20) DEFAULT NULL,
        `username` VARCHAR(100) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `daily_salary` DECIMAL(10,2) DEFAULT 0.00,
        `site_id` INT DEFAULT NULL,
        `team_id` INT DEFAULT NULL,
        `photo` LONGTEXT DEFAULT NULL,
        `face_descriptor` JSON DEFAULT NULL,
        `role` ENUM('ADMIN', 'SUPERVISOR', 'TECHNICIAN') DEFAULT 'TECHNICIAN',
        `city` VARCHAR(100) DEFAULT NULL,
        `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING') DEFAULT 'ACTIVE',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    "site_assignments" => "CREATE TABLE IF NOT EXISTS `site_assignments` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `site_id` INT NOT NULL,
        `team_id` INT NOT NULL,
        `technician_id` INT DEFAULT NULL,
        `assigned_by` INT NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (technician_id) REFERENCES employees(id) ON DELETE SET NULL
    )",
    "attendance" => "CREATE TABLE IF NOT EXISTS `attendance` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `employee_id` INT NOT NULL,
        `site_id` INT DEFAULT NULL,
        `attendance_date` DATE NOT NULL,
        `status` ENUM('PRESENT', 'HALF_DAY', 'ABSENT', 'WORKING', 'REJECTED') DEFAULT 'WORKING',
        `check_in_time` DATETIME DEFAULT NULL,
        `check_in_lat` DECIMAL(10,8) DEFAULT NULL,
        `check_in_lng` DECIMAL(11,8) DEFAULT NULL,
        `check_in_acc` DECIMAL(10,2) DEFAULT NULL,
        `check_in_photo` LONGTEXT DEFAULT NULL,
        `check_in_face_score` DECIMAL(5,4) DEFAULT NULL,
        `check_out_time` DATETIME DEFAULT NULL,
        `check_out_lat` DECIMAL(10,8) DEFAULT NULL,
        `check_out_lng` DECIMAL(11,8) DEFAULT NULL,
        `check_out_acc` DECIMAL(10,2) DEFAULT NULL,
        `check_out_photo` LONGTEXT DEFAULT NULL,
        `check_out_face_score` DECIMAL(5,4) DEFAULT NULL,
        `check_in_distance` DECIMAL(10,2) DEFAULT NULL,
        `check_out_distance` DECIMAL(10,2) DEFAULT NULL,
        `geofence_radius` INT DEFAULT NULL,
        `working_minutes` INT DEFAULT 0,
        `daily_salary_snapshot` DECIMAL(10,2) DEFAULT 0.00,
        `earned_salary` DECIMAL(10,2) DEFAULT 0.00,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `unique_attendance` (`employee_id`, `attendance_date`)
    )",
    "audit_logs" => "CREATE TABLE IF NOT EXISTS `audit_logs` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `admin_id` INT NOT NULL,
        `action` VARCHAR(255) NOT NULL,
        `target_type` VARCHAR(50) NOT NULL,
        `target_id` INT DEFAULT NULL,
        `old_value` TEXT DEFAULT NULL,
        `new_value` TEXT DEFAULT NULL,
        `ip_address` VARCHAR(50) DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "checklist_templates" => "CREATE TABLE IF NOT EXISTS `checklist_templates` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `is_active` BOOLEAN DEFAULT TRUE
    )",
    "checklist_items" => "CREATE TABLE IF NOT EXISTS `checklist_items` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `template_id` INT NOT NULL,
        `item_name` VARCHAR(255) NOT NULL,
        FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE
    )",
    "work_orders" => "CREATE TABLE IF NOT EXISTS `work_orders` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `attendance_id` INT NOT NULL,
        `site_id` INT NOT NULL,
        `technician_id` INT NOT NULL,
        `status` ENUM('NOT_STARTED', 'WORKING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'NOT_STARTED',
        `start_time` DATETIME DEFAULT NULL,
        `end_time` DATETIME DEFAULT NULL,
        `supervisor_id` INT DEFAULT NULL,
        `supervisor_remarks` TEXT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        FOREIGN KEY (technician_id) REFERENCES employees(id) ON DELETE CASCADE
    )",
    "work_order_checklist" => "CREATE TABLE IF NOT EXISTS `work_order_checklist` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `work_order_id` INT NOT NULL,
        `item_name` VARCHAR(255) NOT NULL,
        `status` ENUM('PENDING', 'PASSED', 'FAILED', 'NOT_APPLICABLE') DEFAULT 'PENDING',
        `remarks` TEXT DEFAULT NULL,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
    )",
    "work_photos" => "CREATE TABLE IF NOT EXISTS `work_photos` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `work_order_id` INT NOT NULL,
        `checklist_item_id` INT DEFAULT NULL,
        `photo_type` VARCHAR(50) DEFAULT 'GENERAL',
        `photo_url` LONGTEXT NOT NULL,
        `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
    )"
];

foreach ($tables as $name => $sql) {
    try {
        $pdo->exec($sql);
        echo "Table `$name` created or already exists.<br>";
    } catch (PDOException $e) {
        echo "Error creating table `$name`: " . $e->getMessage() . "<br>";
    }
}

// 4. Default Admin User
try {
    $stmt = $pdo->query("SELECT id FROM admin_users WHERE username = 'admin'");
    if (!$stmt->fetch()) {
        $hash = password_hash('admin', PASSWORD_DEFAULT);
        $pdo->exec("INSERT INTO admin_users (username, password_hash) VALUES ('admin', '$hash')");
        echo "Default admin user created (admin / admin).<br>";
    } else {
        echo "Admin user already exists.<br>";
    }
} catch (PDOException $e) {
    echo "Error checking/creating admin user: " . $e->getMessage() . "<br>";
}

// 5. Default Checklist Template (if empty)
try {
    $stmt = $pdo->query("SELECT id FROM checklist_templates WHERE name = 'DSC Panel Standard'");
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO checklist_templates (name, is_active) VALUES ('DSC Panel Standard', 1)");
        $templateId = $pdo->lastInsertId();
        
        $items = [
            'DSC Panel Power', 'PIR Sensor', 'Magnetic Contact / MC', 
            'Glass Break Detector / GBD', 'Seismic Sensor', 'Shutter Sensor',
            'Communication', 'Alarm Test', 'Final Panel Test'
        ];
        
        $insertItem = $pdo->prepare("INSERT INTO checklist_items (template_id, item_name) VALUES (?, ?)");
        foreach ($items as $item) {
            $insertItem->execute([$templateId, $item]);
        }
        echo "Default Checklist Template 'DSC Panel Standard' created.<br>";
    } else {
        echo "Default Checklist Template already exists.<br>";
    }
} catch (PDOException $e) {
    echo "Error inserting checklist items: " . $e->getMessage() . "<br>";
}

echo "<h3>Setup complete!</h3>";
?>
