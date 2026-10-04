<?php
require_once 'db.php';

$sql = "
CREATE TABLE IF NOT EXISTS `security_equipment_master` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS `security_forms` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_code` VARCHAR(100) NOT NULL,
    `address` TEXT,
    `state` VARCHAR(100) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ensure state, uuid and section_configs columns exist if table was already created
ALTER TABLE `security_forms` ADD COLUMN IF NOT EXISTS `state` VARCHAR(100) DEFAULT NULL AFTER `address`;
ALTER TABLE `security_forms` ADD COLUMN IF NOT EXISTS `uuid` VARCHAR(36) UNIQUE AFTER `id`;
ALTER TABLE `security_forms` ADD COLUMN IF NOT EXISTS `section_configs` JSON DEFAULT NULL AFTER `state`;

-- Populate uuid for existing rows
UPDATE `security_forms` SET `uuid` = UUID() WHERE `uuid` IS NULL;

CREATE TABLE IF NOT EXISTS `security_form_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `form_id` INT NOT NULL,
    `item_type` ENUM('SECTION', 'REQUIREMENT', 'INSTALLATION') NOT NULL,
    `section_name` VARCHAR(100) DEFAULT NULL,
    `equipment_id` INT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (form_id) REFERENCES security_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES security_equipment_master(id) ON DELETE CASCADE
);
";

try {
    $pdo->exec($sql);
    echo "Tables created successfully.\n";

    // Insert master equipment
    $equipments = [
        'Camera',
        'Shutter',
        'M.S Main Door',
        'Hotter DSC',
        'Hotter Fire',
        'M.S',
        'Shutter Removal',
        'PIR',
        'G.B.D',
        'Sesmic',
        'Panic',
        'S.D',
        'M.S Bank to ATM',
        '2 Way',
        'R.I',
        'Fire Panel',
        'Fire Battery',
        'MCB',
        'V.D',
        'EM Lock',
        'Push Button',
        'Keypad',
        'DSC Panel',
        'DSC Battery',
        'E.M Lock',
        'M.S Door'
    ];

    $stmt = $pdo->prepare("INSERT IGNORE INTO security_equipment_master (name) VALUES (?)");
    foreach ($equipments as $eq) {
        $stmt->execute([$eq]);
    }
    echo "Equipment inserted successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
