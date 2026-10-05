const fs = require('fs');

const backendPath = 'c:\\xampp\\htdocs\\harshit_invoice_website\\invoice_backend\\api\\index.php';
let content = fs.readFileSync(backendPath, 'utf8');

// 1. Extend Session Lifetime to 10 years (instead of 24h)
// We need to edit auth.php
const authPath = 'c:\\xampp\\htdocs\\harshit_invoice_website\\invoice_backend\\api\\auth.php';
let authContent = fs.readFileSync(authPath, 'utf8');
authContent = authContent.replace(
    /'lifetime' => 86400,/,
    "'lifetime' => 315360000,"
);
authContent = authContent.replace(
    /if \(isset\(\$_SESSION\['last_activity'\]\) && \(time\(\) - \$_SESSION\['last_activity'\] > 86400\)\) \{/,
    "if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > 315360000)) {"
);
fs.writeFileSync(authPath, authContent, 'utf8');

// 2. Refactor index.php API Routes

// Find and replace employee-signup block
const signupRegex = /if \(\$route === 'employee-signup' && \$method === 'POST'\) \{[\s\S]*?exit;\n\}/;
const newSendOtpEndpoint = `if ($route === 'send-login-otp' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = trim($data['email'] ?? '');
    
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(["error" => "Email is required"]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid email format"]);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT id, name, status, is_active FROM employees WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(["error" => "Email not found. Admin needs to create your account first."]);
        exit;
    }

    if ($user['status'] !== 'ACTIVE' || (isset($user['is_active']) && $user['is_active'] == 0)) {
        http_response_code(403);
        $msg = $user['status'] === 'PENDING' ? "Account is pending admin approval." : "Account is inactive or blocked.";
        echo json_encode(["error" => $msg]);
        exit;
    }

    try {
        $emp_id = $user['id'];
        $otp = (string)random_int(100000, 999999);
        $otp_hash = password_hash($otp, PASSWORD_DEFAULT);
        $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));
        
        $pdo->prepare("INSERT INTO email_verifications (user_id, otp_hash, expires_at) VALUES (?, ?, ?)")->execute([$emp_id, $otp_hash, $expires_at]);
        
        // Send email via Resend
        $resend_key = getenv('RESEND_API_KEY') ?: 're_1234567890';
        $from_email = getenv('RESEND_FROM_EMAIL') ?: 'noreply@harshitinvoice.com';
        
        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $resend_key,
            'Content-Type: application/json'
        ]);
        
        $htmlContent = "
        <div style='font-family: sans-serif; text-align: center; max-width: 500px; margin: 0 auto; padding: 20px;'>
            <img src='https://lavender-spoonbill-208950.hostingersite.com/assets/crons-logo-darkcopy-CXYL26Eg.svg' alt='Crons Logo' style='height: 60px; margin-bottom: 20px;' />
            <h2 style='color: #333;'>Verify your email to Login</h2>
            <p style='color: #666; font-size: 16px;'>Hello \${$user['name']}, your OTP code is:</p>
            <div style='background-color: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #4F46E5; border-radius: 8px; margin: 20px 0;'>
                $otp
            </div>
            <p style='color: #999; font-size: 14px;'>This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>";

        $email_data = [
            "from" => "Crons Team <" . $from_email . ">",
            "to" => [$email],
            "subject" => "Crons Invoice - Login OTP",
            "html" => $htmlContent
        ];
        
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_data));
        $result = curl_exec($ch);
        curl_close($ch);

        echo json_encode([
            "success" => true, 
            "requires_otp" => true,
            "emp_id" => $emp_id,
            "email" => $email,
            "message" => "OTP sent to your email."
        ]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to send OTP. " . $e->getMessage()]);
    }
    exit;
}`;
content = content.replace(signupRegex, newSendOtpEndpoint);

// Find and replace verify-email-otp block
const verifyRegex = /if \(\$route === 'verify-email-otp' && \$method === 'POST'\) \{[\s\S]*?exit;\n\}/;
const newVerifyEndpoint = `if ($route === 'verify-login-otp' && $method === 'POST') {
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
        echo json_encode(["error" => "No pending OTP found. Please request a new one."]);
        exit;
    }

    if ($verification['attempts'] >= 5) {
        http_response_code(400);
        echo json_encode(["error" => "Too many attempts. Request a new OTP."]);
        exit;
    }

    if (strtotime($verification['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(["error" => "OTP has expired. Request a new one."]);
        exit;
    }

    if (!password_verify($otp, $verification['otp_hash'])) {
        $pdo->prepare("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?")->execute([$verification['id']]);
        http_response_code(400);
        echo json_encode(["error" => "Invalid OTP."]);
        exit;
    }

    // Success! Verify and Login!
    $pdo->prepare("UPDATE email_verifications SET verified_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$verification['id']]);
    $pdo->prepare("UPDATE employees SET email_verified = 1 WHERE id = ?")->execute([$emp_id]);
    
    $_SESSION['user_id'] = $emp_id;
    $_SESSION['role'] = 'employee';
    $_SESSION['is_super_admin'] = 0;
    $_SESSION['login_attempts'] = 0;
    $_SESSION['last_activity'] = time();
    
    echo json_encode([
        "success" => true, 
        "message" => "Login successful!",
        "role" => "employee"
    ]);
    exit;
}`;
content = content.replace(verifyRegex, newVerifyEndpoint);


// In login endpoint, we need to REMOVE the employee login part because it's now handled via send-login-otp
const loginRegex = /if \(\$route === 'login' && \$method === 'POST'\) \{[\s\S]*?if \(\$user && \(password_verify\(\$password, \$user\['password_hash'\]\) \|\| \$password === \$user\['password_hash'\]\)\) \{[\s\S]*?echo json_encode\(\["error" => "Invalid credentials"\]\);\s*\n\s*\}\s*\n\s*exit;\n\}/;

const newLoginEndpoint = `if ($route === 'login' && $method === 'POST') {
    checkBruteForce();
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'employee'; 
    
    // Employee now logs in exclusively via /send-login-otp and /verify-login-otp
    if ($role === 'employee') {
        http_response_code(400);
        echo json_encode(["error" => "Employees must use passwordless OTP login."]);
        exit;
    }

    $user = null;
    if ($role === 'admin') {
        $stmt = $pdo->prepare("SELECT id, password_hash, is_super_admin, is_active FROM admin_users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && isset($user['is_active']) && $user['is_active'] == 0) {
            http_response_code(403);
            echo json_encode(["error" => "Account is temporarily blocked."]);
            exit;
        }
    }
    
    if ($user && (password_verify($password, $user['password_hash']) || $password === $user['password_hash'])) {
        // Auto-upgrade plain text passwords if they were manually inserted
        if ($password === $user['password_hash']) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            try {
                $pdo->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?")->execute([$newHash, $user['id']]);
            } catch (Exception $e) {}
        }

        if ($role === 'admin') {
            $session_token = bin2hex(random_bytes(32));
            try { $pdo->exec("ALTER TABLE admin_users ADD COLUMN session_token VARCHAR(255) NULL"); } catch (Exception $e) {}
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
}`;

content = content.replace(loginRegex, newLoginEndpoint);

fs.writeFileSync(backendPath, content, 'utf8');
console.log("Backend refactored");
