CREATE TABLE IF NOT EXISTS `employees` (
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
  `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `sites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `address` TEXT,
  `operational_status` VARCHAR(50) DEFAULT 'N/A',
  `requirements_note` TEXT DEFAULT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `teams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `site_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `attendance` (
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
  
  `working_minutes` INT DEFAULT 0,
  `daily_salary_snapshot` DECIMAL(10,2) DEFAULT 0.00,
  `earned_salary` DECIMAL(10,2) DEFAULT 0.00,
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY `unique_attendance` (`employee_id`, `attendance_date`)
);

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `target_type` VARCHAR(50) NOT NULL,
  `target_id` INT DEFAULT NULL,
  `old_value` TEXT DEFAULT NULL,
  `new_value` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
