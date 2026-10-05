const fs = require('fs');

const filePath = 'c:\\xampp\\htdocs\\harshit_invoice_website\\invoice_backend\\api\\index.php';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Database schema additions (add before `try { $stmt = $pdo->query("SELECT id FROM admin_users WHERE is_super_admin = 1");`)
const dbChanges = `
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
`;
content = content.replace(/try \{ \$pdo->exec\("ALTER TABLE employees ADD COLUMN is_active BOOLEAN DEFAULT 1"\); \} catch \(Exception \$e\) \{\}/, 'try { $pdo->exec("ALTER TABLE employees ADD COLUMN is_active BOOLEAN DEFAULT 1"); } catch (Exception $e) {}\n' + dbChanges);

// 2. Login modification (block unverified users)
content = content.replace(/SELECT id, password_hash, status, is_active FROM employees WHERE username = \?/, "SELECT id, password_hash, status, is_active, email_verified FROM employees WHERE username = ?");
content = content.replace(/if \(\$user && isset\(\$user\['is_active'\]\) && \$user\['is_active'\] == 0\) \{/, `if ($user && isset($user['email_verified']) && $user['email_verified'] == 0) {
            http_response_code(403);
            echo json_encode(["error" => "Please verify your email before logging in.", "requires_verification" => true]);
            exit;
        }
        if ($user && isset($user['is_active']) && $user['is_active'] == 0) {`);


// 3. Signup modification
const signupBlockRegex = /if \(\$route === 'employee-signup' && \$method === 'POST'\) \{[\s\S]*?exit;\s*\n\}/;
const newSignupBlock = `if ($route === 'employee-signup' && $method === 'POST') {
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
            "text" => "Verify your email\\n\\nYour verification code is:\\n\\n" . $otp . "\\n\\nThis code expires in 10 minutes.\\n\\nIf you did not create this account, you can safely ignore this email."
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
        "text" => "Verify your email\\n\\nYour verification code is:\\n\\n" . $otp . "\\n\\nThis code expires in 10 minutes.\\n\\nIf you did not create this account, you can safely ignore this email."
    ];
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_data));
    $result = curl_exec($ch);
    curl_close($ch);
    
    echo json_encode(["success" => true, "message" => "A new OTP has been sent."]);
    exit;
}
`;

content = content.replace(signupBlockRegex, newSignupBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Backend refactoring complete!");
