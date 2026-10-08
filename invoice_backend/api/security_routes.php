<?php
// security_routes.php

if (preg_match('/^security-equipment$/', $route)) {
    if ($method === 'GET') {
        try {
            $stmt = $pdo->query("SELECT id, name FROM security_equipment_master ORDER BY name ASC");
            echo json_encode($stmt->fetchAll());
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name']);
        
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["error" => "Equipment name is required"]);
            exit;
        }
        
        try {
            $stmt = $pdo->prepare("INSERT INTO security_equipment_master (name) VALUES (?)");
            $stmt->execute([$name]);
            $id = $pdo->lastInsertId();
            
            echo json_encode(["success" => true, "id" => $id, "name" => $name]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Integrity constraint violation (duplicate)
                http_response_code(400);
                echo json_encode(["error" => "Equipment already exists"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        }
        exit;
    }
}

if (preg_match('/^security-forms$/', $route)) {
    if ($method === 'GET') {
        try {
            if (isset($_SESSION['role']) && $_SESSION['role'] === 'employee') {
                $stmt = $pdo->prepare("SELECT id, uuid, branch_code, address, state, created_at FROM security_forms WHERE employee_id = ? ORDER BY created_at DESC");
                $stmt->execute([$_SESSION['user_id']]);
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            } else {
                $stmt = $pdo->query("SELECT id, uuid, branch_code, address, state, created_at FROM security_forms ORDER BY created_at DESC");
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $pdo->beginTransaction();
            
            $employee_id = (isset($_SESSION['role']) && $_SESSION['role'] === 'employee') ? $_SESSION['user_id'] : null;
            $ins = $pdo->prepare("INSERT INTO security_forms (uuid, branch_code, address, state, section_configs, employee_id) VALUES (UUID(), ?, ?, ?, ?, ?)");
            $ins->execute([$data['branch_code'], $data['address'], $data['state'], json_encode($data['section_configs'] ?? []), $employee_id]);
            $form_id = $pdo->lastInsertId();
            
            $insItem = $pdo->prepare("INSERT INTO security_form_items (form_id, item_type, section_name, equipment_id, quantity) VALUES (?, ?, ?, ?, ?)");
            
            // Insert Sections
            if (!empty($data['sections'])) {
                foreach ($data['sections'] as $section => $items) {
                    foreach ($items as $item) {
                        if ($item['quantity'] > 0) {
                            $insItem->execute([$form_id, 'SECTION', $section, $item['equipment_id'], $item['quantity']]);
                        }
                    }
                }
            }
            
            // Insert Requirements
            if (!empty($data['requirements'])) {
                foreach ($data['requirements'] as $req) {
                    if ($req['quantity'] > 0) {
                        $insItem->execute([$form_id, 'REQUIREMENT', null, $req['equipment_id'], $req['quantity']]);
                    }
                }
            }
            
            // Insert Installations
            if (!empty($data['installations'])) {
                foreach ($data['installations'] as $inst) {
                    if ($inst['quantity'] > 0) {
                        $insItem->execute([$form_id, 'INSTALLATION', null, $inst['equipment_id'], $inst['quantity']]);
                    }
                }
            }
            
            $pdo->commit();
            echo json_encode(["success" => true, "id" => $form_id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
}

if (preg_match('/^security-forms\/(\d+)$/', $route, $matches)) {
    $id = $matches[1];
    
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM security_forms WHERE id = ?");
        $stmt->execute([$id]);
        $form = $stmt->fetch();
        
        if ($form) {
            $itemsStmt = $pdo->prepare("SELECT i.*, e.name as equipment_name FROM security_form_items i JOIN security_equipment_master e ON i.equipment_id = e.id WHERE i.form_id = ?");
            $itemsStmt->execute([$id]);
            $items = $itemsStmt->fetchAll();
            
            $form['sections'] = [];
            $form['requirements'] = [];
            $form['installations'] = [];
            
            foreach ($items as $item) {
                if ($item['item_type'] === 'SECTION') {
                    if (!isset($form['sections'][$item['section_name']])) {
                        $form['sections'][$item['section_name']] = [];
                    }
                    $form['sections'][$item['section_name']][] = [
                        'equipment_id' => $item['equipment_id'],
                        'equipment_name' => $item['equipment_name'],
                        'quantity' => $item['quantity']
                    ];
                } else if ($item['item_type'] === 'REQUIREMENT') {
                    $form['requirements'][] = [
                        'equipment_id' => $item['equipment_id'],
                        'equipment_name' => $item['equipment_name'],
                        'quantity' => $item['quantity']
                    ];
                } else if ($item['item_type'] === 'INSTALLATION') {
                    $form['installations'][] = [
                        'equipment_id' => $item['equipment_id'],
                        'equipment_name' => $item['equipment_name'],
                        'quantity' => $item['quantity']
                    ];
                }
            }
            $form['section_configs'] = json_decode($form['section_configs'] ?? '[]', true);
            echo json_encode($form);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Form not found"]);
        }
        exit;
    }
    
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $pdo->beginTransaction();
            
            $upd = $pdo->prepare("UPDATE security_forms SET branch_code = ?, address = ?, state = ?, section_configs = ? WHERE id = ?");
            $upd->execute([$data['branch_code'], $data['address'], $data['state'], json_encode($data['section_configs'] ?? []), $id]);
            
            // Delete all existing items for this form
            $pdo->prepare("DELETE FROM security_form_items WHERE form_id = ?")->execute([$id]);
            
            $insItem = $pdo->prepare("INSERT INTO security_form_items (form_id, item_type, section_name, equipment_id, quantity) VALUES (?, ?, ?, ?, ?)");
            
            // Insert Sections
            if (!empty($data['sections'])) {
                foreach ($data['sections'] as $section => $items) {
                    foreach ($items as $item) {
                        if ($item['quantity'] > 0) {
                            $insItem->execute([$id, 'SECTION', $section, $item['equipment_id'], $item['quantity']]);
                        }
                    }
                }
            }
            
            // Insert Requirements
            if (!empty($data['requirements'])) {
                foreach ($data['requirements'] as $req) {
                    if ($req['quantity'] > 0) {
                        $insItem->execute([$id, 'REQUIREMENT', null, $req['equipment_id'], $req['quantity']]);
                    }
                }
            }
            
            // Insert Installations
            if (!empty($data['installations'])) {
                foreach ($data['installations'] as $inst) {
                    if ($inst['quantity'] > 0) {
                        $insItem->execute([$id, 'INSTALLATION', null, $inst['equipment_id'], $inst['quantity']]);
                    }
                }
            }
            
            $pdo->commit();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
    
    if ($method === 'DELETE') {
        try {
            $stmt = $pdo->prepare("DELETE FROM security_forms WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
}
