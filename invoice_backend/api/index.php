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
        $stmt = $pdo->prepare("SELECT id, password_hash FROM admin_users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
    } else {
        $stmt = $pdo->prepare("SELECT id, password_hash, status FROM employees WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if ($user && $user['status'] !== 'ACTIVE') {
            http_response_code(403);
            $msg = $user['status'] === 'PENDING' ? "Account is pending admin approval." : "Account is inactive.";
            echo json_encode(["error" => $msg]);
            exit;
        }
    }
    
    if ($user && password_verify($password, $user['password_hash'])) {
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
        $_SESSION['login_attempts'] = 0;
        $_SESSION['last_activity'] = time();
        echo json_encode(["success" => true, "role" => $role]);
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
    $password = $data['password'] ?? '';
    $photo = $data['photo'] ?? null;
    
    if (empty($name) || empty($phone) || empty($password) || empty($photo)) {
        http_response_code(400);
        echo json_encode(["error" => "All fields including photo are required"]);
        exit;
    }
    
    // Generate username / emp_id
    // name + first 4 digits of phone
    $baseName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
    if (strlen($baseName) > 10) $baseName = substr($baseName, 0, 10);
    $phonePrefix = substr(preg_replace('/[^0-9]/', '', $phone), 0, 4);
    $generatedId = $baseName . $phonePrefix;
    
    // Ensure uniqueness
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM employees WHERE username = ?");
    $stmt->execute([$generatedId]);
    if ($stmt->fetchColumn() > 0) {
        $generatedId = $generatedId . rand(10, 99);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    try {
        $photo_filename = processBase64Image($photo, '../uploads/employees/');
        
        $stmt = $pdo->prepare("INSERT INTO employees (emp_id, name, phone, username, password_hash, photo, status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')");
        $stmt->execute([$generatedId, $name, $phone, $generatedId, $hash, $photo_filename]);
        echo json_encode([
            "success" => true, 
            "username" => $generatedId,
            "message" => "Account created successfully! Your Username/ID is: " . $generatedId . ". Your account is pending admin approval."
        ]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Registration failed. " . $e->getMessage()]);
    }
    exit;
}

checkAuth();

if ($route === 'check-auth' && $method === 'GET') {
    echo json_encode([
        "authenticated" => true,
        "role" => $_SESSION['role'] ?? 'employee'
    ]);
    exit;
}

// --- INVOICES ---
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
            $ins = $pdo->prepare("INSERT INTO invoices (invoice_no, invoice_date, payment_terms, vendor_id, client_id, project_site_details, client_project, site_id, location, amount_in_words, total_amount, status, terms_conditions, signature_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $ins->execute([
                $data['invoice_no'], $data['invoice_date'], $data['payment_terms'], $vendor_id, $client_id,
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

http_response_code(404);
echo json_encode(["error" => "Endpoint not found"]);
?>
