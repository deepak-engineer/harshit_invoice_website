<?php
// c:\Users\Morningstar\Desktop\harshit_invoice_website\backend\api\index.php

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

require_once 'db.php';
require_once 'auth.php';
require_once 'attendance_helper.php';

// OTP/Email Schema Migrations
try { $pdo->exec("ALTER TABLE employees ADD COLUMN email VARCHAR(255) NULL UNIQUE"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE employees ADD COLUMN email_verified BOOLEAN DEFAULT 0"); } catch (Exception $e) {}
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS email_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at DATETIME NULL
    )");
} catch (Exception $e) {}


$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$route = '';
if (preg_match('/\/api\/(.*)$/', $path, $matches)) {
    $route = $matches[1];
}

$method = $_SERVER['REQUEST_METHOD'];

// Route handling
if ($route === 'login' && $method === 'POST') {
    checkBruteForce();
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'employee'; // default to employee if not provided
    
    $user = null;
    if ($role === 'admin') {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");
        } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE admin_users ADD COLUMN is_super_admin TINYINT(1) DEFAULT 0"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE admin_users ADD COLUMN plain_password VARCHAR(255) NULL"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT 1"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE employees ADD COLUMN plain_password VARCHAR(255) NULL"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE employees ADD COLUMN is_active BOOLEAN DEFAULT 1"); } catch (Exception $e) {}

        
        try {
            $stmt = $pdo->query("SELECT id FROM admin_users WHERE is_super_admin = 1");
            if (!$stmt->fetch()) {
                $hash = password_hash('superadmin123', PASSWORD_DEFAULT);
                $pdo->prepare("INSERT INTO admin_users (username, password_hash, plain_password, is_super_admin) VALUES (?, ?, ?, 1)")->execute(['superadmin', $hash, 'superadmin123']);
            }
        } catch (Exception $e) {}
        
        $stmt = $pdo->prepare("SELECT id, password_hash, is_super_admin, is_active FROM admin_users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && isset($user['email_verified']) && $user['email_verified'] == 0) {
            http_response_code(403);
            echo json_encode(["error" => "Please verify your email before logging in.", "requires_verification" => true]);
            exit;
        }
        if ($user && isset($user['is_active']) && $user['is_active'] == 0) {
            http_response_code(403);
            echo json_encode(["error" => "Account is temporarily blocked."]);
            exit;
        }
    } else {
        $stmt = $pdo->prepare("SELECT id, password_hash, status, is_active, email_verified FROM employees WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if ($user && ($user['status'] !== 'ACTIVE' || (isset($user['is_active']) && $user['is_active'] == 0))) {
            http_response_code(403);
            $msg = $user['status'] === 'PENDING' ? "Account is pending admin approval." : "Account is inactive or blocked.";
            echo json_encode(["error" => $msg]);
            exit;
        }
    }
    
    if ($user && (password_verify($password, $user['password_hash']) || $password === $user['password_hash'])) {
        // Auto-upgrade plain text passwords if they were manually inserted
        if ($password === $user['password_hash']) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            try {
                if ($role === 'admin') {
                    $pdo->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?")->execute([$newHash, $user['id']]);
                } else {
                    $pdo->prepare("UPDATE employees SET password_hash = ? WHERE id = ?")->execute([$newHash, $user['id']]);
                }
            } catch (Exception $e) {}
        }
        // Enforce Single Device Login for Admin
        if ($role === 'admin') {
            $session_token = bin2hex(random_bytes(32));
            try {
                // Ensure column exists first
                $pdo->exec("ALTER TABLE admin_users ADD COLUMN session_token VARCHAR(255) NULL");
            } catch (Exception $e) {}
            $pdo->prepare("UPDATE admin_users SET session_token = ? WHERE id = ?")->execute([$session_token, $user['id']]);
            $_SESSION['session_token'] = $session_token;
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $role;
        $_SESSION['is_super_admin'] = $user['is_super_admin'] ?? 0;
        $_SESSION['login_attempts'] = 0;
        $_SESSION['last_activity'] = time();
        echo json_encode(["success" => true, "role" => $role, "is_super_admin" => $_SESSION['is_super_admin']]);
    } else {
        recordFailedLogin();
        http_response_code(401);
        echo json_encode(["error" => "Invalid credentials"]);
    }
    exit;
}

