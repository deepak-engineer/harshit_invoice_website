const fs = require('fs');

// 1. Refactor index.php
const backendPath = 'c:\\xampp\\htdocs\\harshit_invoice_website\\invoice_backend\\api\\index.php';
let backendContent = fs.readFileSync(backendPath, 'utf8');

// Login Query
backendContent = backendContent.replace(
    /SELECT id, password_hash, status, is_active, email_verified FROM employees WHERE username = \?/,
    "SELECT id, password_hash, status, is_active, email_verified FROM employees WHERE username = ? OR email = ?"
);
backendContent = backendContent.replace(
    /\$stmt->execute\(\[\$username\]\);\s*\n\s*\$user = \$stmt->fetch\(\);/g,
    `$stmt->execute([$username, $username]);\n        $user = $stmt->fetch();`
);

// Signup Logic
backendContent = backendContent.replace(
    /\$phone = trim\(\$data\['phone'\] \?\? ''\);\s*/,
    ""
);

backendContent = backendContent.replace(
    /if \(empty\(\$name\) \|\| empty\(\$phone\) \|\| empty\(\$email\) \|\| empty\(\$password\)\) \{/,
    "if (empty($name) || empty($email) || empty($password)) {"
);

backendContent = backendContent.replace(
    /\$phonePrefix = substr\(preg_replace\('\/\[\^0-9\]\/', '', \$phone\), 0, 4\);\s*\$generatedId = \$baseName \. \$phonePrefix;/,
    `$generatedId = $baseName . random_int(100, 999);`
);

// We need to keep phone as NULL in the INSERT query
backendContent = backendContent.replace(
    /\$stmt->execute\(\[\$generatedId, \$name, \$phone, \$email, \$generatedId, \$hash, \$password\]\);/,
    "$stmt->execute([$generatedId, $name, NULL, $email, $generatedId, $hash, $password]);"
);


fs.writeFileSync(backendPath, backendContent, 'utf8');
console.log("Backend refactored");


// 2. Refactor Login.jsx
const frontendPath = 'c:\\xampp\\htdocs\\harshit_invoice_website\\frontend\\src\\pages\\Login.jsx';
let frontendContent = fs.readFileSync(frontendPath, 'utf8');

frontendContent = frontendContent.replace(
    /const \[phone, setPhone\] = useState\(''\);\s*/,
    ""
);

frontendContent = frontendContent.replace(
    /phone,\s*email,\s*password/g,
    "email, password"
);

frontendContent = frontendContent.replace(
    /setPhone\(''\);\s*/,
    ""
);

const phoneInputRegex = /<div>\s*<label className="block text-sm font-medium text-slate-700 mb-2">Phone Number<\/label>\s*<div className="relative">\s*<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">\s*<User className="h-5 w-5" \/>\s*<\/div>\s*<input\s*type="text"\s*value=\{phone\}\s*onChange=\{\(e\) => setPhone\(e\.target\.value\)\}\s*required\s*className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-slate-50 outline-none text-slate-800"\s*placeholder="Enter phone number"\s*\/>\s*<\/div>\s*<\/div>/;
frontendContent = frontendContent.replace(phoneInputRegex, "");

frontendContent = frontendContent.replace(
    /<label className="block text-sm font-medium text-slate-700 mb-2">Username<\/label>/,
    '<label className="block text-sm font-medium text-slate-700 mb-2">Username or Email</label>'
);
frontendContent = frontendContent.replace(
    /placeholder="Enter username"/,
    'placeholder="Enter username or email"'
);


fs.writeFileSync(frontendPath, frontendContent, 'utf8');
console.log("Frontend refactored");
