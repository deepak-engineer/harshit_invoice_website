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

function checkBruteForce() {
    if (isset($_SESSION['login_attempts']) && $_SESSION['login_attempts'] >= 5) {
        if (time() - $_SESSION['last_failed_login'] < 900) { // 15 minutes lockout
            header('Content-Type: application/json');
            http_response_code(429);
            echo json_encode(["error" => "Too many failed attempts. Try again in 15 minutes."]);
            exit;
        } else {
            // Reset after 15 minutes
            $_SESSION['login_attempts'] = 0;
        }
    }
}

function recordFailedLogin() {
    if (!isset($_SESSION['login_attempts'])) {
        $_SESSION['login_attempts'] = 0;
    }
    $_SESSION['login_attempts']++;
    $_SESSION['last_failed_login'] = time();
}
?>