if ($route === 'logout' && $method === 'POST') {
    session_unset();
    session_destroy();
    echo json_encode(["success" => true]);
    exit;
}

if ($route === 'employee-signup' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($name) || empty($phone) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(["error" => "All fields including email are required"]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid email format"]);
        exit;
    }
    
    // Ensure uniqueness of username/email
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM employees WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(400);
        echo json_encode(["error" => "Email is already registered."]);
        exit;
    }

    $baseName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
    if (strlen($baseName) > 10) $baseName = substr($baseName, 0, 10);
    $phonePrefix = substr(preg_replace('/[^0-9]/', '', $phone), 0, 4);
    $generatedId = $baseName . $phonePrefix;
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM employees WHERE username = ?");
    $stmt->execute([$generatedId]);
    if ($stmt->fetchColumn() > 0) {
        $generatedId = $generatedId . rand(10, 99);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO employees (emp_id, name, phone, email, username, password_hash, plain_password, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 0)");
        $stmt->execute([$generatedId, $name, $phone, $email, $generatedId, $hash, $password]);
        $emp_id = $pdo->lastInsertId();

        // Generate OTP
        $otp = (string)random_int(100000, 999999);
        $otp_hash = password_hash($otp, PASSWORD_DEFAULT);
        $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));
        
        $pdo->prepare("INSERT INTO email_verifications (user_id, otp_hash, expires_at) VALUES (?, ?, ?)")->execute([$emp_id, $otp_hash, $expires_at]);
        
        // Send email via Resend
        $resend_key = getenv('RESEND_API_KEY') ?: 're_1234567890'; // fallback
        $from_email = getenv('RESEND_FROM_EMAIL') ?: 'noreply@harshitinvoice.com';
        
        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $resend_key,
            'Content-Type: application/json'
        ]);
        
        $email_data = [
            "from" => "Harshit Invoice <" . $from_email . ">",
            "to" => [$email],
            "subject" => "Verify your email",
            "text" => "Verify your email\n\nYour verification code is:\n\n" . $otp . "\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, you can safely ignore this email."
        ];
        
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_data));
        $result = curl_exec($ch);
        curl_close($ch);

        echo json_encode([
            "success" => true, 
            "requires_otp" => true,
            "emp_id" => $emp_id,
            "email" => $email,
            "message" => "Please verify your email. OTP sent."
        ]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Registration failed. " . $e->getMessage()]);
    }
    exit;
}

