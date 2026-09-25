<?php
// c:\xampp\htdocs\harshit_invoice_website\invoice_backend\api\work_routes.php

// Start Work Order
if (preg_match('/^work-orders\/start$/', $route)) {
    checkEmployeeAuth();
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $emp_id = $_SESSION['user_id'];
        $today = date('Y-m-d');
        
        // Find today's attendance
        $chk = $pdo->prepare("SELECT id, site_id FROM attendance WHERE employee_id=? AND attendance_date=?");
        $chk->execute([$emp_id, $today]);
        $attendance = $chk->fetch();
        
        if (!$attendance) {
            http_response_code(400);
            echo json_encode(["error" => "No active attendance found for today"]);
            exit;
        }
        
        // Check if a work order already exists for this attendance
        $wo_chk = $pdo->prepare("SELECT id FROM work_orders WHERE attendance_id=?");
        $wo_chk->execute([$attendance['id']]);
        if ($wo = $wo_chk->fetch()) {
            echo json_encode(["success" => true, "work_order_id" => $wo['id']]);
            exit;
        }
        
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO work_orders (attendance_id, site_id, technician_id, status, start_time) VALUES (?, ?, ?, 'WORKING', NOW())");
            $stmt->execute([$attendance['id'], $attendance['site_id'], $emp_id]);
            $wo_id = $pdo->lastInsertId();
            
            // Populate Checklist from Default Template
            $template_chk = $pdo->query("SELECT id FROM checklist_templates WHERE name='DSC Panel Standard' AND is_active=1 LIMIT 1");
            $template = $template_chk->fetch();
            if ($template) {
                $items_chk = $pdo->prepare("SELECT item_name FROM checklist_items WHERE template_id=?");
                $items_chk->execute([$template['id']]);
                $items = $items_chk->fetchAll();
                
                $ins_item = $pdo->prepare("INSERT INTO work_order_checklist (work_order_id, item_name, status) VALUES (?, ?, 'PENDING')");
                foreach ($items as $item) {
                    $ins_item->execute([$wo_id, $item['item_name']]);
                }
            }
            $pdo->commit();
            echo json_encode(["success" => true, "work_order_id" => $wo_id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Failed to start work order"]);
        }
        exit;
    }
}

// Get Current Work Order
if (preg_match('/^work-orders\/current$/', $route)) {
    checkEmployeeAuth();
    if ($method === 'GET') {
        $emp_id = $_SESSION['user_id'];
        $today = date('Y-m-d');
        
        $chk = $pdo->prepare("SELECT w.* FROM work_orders w JOIN attendance a ON w.attendance_id = a.id WHERE w.technician_id=? AND a.attendance_date=?");
        $chk->execute([$emp_id, $today]);
        $wo = $chk->fetch();
        
        if ($wo) {
            $items_chk = $pdo->prepare("SELECT * FROM work_order_checklist WHERE work_order_id=?");
            $items_chk->execute([$wo['id']]);
            $wo['checklist'] = $items_chk->fetchAll();
            
            $photos_chk = $pdo->prepare("SELECT * FROM work_photos WHERE work_order_id=?");
            $photos_chk->execute([$wo['id']]);
            $wo['photos'] = $photos_chk->fetchAll();
            
            echo json_encode($wo);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "No active work order"]);
        }
        exit;
    }
}

// Update Checklist Item
if (preg_match('/^work-orders\/(\d+)\/checklist\/(\d+)$/', $route, $matches)) {
    checkEmployeeAuth();
    $wo_id = $matches[1];
    $item_id = $matches[2];
    
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $status = $data['status'] ?? 'PENDING';
        $remarks = $data['remarks'] ?? null;
        
        $stmt = $pdo->prepare("UPDATE work_order_checklist SET status=?, remarks=? WHERE id=? AND work_order_id=?");
        $stmt->execute([$status, $remarks, $item_id, $wo_id]);
        
        echo json_encode(["success" => true]);
        exit;
    }
}

// Upload Work Photo
if (preg_match('/^work-orders\/(\d+)\/photos$/', $route, $matches)) {
    checkEmployeeAuth();
    $wo_id = $matches[1];
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $photo_url = processBase64Image($data['photo'], '../uploads/work/');
            $type = $data['photo_type'] ?? 'GENERAL';
            $item_id = $data['checklist_item_id'] ?? null;
            
            $stmt = $pdo->prepare("INSERT INTO work_photos (work_order_id, checklist_item_id, photo_type, photo_url) VALUES (?, ?, ?, ?)");
            $stmt->execute([$wo_id, $item_id, $type, $photo_url]);
            
            echo json_encode(["success" => true, "photo_url" => $photo_url]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
}

// Complete Work Order
if (preg_match('/^work-orders\/(\d+)\/complete$/', $route, $matches)) {
    checkEmployeeAuth();
    $wo_id = $matches[1];
    
    if ($method === 'POST') {
        // Verify no pending items
        $chk = $pdo->prepare("SELECT COUNT(*) FROM work_order_checklist WHERE work_order_id=? AND status='PENDING'");
        $chk->execute([$wo_id]);
        if ($chk->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(["error" => "Please complete all checklist items first"]);
            exit;
        }
        
        $stmt = $pdo->prepare("UPDATE work_orders SET status='COMPLETED', end_time=NOW() WHERE id=?");
        $stmt->execute([$wo_id]);
        
        echo json_encode(["success" => true]);
        exit;
    }
}

// Admin: Get all work orders
if (preg_match('/^admin\/work-orders$/', $route)) {
    checkAdminAuth();
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT w.*, e.name as technician_name, s.name as site_name FROM work_orders w JOIN employees e ON w.technician_id = e.id JOIN sites s ON w.site_id = s.id ORDER BY w.created_at DESC LIMIT 50");
        echo json_encode($stmt->fetchAll());
        exit;
    }
}
?>
