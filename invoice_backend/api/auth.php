<?php
// c:\Users\Morningstar\Desktop\harshit_invoice_website\backend\api\auth.php
session_set_cookie_params([
    'lifetime' => 3600,
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'],
    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_start();

function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized"]);
        exit;
    }
    
    // Check inactivity timeout (60 minutes)
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > 3600)) {
        session_unset();
        session_destroy();
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(["error" => "Session expired"]);
        exit;
    }
    $_SESSION['last_activity'] = time();
}

function checkAdminAuth() {
    checkAuth();
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(["error" => "Forbidden: Admin access required"]);
        exit;
    }
    
    // Single Device Enforce for Admin
    global $pdo;
    if (isset($pdo) && isset($_SESSION['session_token'])) {
        $stmt = $pdo->prepare("SELECT session_token FROM admin_users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $dbToken = $stmt->fetchColumn();
        
        if ($dbToken !== $_SESSION['session_token']) {
            session_unset();
            session_destroy();
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(["error" => "Session invalid. You have logged in from another device."]);
            exit;
        }
    }
}

function checkEmployeeAuth() {
    checkAuth();
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'employee') {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(["error" => "Forbidden: Employee access required"]);
        exit;
    }
}

function checkBruteForce() {
    // Brute force lockout removed as per request
}

function recordFailedLogin() {
    if (!isset($_SESSION['login_attempts'])) {
        $_SESSION['login_attempts'] = 0;
    }
    $_SESSION['login_attempts']++;
    $_SESSION['last_failed_login'] = time();
}
?>