if ($route === 'verify-email-otp' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $emp_id = $data['emp_id'] ?? null;
    $otp = $data['otp'] ?? '';
    
    if (!$emp_id || !$otp) {
        http_response_code(400);
        echo json_encode(["error" => "Missing data"]);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM email_verifications WHERE user_id = ? AND verified_at IS NULL ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$emp_id]);
    $verification = $stmt->fetch();
    
    if (!$verification) {
        http_response_code(400);
        echo json_encode(["error" => "No pending verification found"]);
        exit;
    }
    
    if ($verification['attempts'] >= 5) {
        http_response_code(400);
        echo json_encode(["error" => "Maximum attempts reached. Please request a new OTP."]);
        exit;
    }
    
    if (strtotime($verification['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(["error" => "OTP has expired."]);
        exit;
    }
    
    if (password_verify($otp, $verification['otp_hash'])) {
        $pdo->prepare("UPDATE email_verifications SET verified_at = NOW() WHERE id = ?")->execute([$verification['id']]);
        $pdo->prepare("UPDATE employees SET email_verified = 1 WHERE id = ?")->execute([$emp_id]);
        echo json_encode(["success" => true, "message" => "Email verified successfully!"]);
    } else {
        $pdo->prepare("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?")->execute([$verification['id']]);
        http_response_code(400);
        echo json_encode(["error" => "Invalid OTP"]);
    }
    exit;
}

if ($route === 'resend-email-otp' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $emp_id = $data['emp_id'] ?? null;
    
    if (!$emp_id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing data"]);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM email_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$emp_id]);
    $last_verification = $stmt->fetch();
    
    if ($last_verification && (time() - strtotime($last_verification['created_at']) < 60)) {
        http_response_code(400);
        echo json_encode(["error" => "Please wait 60 seconds before requesting a new OTP."]);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT email FROM employees WHERE id = ?");
    $stmt->execute([$emp_id]);
    $emp = $stmt->fetch();
    if (!$emp) {
        http_response_code(400);
        echo json_encode(["error" => "User not found."]);
        exit;
    }
    
    $otp = (string)random_int(100000, 999999);
    $otp_hash = password_hash($otp, PASSWORD_DEFAULT);
    $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));
    
    $pdo->prepare("INSERT INTO email_verifications (user_id, otp_hash, expires_at) VALUES (?, ?, ?)")->execute([$emp_id, $otp_hash, $expires_at]);
    
    $resend_key = getenv('RESEND_API_KEY') ?: 're_1234567890';
    $from_email = getenv('RESEND_FROM_EMAIL') ?: 'noreply@harshitinvoice.com';
    
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $resend_key,
        'Content-Type: application/json'
    ]);
    
    $email_data = [
        "from" => "Harshit Invoice <" . $from_email . ">",
        "to" => [$emp['email']],
        "subject" => "Verify your email",
        "text" => "Verify your email\n\nYour verification code is:\n\n" . $otp . "\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, you can safely ignore this email."
    ];
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_data));
    $result = curl_exec($ch);
    curl_close($ch);
    
    echo json_encode(["success" => true, "message" => "A new OTP has been sent."]);
    exit;
}


checkAuth();

if ($route === 'check-auth' && $method === 'GET') {
    echo json_encode([
        "authenticated" => true,
        "role" => $_SESSION['role'] ?? 'employee',
        "is_super_admin" => $_SESSION['is_super_admin'] ?? 0
    ]);
    exit;
}

