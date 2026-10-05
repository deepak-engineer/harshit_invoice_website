const fs = require('fs');
const filePath = 'c:\\xampp\\htdocs\\harshit_invoice_website\\invoice_backend\\api\\index.php';
let content = fs.readFileSync(filePath, 'utf8');

// The block to move:
const regexToRemove = /\s*try \{ \$pdo->exec\("ALTER TABLE employees ADD COLUMN email VARCHAR\(255\) NULL UNIQUE"\); \} catch \(Exception \$e\) \{\}\s*try \{ \$pdo->exec\("ALTER TABLE employees ADD COLUMN email_verified BOOLEAN DEFAULT 0"\); \} catch \(Exception \$e\) \{\}\s*try \{\s*\$pdo->exec\("CREATE TABLE IF NOT EXISTS email_verifications \([\s\S]*?\)"\);\s*\} catch \(Exception \$e\) \{\}/;

const extractedBlock = `
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
`;

// Remove from the old spot
content = content.replace(regexToRemove, '');

// Add to the top after require_once 'attendance_helper.php';
content = content.replace(/require_once 'attendance_helper\.php';/, "require_once 'attendance_helper.php';\n" + extractedBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Migration logic moved!");
