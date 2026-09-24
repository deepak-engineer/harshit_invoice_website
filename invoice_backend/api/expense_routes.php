<?php
// Expense Routes
// Expects variables $route, $method, $pdo from index.php

if (preg_match('/^expenses$/', $route)) {
    if ($method === 'GET') {
        checkAdminAuth();
        // Fetch all expenses with employee, team, and site/state info
        $stmt = $pdo->query("SELECT e.*, emp.name as emp_name, emp.emp_id as emp_code, t.name as team_name
                             FROM expenses e 
                             JOIN employees emp ON e.emp_id = emp.id 
                             LEFT JOIN teams t ON e.team_id = t.id 
                             ORDER BY e.created_at DESC");
        echo json_encode($stmt->fetchAll());
        exit;
    }
}

if (preg_match('/^my-expenses$/', $route)) {
    if ($method === 'GET') {
        checkEmployeeAuth();
        $emp_id = $_SESSION['user_id'];
        $stmt = $pdo->prepare("SELECT e.*, t.name as team_name 
                               FROM expenses e 
                               LEFT JOIN teams t ON e.team_id = t.id 
                               WHERE e.emp_id = ? 
                               ORDER BY e.created_at DESC");
        $stmt->execute([$emp_id]);
        echo json_encode($stmt->fetchAll());
        exit;
    }
    if ($method === 'POST') {
        checkEmployeeAuth();
        $emp_id = $_SESSION['user_id'];
        $data = json_decode(file_get_contents('php://input'), true);
        
        $category = $data['category'] ?? 'Other';
        $amount = $data['amount'] ?? 0;
        $description = $data['description'] ?? '';
        $date = $data['expense_date'] ?? date('Y-m-d');
        $photo = $data['receipt_photo'] ?? null;
        
        // Get employee current team and site/state
        $stmt = $pdo->prepare("SELECT team_id, site_id, state FROM employees WHERE id = ?");
        $stmt->execute([$emp_id]);
        $emp = $stmt->fetch();
        $team_id = $emp ? $emp['team_id'] : null;
        $state = $emp ? $emp['state'] : null;

        $photo_filename = null;
        if (!empty($photo) && strpos($photo, 'data:image') === 0) {
            $photo_filename = processBase64Image($photo, '../uploads/expenses/');
        }

        $ins = $pdo->prepare("INSERT INTO expenses (emp_id, team_id, state, category, amount, description, receipt_photo, expense_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')");
        $ins->execute([$emp_id, $team_id, $state, $category, $amount, $description, $photo_filename, $date]);
        
        echo json_encode(["success" => true, "message" => "Expense submitted successfully!"]);
        exit;
    }
}

if (preg_match('/^expenses\/(\d+)\/status$/', $route, $matches)) {
    if ($method === 'PUT') {
        checkAdminAuth();
        $id = $matches[1];
        $data = json_decode(file_get_contents('php://input'), true);
        $status = $data['status'] ?? 'PENDING';
        
        $upd = $pdo->prepare("UPDATE expenses SET status = ? WHERE id = ?");
        $upd->execute([$status, $id]);
        echo json_encode(["success" => true]);
        exit;
    }
}
?>