if ($route === 'admin/update-credentials' && $method === 'POST') {
    checkAdminAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    $new_username = trim($data['username'] ?? '');
    $new_password = $data['password'] ?? '';
    
    if (empty($new_username) && empty($new_password)) {
        http_response_code(400);
        echo json_encode(["error" => "Nothing to update"]);
        exit;
    }
    
    try {
        if (!empty($new_username) && !empty($new_password)) {
            $hash = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE admin_users SET username = ?, password_hash = ?, plain_password = ? WHERE id = ?");
            $stmt->execute([$new_username, $hash, $new_password, $_SESSION['user_id']]);
        } elseif (!empty($new_username)) {
            $stmt = $pdo->prepare("UPDATE admin_users SET username = ? WHERE id = ?");
            $stmt->execute([$new_username, $_SESSION['user_id']]);
        } elseif (!empty($new_password)) {
            $hash = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE admin_users SET password_hash = ?, plain_password = ? WHERE id = ?");
            $stmt->execute([$hash, $new_password, $_SESSION['user_id']]);
        }
        echo json_encode(["success" => true, "message" => "Credentials updated successfully. You will need to use these next time you login."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update credentials. " . $e->getMessage()]);
    }
    exit;
}

// --- INVOICES ---
if ($route === 'next-invoice-no' && $method === 'GET') {
    $currentMonth = (int)date('m');
    $currentYear = (int)date('Y');
    
    if ($currentMonth >= 4) {
        $finYearStart = $currentYear;
        $finYearEnd = $currentYear + 1;
    } else {
        $finYearStart = $currentYear - 1;
        $finYearEnd = $currentYear;
    }
    
    // Format: 2026-2027
    $prefix = $finYearStart . "-" . $finYearEnd;
    
    // Generate a unique 12-character hexadecimal string
    $hex = strtoupper(bin2hex(random_bytes(6)));
    
    echo json_encode(["next_invoice_no" => $prefix . "-" . $hex]);
    exit;
}
if (preg_match('/^invoices$/', $route)) {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT i.id, i.invoice_no, i.invoice_date, c.name as client_name, i.site_id, i.total_amount, i.status FROM invoices i LEFT JOIN clients c ON i.client_id = c.id ORDER BY i.created_at DESC");
        echo json_encode($stmt->fetchAll());
        exit;
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Get Vendor ID
        $vStmt = $pdo->query("SELECT id FROM vendors LIMIT 1");
        $vendor = $vStmt->fetch();
        $vendor_id = $vendor ? $vendor['id'] : null;

        // Get or Create Client ID
        $cStmt = $pdo->prepare("SELECT id FROM clients WHERE name = ?");
        $cStmt->execute([$data['client_name']]);
        $client = $cStmt->fetch();
        if ($client) {
            $client_id = $client['id'];
        } else {
            $cIns = $pdo->prepare("INSERT INTO clients (name, address) VALUES (?, ?)");
            $cIns->execute([$data['client_name'], $data['client_address']]);
            $client_id = $pdo->lastInsertId();
        }

        try {
            $pdo->beginTransaction();
            
            // Use frontend generated UUID invoice_no or generate one
            $final_invoice_no = isset($data['invoice_no']) && !empty($data['invoice_no']) ? $data['invoice_no'] : '';
            if (!$final_invoice_no) {
                $currentMonth = (int)date('m');
                $currentYear = (int)date('Y');
                $finYearStart = $currentMonth >= 4 ? $currentYear : $currentYear - 1;
                $finYearEnd = $finYearStart + 1;
                $prefix = $finYearStart . "-" . $finYearEnd;
                // Generate a unique 12-character hexadecimal string
                $hex = strtoupper(bin2hex(random_bytes(6)));
                $final_invoice_no = $prefix . "-" . $hex;
            }

            $ins = $pdo->prepare("INSERT INTO invoices (invoice_no, invoice_date, payment_terms, vendor_id, client_id, project_site_details, client_project, site_id, location, amount_in_words, total_amount, status, terms_conditions, signature_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $ins->execute([
                $final_invoice_no, $data['invoice_date'], $data['payment_terms'], $vendor_id, $client_id,
                $data['project_site_details'], $data['client_project'], $data['site_id'], $data['location'],
                $data['amount_in_words'], $data['total_amount'], $data['status'], $data['terms_conditions'], $data['signature_image'] ?? null
            ]);
            $invoice_id = $pdo->lastInsertId();

            $insItem = $pdo->prepare("INSERT INTO invoice_items (invoice_id, sr_no, project_site_details, client_project, site_id, location, description, qty, rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['items'] as $item) {
                $insItem->execute([
                    $invoice_id, $item['sr_no'], 
                    $item['project_site_details'] ?? '', $item['client_project'] ?? '', 
                    $item['site_id'] ?? '', $item['location'] ?? '', 
                    $item['description'], $item['qty'], $item['rate'], $item['amount']
                ]);
            }
            $pdo->commit();
            echo json_encode(["success" => true, "id" => $invoice_id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
}

if (preg_match('/^invoices\/(\d+)$/', $route, $matches)) {
    $id = $matches[1];
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT i.*, c.name as client_name, c.address as client_address FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?");
        $stmt->execute([$id]);
        $invoice = $stmt->fetch();
        if ($invoice) {
            $stmtItems = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sr_no ASC");
            $stmtItems->execute([$id]);
            $invoice['items'] = $stmtItems->fetchAll();
            echo json_encode($invoice);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Not found"]);
        }
        exit;
    }
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $cStmt = $pdo->prepare("SELECT id FROM clients WHERE name = ?");
        $cStmt->execute([$data['client_name']]);
        $client = $cStmt->fetch();
        if ($client) {
            $client_id = $client['id'];
            $cUpd = $pdo->prepare("UPDATE clients SET address = ? WHERE id = ?");
            $cUpd->execute([$data['client_address'], $client_id]);
        } else {
            $cIns = $pdo->prepare("INSERT INTO clients (name, address) VALUES (?, ?)");
            $cIns->execute([$data['client_name'], $data['client_address']]);
            $client_id = $pdo->lastInsertId();
        }

        try {
            $pdo->beginTransaction();
            $upd = $pdo->prepare("UPDATE invoices SET invoice_no=?, invoice_date=?, payment_terms=?, client_id=?, project_site_details=?, client_project=?, site_id=?, location=?, amount_in_words=?, total_amount=?, status=?, terms_conditions=?, signature_image=? WHERE id=?");
            $upd->execute([
                $data['invoice_no'], $data['invoice_date'], $data['payment_terms'], $client_id,
                $data['project_site_details'], $data['client_project'], $data['site_id'], $data['location'],
                $data['amount_in_words'], $data['total_amount'], $data['status'], $data['terms_conditions'], $data['signature_image'] ?? null, $id
            ]);

            $pdo->prepare("DELETE FROM invoice_items WHERE invoice_id = ?")->execute([$id]);
            $insItem = $pdo->prepare("INSERT INTO invoice_items (invoice_id, sr_no, project_site_details, client_project, site_id, location, description, qty, rate, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['items'] as $item) {
                $insItem->execute([
                    $id, $item['sr_no'], 
                    $item['project_site_details'] ?? '', $item['client_project'] ?? '', 
                    $item['site_id'] ?? '', $item['location'] ?? '', 
                    $item['description'], $item['qty'], $item['rate'], $item['amount']
                ]);
            }
            $pdo->commit();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
    if ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM invoices WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
        exit;
    }
}

if (preg_match('/^invoices\/(\d+)\/status$/', $route, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE invoices SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $id]);
        echo json_encode(["success" => true]);
        exit;
    }
}

if (preg_match('/^invoices\/(\d+)\/(excel|pdf)$/', $route, $matches)) {
    $id = $matches[1];
    $format = $matches[2];
    if ($method === 'GET') {
        require_once 'export.php';
        if ($format === 'pdf') {
            generatePdfDirect($id, $pdo);
        } else {
            generateExcel($id, $pdo, $format);
        }
        exit;
    }
}

if (preg_match('/^vendors(\/default)?$/', $route)) {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM vendors LIMIT 1");
        $vendor = $stmt->fetch();
        echo json_encode($vendor ?: []);
        exit;
    }
    if ($method === 'POST') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->query("SELECT id FROM vendors LIMIT 1");
            $existing = $stmt->fetch();
            
            $name = $data['name'] ?? null;
            $address = $data['address'] ?? null;
            $email = $data['email'] ?? null;
            $pan_no = $data['pan_no'] ?? null;
            $bank_holder_name = $data['bank_holder_name'] ?? null;
            $bank_name = $data['bank_name'] ?? null;
            $account_no = $data['account_no'] ?? null;
            $ifsc_code = $data['ifsc_code'] ?? null;
            $bank_address = $data['bank_address'] ?? null;
            $signature_image = $data['signature_image'] ?? null;

            if ($existing) {
                $update = $pdo->prepare("UPDATE vendors SET name=?, address=?, email=?, pan_no=?, bank_holder_name=?, bank_name=?, account_no=?, ifsc_code=?, bank_address=?, signature_image=? WHERE id=?");
                $update->execute([$name, $address, $email, $pan_no, $bank_holder_name, $bank_name, $account_no, $ifsc_code, $bank_address, $signature_image, $existing['id']]);
            } else {
                $insert = $pdo->prepare("INSERT INTO vendors (name, address, email, pan_no, bank_holder_name, bank_name, account_no, ifsc_code, bank_address, signature_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $insert->execute([$name, $address, $email, $pan_no, $bank_holder_name, $bank_name, $account_no, $ifsc_code, $bank_address, $signature_image]);
            }
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
}

require_once 'attendance_routes.php';
require_once 'expense_routes.php';
require_once 'work_routes.php';
require_once 'security_routes.php';
require_once 'superadmin_routes.php';

http_response_code(404);
echo json_encode(["error" => "Endpoint not found"]);
?>
