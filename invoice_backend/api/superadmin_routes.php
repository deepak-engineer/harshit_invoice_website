<?php
// c:\xampp\htdocs\harshit_invoice_website\invoice_backend\api\superadmin_routes.php

// Ensure this is only accessible by Super Admin
if (preg_match('/^superadmin\/(.*)$/', $route, $sa_matches)) {
    checkSuperAdminAuth();
    $sa_action = $sa_matches[1];
    
    // --- ADMIN MANAGEMENT ---
    
    // List all admins
    if ($sa_action === 'admins' && $method === 'GET') {
        $stmt = $pdo->query("SELECT id, username, is_super_admin, is_active, plain_password, created_at FROM admin_users ORDER BY id ASC");
        echo json_encode($stmt->fetchAll());
        exit;
    }
    
    // Create new admin
    if ($sa_action === 'admins' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';
        $is_super = isset($data['is_super_admin']) ? (int)$data['is_super_admin'] : 0;
        
        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(["error" => "Username and password required"]);
            exit;
        }
        
        $chk = $pdo->prepare("SELECT id FROM admin_users WHERE username = ?");
        $chk->execute([$username]);
        if ($chk->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Username already exists"]);
            exit;
        }
        
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO admin_users (username, password_hash, plain_password, is_super_admin, is_active) VALUES (?, ?, ?, ?, 1)");
        $stmt->execute([$username, $hash, $password, $is_super]);
        
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
        exit;
    }
    
    // Toggle Admin status
    if (preg_match('/^admins\/(\d+)\/toggle$/', $sa_action, $m) && $method === 'PUT') {
        $id = $m[1];
        if ($id == $_SESSION['user_id']) {
            http_response_code(400);
            echo json_encode(["error" => "Cannot toggle yourself"]);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;
        
        $stmt = $pdo->prepare("UPDATE admin_users SET is_active = ? WHERE id = ?");
        $stmt->execute([$is_active, $id]);
        
        echo json_encode(["success" => true]);
        exit;
    }
    
    // Update Admin password
    if (preg_match('/^admins\/(\d+)\/password$/', $sa_action, $m) && $method === 'PUT') {
        $id = $m[1];
        $data = json_decode(file_get_contents('php://input'), true);
        $password = $data['password'] ?? '';
        
        if (!$password) {
            http_response_code(400);
            echo json_encode(["error" => "Password required"]);
            exit;
        }
        
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE admin_users SET password_hash = ?, plain_password = ? WHERE id = ?");
        $stmt->execute([$hash, $password, $id]);
        
        echo json_encode(["success" => true]);
        exit;
    }
    
    // --- EMPLOYEE MANAGEMENT ---
    
    // Update Employee password
    if (preg_match('/^employees\/(\d+)\/password$/', $sa_action, $m) && $method === 'PUT') {
        $id = $m[1];
        $data = json_decode(file_get_contents('php://input'), true);
        $password = $data['password'] ?? '';
        
        if (!$password) {
            http_response_code(400);
            echo json_encode(["error" => "Password required"]);
            exit;
        }
        
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE employees SET password_hash = ?, plain_password = ? WHERE id = ?");
        $stmt->execute([$hash, $password, $id]);
        
        echo json_encode(["success" => true]);
        exit;
    }
    
    // Toggle Employee status (Block/Unblock)
    if (preg_match('/^employees\/(\d+)\/toggle$/', $sa_action, $m) && $method === 'PUT') {
        $id = $m[1];
        $data = json_decode(file_get_contents('php://input'), true);
        $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;
        
        // Let's set status to ACTIVE or INACTIVE instead of boolean, since employee table uses status column 'ACTIVE'/'PENDING'/'INACTIVE' or similar
        // Wait, employees table uses status ENUM/VARCHAR. Let's check employee status column.
        $stmt = $pdo->prepare("SELECT status FROM employees WHERE id = ?");
        $stmt->execute([$id]);
        $emp = $stmt->fetch();
        
        if ($emp) {
            $new_status = $is_active ? 'ACTIVE' : 'INACTIVE';
            $upd = $pdo->prepare("UPDATE employees SET status = ?, is_active = ? WHERE id = ?");
            $upd->execute([$new_status, $is_active, $id]);
            echo json_encode(["success" => true]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Employee not found"]);
        }
        exit;
    }
}
?>
