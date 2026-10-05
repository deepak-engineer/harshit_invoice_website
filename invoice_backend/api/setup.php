<?php
require_once 'db.php';

echo "<h1>Database Setup</h1>";

try {
    // 1. Run schema.sql
    $schema_sql = file_get_contents('schema.sql');
    if ($schema_sql !== false) {
        $pdo->exec($schema_sql);
        echo "<p>schema.sql executed successfully.</p>";
    } else {
        echo "<p>Failed to read schema.sql</p>";
    }

    // 2. Run update_schema.sql (ignoring duplicate column errors)
    $update_sql = file_get_contents('update_schema.sql');
    if ($update_sql !== false) {
        $queries = array_filter(array_map('trim', explode(';', $update_sql)));
        foreach ($queries as $query) {
            try {
                $pdo->exec($query);
            } catch (PDOException $e) {
                // ignore duplicate column or table exists errors
            }
        }
        echo "<p>update_schema.sql executed successfully.</p>";
    } else {
        echo "<p>Failed to read update_schema.sql</p>";
    }

    // 3. Create admin_users table and superadmin if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        plain_password VARCHAR(255) NULL,
        is_super_admin TINYINT(1) DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        session_token VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    $stmt = $pdo->query("SELECT id FROM admin_users WHERE is_super_admin = 1");
    if (!$stmt->fetch()) {
        $hash = password_hash('superadmin123', PASSWORD_DEFAULT);
        $pdo->prepare("INSERT INTO admin_users (username, password_hash, plain_password, is_super_admin) VALUES (?, ?, ?, 1)")->execute(['superadmin', $hash, 'superadmin123']);
        echo "<p>Default superadmin created (superadmin / superadmin123).</p>";
    } else {
        echo "<p>Superadmin already exists.</p>";
    }

    echo "<p>Setup complete!</p>";

} catch (Exception $e) {
    echo "<h1>Error</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>
