<?php
// c:\Users\Morningstar\Desktop\harshit_invoice_website\backend\setup.php
require_once 'api/db.php';

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vendors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            address TEXT,
            email VARCHAR(255),
            pan_no VARCHAR(100),
            bank_holder_name VARCHAR(255),
            bank_name VARCHAR(255),
            account_no VARCHAR(255),
            ifsc_code VARCHAR(100),
            bank_address TEXT,
            signature_image LONGTEXT
        );

        CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            address TEXT
        );

        CREATE TABLE IF NOT EXISTS invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_no VARCHAR(100) UNIQUE,
            invoice_date DATE,
            payment_terms VARCHAR(255),
            vendor_id INT,
            client_id INT,
            project_site_details TEXT,
            client_project VARCHAR(255),
            site_id VARCHAR(100),
            location TEXT,
            amount_in_words TEXT,
            total_amount DECIMAL(15, 2),
            status VARCHAR(50) DEFAULT 'draft',
            terms_conditions TEXT,
            signature_image LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id),
            FOREIGN KEY (client_id) REFERENCES clients(id)
        );

        CREATE TABLE IF NOT EXISTS invoice_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_id INT,
            sr_no INT,
            description TEXT,
            qty DECIMAL(10, 2),
            rate DECIMAL(15, 2),
            amount DECIMAL(15, 2),
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );
    ");

    // Check if admin user exists, if not create default
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM admin_users");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $username = 'admin';
        $password = password_hash('password123', PASSWORD_BCRYPT);
        $insert = $pdo->prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)");
        $insert->execute([$username, $password]);
        echo "Default admin user created (admin / password123).\n";
    }

    echo "Database setup completed successfully.\n";
} catch (PDOException $e) {
    die("Setup failed: " . $e->getMessage());
}
?>
