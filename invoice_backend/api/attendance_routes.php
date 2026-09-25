<?php
// c:\xampp\htdocs\harshit_invoice_website\invoice_backend\api\attendance_routes.php

require_once 'attendance_helper.php';

// Employee Management
if (preg_match('/^admin\/employees$/', $route)) {
    checkAdminAuth();
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT id, emp_id, name, phone, username, daily_salary, site_id, team_id, status, photo, city as state, created_at FROM employees ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
        exit;
    }
    if ($method === 'POST') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $hash = password_hash($data['password'] ?? '', PASSWORD_DEFAULT);
            $photo_filename = null;
            if (!empty($data['photo']) && strpos($data['photo'], 'data:image') === 0) {
                $photo_filename = processBase64Image($data['photo'], '../uploads/employees/');
            }
            
            $daily_salary = empty($data['daily_salary']) ? 0.00 : (float)$data['daily_salary'];
            $site_id = empty($data['site_id']) ? null : $data['site_id'];
            $team_id = empty($data['team_id']) ? null : $data['team_id'];
            
            $stmt = $pdo->prepare("INSERT INTO employees (emp_id, name, phone, username, password_hash, daily_salary, site_id, team_id, photo, status, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$data['emp_id'], $data['name'], $data['phone'] ?? null, $data['username'], $hash, $daily_salary, $site_id, $team_id, $photo_filename, $data['status'] ?? 'ACTIVE', $data['state'] ?? null]);
            echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
        } catch(\Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
}

if (preg_match('/^admin\/employees\/(\d+)$/', $route, $matches)) {
    checkAdminAuth();
    $id = $matches[1];
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT id, emp_id, name, phone, username, daily_salary, site_id, team_id, photo, status, city as state, created_at FROM employees WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode($stmt->fetch());
        exit;
    }
    if ($method === 'PUT') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $daily_salary = empty($data['daily_salary']) ? 0.00 : (float)$data['daily_salary'];
            $site_id = empty($data['site_id']) ? null : $data['site_id'];
            $team_id = empty($data['team_id']) ? null : $data['team_id'];
            
            $photo_filename = null;
            if (!empty($data['photo']) && strpos($data['photo'], 'data:image') === 0) {
                $photo_filename = processBase64Image($data['photo'], '../uploads/employees/');
                $stmt = $pdo->prepare("UPDATE employees SET name=?, phone=?, username=?, daily_salary=?, site_id=?, team_id=?, photo=?, status=?, city=? WHERE id=?");
                $stmt->execute([$data['name'], $data['phone'] ?? null, $data['username'], $daily_salary, $site_id, $team_id, $photo_filename, $data['status'], $data['state'] ?? null, $id]);
            } else {
                $stmt = $pdo->prepare("UPDATE employees SET name=?, phone=?, username=?, daily_salary=?, site_id=?, team_id=?, status=?, city=? WHERE id=?");
                $stmt->execute([$data['name'], $data['phone'] ?? null, $data['username'], $daily_salary, $site_id, $team_id, $data['status'], $data['state'] ?? null, $id]);
            }
            echo json_encode(["success" => true]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
    if ($method === 'DELETE') {
        try {
            $stmt = $pdo->prepare("DELETE FROM employees WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Cannot delete employee. They may have attendance records."]);
        }
        exit;
    }
}

if (preg_match('/^admin\/employees\/bulk-delete$/', $route)) {
    checkAdminAuth();
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['ids']) && is_array($data['ids']) && count($data['ids']) > 0) {
            $inQuery = implode(',', array_fill(0, count($data['ids']), '?'));
            try {
                $stmt = $pdo->prepare("DELETE FROM employees WHERE id IN ($inQuery)");
                $stmt->execute($data['ids']);
                echo json_encode(["success" => true, "deleted" => $stmt->rowCount()]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Cannot delete employees. Some may have linked records."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "No IDs provided"]);
        }
        exit;
    }
}

if (preg_match('/^admin\/employees\/(\d+)\/salary-report$/', $route, $matches)) {
    checkAdminAuth();
    $id = $matches[1];
    
    if ($method === 'GET') {
        $month = $_GET['month'] ?? date('m');
        $year = $_GET['year'] ?? date('Y');
        
        $start_date = "$year-$month-01";
        $end_date = date('Y-m-t', strtotime($start_date));
        
        $stmt = $pdo->prepare("
            SELECT a.attendance_date, a.status, e.daily_salary, e.name, COALESCE(e.city, s.city) as site_state
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN sites s ON e.site_id = s.id
            WHERE e.id = ? AND a.attendance_date BETWEEN ? AND ?
            ORDER BY a.attendance_date ASC
        ");
        $stmt->execute([$id, $start_date, $end_date]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $summary = [
            'present_days' => 0,
            'half_days' => 0,
            'absent_days' => 0,
            'total_salary' => 0,
            'daily_salary' => 0,
            'name' => '',
            'records' => $records
        ];
        
        foreach ($records as $row) {
            $summary['name'] = $row['name'];
            $summary['state'] = $row['site_state'];
            $summary['daily_salary'] = (float)$row['daily_salary'];
            if ($row['status'] === 'PRESENT' || $row['status'] === 'WORKING') {
                $summary['present_days'] += 1;
                $summary['total_salary'] += (float)$row['daily_salary'];
            } elseif ($row['status'] === 'HALF_DAY') {
                $summary['half_days'] += 1;
                $summary['total_salary'] += 300;
            } elseif ($row['status'] === 'ABSENT' || $row['status'] === 'REJECTED') {
                $summary['absent_days'] += 1;
            }
        }
        
        echo json_encode($summary);
        exit;
    }
}

if (preg_match('/^admin\/employees\/(\d+)\/reset-password$/', $route, $matches)) {
    checkAdminAuth();
    $id = $matches[1];
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $hash = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE employees SET password_hash=? WHERE id=?");
        $stmt->execute([$hash, $id]);
        
        $log = $pdo->prepare("INSERT INTO audit_logs (admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?)");
        $log->execute([$_SESSION['user_id'], 'PASSWORD_RESET', 'EMPLOYEE', $id]);
        
        echo json_encode(["success" => true]);
        exit;
    }
}

if (preg_match('/^admin\/employees\/(\d+)\/face$/', $route, $matches)) {
    checkAdminAuth();
    $id = $matches[1];
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $descriptor = json_encode($data['descriptor']);
        $stmt = $pdo->prepare("UPDATE employees SET face_descriptor=? WHERE id=?");
        $stmt->execute([$descriptor, $id]);
        
        $log = $pdo->prepare("INSERT INTO audit_logs (admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?)");
        $log->execute([$_SESSION['user_id'], 'FACE_REGISTER', 'EMPLOYEE', $id]);
        
        echo json_encode(["success" => true]);
        exit;
    }
}

// Team Management
if (preg_match('/^admin\/teams$/', $route)) {
    checkAdminAuth();
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT t.*, GROUP_CONCAT(e.id) as employee_ids FROM teams t LEFT JOIN employees e ON t.id = e.team_id GROUP BY t.id ORDER BY t.name ASC");
        $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($teams as &$team) {
            $team['employee_ids'] = $team['employee_ids'] ? explode(',', $team['employee_ids']) : [];
            // convert to integers
            $team['employee_ids'] = array_map('intval', $team['employee_ids']);
        }
        echo json_encode($teams);
        exit;
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO teams (name, site_id, state) VALUES (?, ?, ?)");
            $stmt->execute([$data['name'], $data['site_id'] ?: null, $data['state'] ?? null]);
            $team_id = $pdo->lastInsertId();
            
            if (!empty($data['employee_ids'])) {
                $placeholders = str_repeat('?,', count($data['employee_ids']) - 1) . '?';
                $pdo->prepare("UPDATE employees SET team_id = ? WHERE id IN ($placeholders)")->execute(array_merge([$team_id], $data['employee_ids']));
            }
            
            $pdo->commit();
            echo json_encode(["success" => true, "id" => $team_id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        exit;
    }
}

if (preg_match('/^admin\/teams\/(\d+)$/', $route, $matches)) {
    checkAdminAuth();
    $id = $matches[1];
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("UPDATE teams SET name=?, site_id=?, state=? WHERE id=?");
            $stmt->execute([$data['name'], $data['site_id'] ?: null, $data['state'] ?? null, $id]);
            
            $pdo->prepare("UPDATE employees SET team_id = NULL WHERE team_id = ?")->execute([$id]);
            if (!empty($data['employee_ids'])) {
                $placeholders = str_repeat('?,', count($data['employee_ids']) - 1) . '?';
                $pdo->prepare("UPDATE employees SET team_id = ? WHERE id IN ($placeholders)")->execute(array_merge([$id], $data['employee_ids']));
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
        $pdo->prepare("UPDATE employees SET team_id=NULL WHERE team_id=?")->execute([$id]);
        $stmt = $pdo->prepare("DELETE FROM teams WHERE id=?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
        exit;
    }
}

// Site Management
if (preg_match('/^admin\/sites$/', $route)) {
    checkAdminAuth();
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM sites ORDER BY name ASC");
        echo json_encode($stmt->fetchAll());
        exit;
    }
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO sites (name, code, address, state, city, location, status, latitude, longitude, geofence_radius) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'], $data['code'], $data['address'], $data['state'] ?? null,
            $data['city'] ?? null, $data['location'] ?? null, $data['status'] ?? 'ACTIVE',
            $data['latitude'] !== '' ? $data['latitude'] : null,
            $data['longitude'] !== '' ? $data['longitude'] : null,
            $data['geofence_radius'] !== '' ? $data['geofence_radius'] : 100
        ]);
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
        exit;
    }
}

if (preg_match('/^admin\/sites\/bulk$/', $route)) {
    checkAdminAuth();
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['sites']) && is_array($data['sites'])) {
            $stmt = $pdo->prepare("INSERT INTO sites (name, code, city, address) VALUES (?, ?, ?, ?)");
            $added = 0;
            foreach ($data['sites'] as $site) {
                if (empty($site['name']) || empty($site['code'])) continue;
                $stmt->execute([$site['name'], $site['code'], $site['state'] ?? null, $site['address'] ?? '']);
                $added++;
            }
            echo json_encode(["success" => true, "added" => $added]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid payload"]);
        }
        exit;
    }
}
if (preg_match('/^admin\/sites\/bulk-delete$/', $route)) {
    checkAdminAuth();
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['ids']) && is_array($data['ids']) && count($data['ids']) > 0) {
            $inQuery = implode(',', array_fill(0, count($data['ids']), '?'));
            $stmt = $pdo->prepare("DELETE FROM sites WHERE id IN ($inQuery)");
            $stmt->execute($data['ids']);
            echo json_encode(["success" => true, "deleted" => $stmt->rowCount()]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "No IDs provided"]);
        }
        exit;
    }
}

if (preg_match('/^admin\/sites\/(\d+)$/', $route, $matches)) {
    checkAdminAuth();
    $id = $matches[1];
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE sites SET name=?, code=?, address=?, state=?, city=?, location=?, status=?, latitude=?, longitude=?, geofence_radius=? WHERE id=?");
        $stmt->execute([
            $data['name'], $data['code'], $data['address'], $data['state'] ?? null,
            $data['city'] ?? null, $data['location'] ?? null, $data['status'],
            $data['latitude'] !== '' ? $data['latitude'] : null,
            $data['longitude'] !== '' ? $data['longitude'] : null,
            $data['geofence_radius'] !== '' ? $data['geofence_radius'] : 100,
            $id
        ]);
        echo json_encode(["success" => true]);
        exit;
    }
    if ($method === 'DELETE') {
        try {
            $stmt = $pdo->prepare("DELETE FROM sites WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Cannot delete site. It may be linked to employees or invoices."]);
        }
        exit;
    }
}

// Dashboard
if (preg_match('/^admin\/dashboard$/', $route)) {
    checkAdminAuth();
    if ($method === 'GET') {
        $today = date('Y-m-d');
        
        $employees_stmt = $pdo->query("SELECT COUNT(*) as count FROM employees WHERE status='ACTIVE'");
        $total_employees = $employees_stmt->fetch()['count'];
        
        $attendance_stmt = $pdo->prepare("SELECT status, COUNT(*) as count FROM attendance WHERE attendance_date=? GROUP BY status");
        $attendance_stmt->execute([$today]);
        $stats = $attendance_stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        $present = ($stats['PRESENT'] ?? 0) + ($stats['WORKING'] ?? 0);
        $working = $stats['WORKING'] ?? 0;
        
        // Live Attendance
        $live_stmt = $pdo->prepare("SELECT a.*, e.name as emp_name, s.name as site_name FROM attendance a JOIN employees e ON a.employee_id = e.id LEFT JOIN sites s ON a.site_id = s.id WHERE a.attendance_date = ? ORDER BY a.check_in_time DESC LIMIT 20");
        $live_stmt->execute([$today]);
        $live_attendance = $live_stmt->fetchAll();
        
        echo json_encode([
            "total_employees" => $total_employees,
            "present_today" => $present,
            "working_now" => $working,
            "live_attendance" => $live_attendance
        ]);
        exit;
    }
}

// Admin Attendance Report
if (preg_match('/^admin\/attendance-report$/', $route)) {
    checkAdminAuth();
    if ($method === 'GET') {
        $month = $_GET['month'] ?? date('m');
        $year = $_GET['year'] ?? date('Y');
        
        $start_date = "$year-$month-01";
        $end_date = date('Y-m-t', strtotime($start_date));
        
        $stmt = $pdo->prepare("
            SELECT a.attendance_date, a.status, e.id as emp_id, e.name as emp_name, e.daily_salary, COALESCE(e.city, s.city) as site_state
            FROM attendance a 
            JOIN employees e ON a.employee_id = e.id 
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN sites s ON e.site_id = s.id
            WHERE a.attendance_date BETWEEN ? AND ? 
            ORDER BY a.attendance_date ASC
        ");
        $stmt->execute([$start_date, $end_date]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group by date for frontend rendering
        $calendar = [];
        $summary = [];
        
        foreach ($records as $row) {
            $date = $row['attendance_date'];
            if (!isset($calendar[$date])) {
                $calendar[$date] = [];
            }
            $calendar[$date][] = [
                'emp_id' => $row['emp_id'],
                'name' => $row['emp_name'],
                'status' => $row['status']
            ];
            
            // Build summary per employee
            $empId = $row['emp_id'];
            if (!isset($summary[$empId])) {
                $summary[$empId] = [
                    'id' => $empId,
                    'name' => $row['emp_name'],
                    'state' => $row['site_state'],
                    'daily_salary' => (float)$row['daily_salary'],
                    'present_days' => 0,
                    'half_days' => 0,
                    'absent_days' => 0,
                    'holiday_days' => 0,
                    'total_salary' => 0
                ];
            }
            
            if ($row['status'] === 'PRESENT' || $row['status'] === 'WORKING') {
                $summary[$empId]['present_days'] += 1;
                $summary[$empId]['total_salary'] += (float)$row['daily_salary'];
            } elseif ($row['status'] === 'HALF_DAY') {
                $summary[$empId]['half_days'] += 1;
                $summary[$empId]['total_salary'] += 300; // Fixed flat rate for half days
            } elseif ($row['status'] === 'ABSENT' || $row['status'] === 'REJECTED') {
                $summary[$empId]['absent_days'] += 1;
            }
        }
        
        echo json_encode([
            'calendar' => $calendar,
            'summary' => array_values($summary)
        ]);
        exit;
    }
}

if (preg_match('/^admin\/attendance-list$/', $route)) {
    checkAdminAuth();
    if ($method === 'GET') {
        $date = $_GET['date'] ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            SELECT a.*, e.name as emp_name, e.emp_id as emp_code, s.name as site_name, s.code as site_code, t.name as team_name, COALESCE(e.city, s.city) as state, w.status as work_status, s.latitude as site_lat, s.longitude as site_lng
            FROM attendance a 
            JOIN employees e ON a.employee_id = e.id 
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN sites s ON a.site_id = s.id
            LEFT JOIN work_orders w ON a.id = w.attendance_id
            WHERE a.attendance_date = ?
            ORDER BY a.check_in_time DESC
        ");
        $stmt->execute([$date]);
        
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }
}

if (preg_match('/^admin\/attendance\/update-status$/', $route)) {
    checkAdminAuth();
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['emp_id'], $data['attendance_date'], $data['status'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields"]);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id FROM attendance WHERE employee_id = ? AND attendance_date = ?");
        $stmt->execute([$data['emp_id'], $data['attendance_date']]);
        if ($stmt->fetch()) {
            $stmt = $pdo->prepare("UPDATE attendance SET status = ? WHERE employee_id = ? AND attendance_date = ?");
            $stmt->execute([$data['status'], $data['emp_id'], $data['attendance_date']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO attendance (employee_id, attendance_date, status, clock_in_time, clock_in_photo, location_lat, location_lng) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$data['emp_id'], $data['attendance_date'], $data['status'], date('H:i:s'), 'manual_by_admin', '0', '0']);
        }
        
        echo json_encode(["success" => true]);
        exit;
    }
}

// Employee ME endpoints
if (preg_match('/^me$/', $route)) {
    checkEmployeeAuth();
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT id, emp_id, name, username, daily_salary, site_id, team_id, face_descriptor FROM employees WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $emp = $stmt->fetch();
        if ($emp) {
            $emp['face_registered'] = !empty($emp['face_descriptor']);
            
            $team_stmt = $pdo->prepare("SELECT * FROM teams WHERE id = ?");
            $team_stmt->execute([$emp['team_id']]);
            $emp['team'] = $team_stmt->fetch();
            
            if ($emp['team'] && $emp['team']['site_id']) {
                $emp['site_id'] = $emp['team']['site_id'];
            }
            
            $site_stmt = $pdo->prepare("SELECT * FROM sites WHERE id = ?");
            $site_stmt->execute([$emp['site_id']]);
            $emp['site'] = $site_stmt->fetch();
            
            echo json_encode($emp);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Employee not found"]);
        }
        exit;
    }
}

if (preg_match('/^me\/attendance$/', $route)) {
    checkEmployeeAuth();
    if ($method === 'GET') {
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?");
        $stmt->execute([$_SESSION['user_id'], $today]);
        echo json_encode(["today" => $stmt->fetch()]);
        exit;
    }
}

if (preg_match('/^me\/salary-report$/', $route)) {
    checkEmployeeAuth();
    if ($method === 'GET') {
        $id = $_SESSION['user_id'];
        $month = $_GET['month'] ?? date('m');
        $year = $_GET['year'] ?? date('Y');
        
        $start_date = "$year-$month-01";
        $end_date = date('Y-m-t', strtotime($start_date));
        
        $stmt = $pdo->prepare("
            SELECT a.attendance_date, a.status, e.daily_salary, e.name, COALESCE(e.state, t.state, s.state) as site_state
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN sites s ON e.site_id = s.id
            WHERE e.id = ? AND a.attendance_date BETWEEN ? AND ?
            ORDER BY a.attendance_date ASC
        ");
        $stmt->execute([$id, $start_date, $end_date]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $summary = [
            'present_days' => 0,
            'half_days' => 0,
            'absent_days' => 0,
            'total_salary' => 0,
            'daily_salary' => 0,
            'name' => '',
            'state' => '',
            'records' => $records
        ];
        
        foreach ($records as $row) {
            $summary['name'] = $row['name'];
            $summary['state'] = $row['site_state'];
            $summary['daily_salary'] = (float)$row['daily_salary'];
            if ($row['status'] === 'PRESENT' || $row['status'] === 'WORKING') {
                $summary['present_days'] += 1;
                $summary['total_salary'] += (float)$row['daily_salary'];
            } elseif ($row['status'] === 'HALF_DAY') {
                $summary['half_days'] += 1;
                $summary['total_salary'] += 300;
            } elseif ($row['status'] === 'ABSENT' || $row['status'] === 'REJECTED') {
                $summary['absent_days'] += 1;
            }
        }
        
        echo json_encode($summary);
        exit;
    }
}

if (preg_match('/^me\/site-status$/', $route)) {
    checkEmployeeAuth();
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare("SELECT site_id FROM employees WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $emp = $stmt->fetch();
        
        if (!$emp || !$emp['site_id']) {
            http_response_code(400);
            echo json_encode(["error" => "No site assigned to you."]);
            exit;
        }
        
        $upd = $pdo->prepare("UPDATE sites SET operational_status=?, requirements_note=? WHERE id=?");
        $upd->execute([
            $data['status'],
            $data['requirements'] ?? null,
            $emp['site_id']
        ]);
        
        echo json_encode(["success" => true]);
        exit;
    }
}

if (preg_match('/^me\/sites$/', $route)) {
    checkEmployeeAuth();
    if ($method === 'GET') {
        $search = $_GET['search'] ?? '';
        $query = "SELECT id, name, code, city, address FROM sites WHERE status = 'ACTIVE'";
        $params = [];
        if (!empty($search)) {
            $query .= " AND (name LIKE ? OR code LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        $query .= " ORDER BY name ASC LIMIT 20";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }
}

if (preg_match('/^me\/assign-site$/', $route)) {
    checkEmployeeAuth();
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['site_id'])) {
            http_response_code(400);
            echo json_encode(["error" => "Site ID is required"]);
            exit;
        }
        
        $stmt = $pdo->prepare("UPDATE employees SET site_id = ? WHERE id = ?");
        $stmt->execute([$data['site_id'], $_SESSION['user_id']]);
        
        // Dynamically geocode if site is missing coordinates
        $site_stmt = $pdo->prepare("SELECT address, latitude, longitude FROM sites WHERE id = ?");
        $site_stmt->execute([$data['site_id']]);
        $site = $site_stmt->fetch();
        
        if ($site && (empty($site['latitude']) || empty($site['longitude'])) && !empty($site['address'])) {
            $address = urlencode($site['address']);
            $url = "https://nominatim.openstreetmap.org/search?format=json&q={$address}";
            $options = [
                "http" => [
                    "header" => "User-Agent: HarshitInvoiceSystem/1.0\r\n"
                ]
            ];
            $context = stream_context_create($options);
            $response = @file_get_contents($url, false, $context);
            if ($response) {
                $geocode_data = json_decode($response, true);
                if (!empty($geocode_data) && isset($geocode_data[0]['lat']) && isset($geocode_data[0]['lon'])) {
                    $lat = $geocode_data[0]['lat'];
                    $lon = $geocode_data[0]['lon'];
                    $upd_stmt = $pdo->prepare("UPDATE sites SET latitude = ?, longitude = ? WHERE id = ?");
                    $upd_stmt->execute([$lat, $lon, $data['site_id']]);
                }
            }
        }
        
        echo json_encode(["success" => true]);
        exit;
    }
}

// Check IN / Check OUT
if (preg_match('/^attendance\/check-in$/', $route)) {
    checkEmployeeAuth();
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $emp_id = $_SESSION['user_id'];
        $today = date('Y-m-d');
        $time = date('Y-m-d H:i:s');
        
        // Ensure no duplicate
        $chk = $pdo->prepare("SELECT id FROM attendance WHERE employee_id=? AND attendance_date=?");
        $chk->execute([$emp_id, $today]);
        if ($chk->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Already checked in today"]);
            exit;
        }
        
        $site_id = $data['site_id'];
        
        // Geofence Validation
        $site_stmt = $pdo->prepare("SELECT latitude, longitude, geofence_radius FROM sites WHERE id = ?");
        $site_stmt->execute([$site_id]);
        $site = $site_stmt->fetch();
        
        $distance = null;
        $geofence_radius = 100; // Default
        
        if (!$site || empty($site['latitude']) || empty($site['longitude'])) {
            http_response_code(400);
            echo json_encode(["error" => "This site has not been configured with a valid attendance location. Please contact the administrator."]);
            exit;
        }

        $geofence_radius = $site['geofence_radius'] ? (int)$site['geofence_radius'] : 100;
        $distance = haversineGreatCircleDistance(
            (float)$data['lat'], (float)$data['lng'], 
            (float)$site['latitude'], (float)$site['longitude']
        );
        
        if ($distance > $geofence_radius) {
            http_response_code(400);
            echo json_encode([
                "error" => "You are outside the allowed attendance area.", 
                "distance" => round($distance, 2), 
                "radius" => $geofence_radius
            ]);
            exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO attendance (employee_id, site_id, attendance_date, status, check_in_time, check_in_lat, check_in_lng, check_in_acc, check_in_photo, check_in_face_score, check_in_distance, geofence_radius, daily_salary_snapshot) VALUES (?, ?, ?, 'WORKING', ?, ?, ?, ?, ?, ?, ?, ?, (SELECT daily_salary FROM employees WHERE id=?))");
        $photo_filename = processBase64Image($data['photo'] ?? null);
        
        $stmt->execute([
            $emp_id, $site_id, $today, $time, 
            $data['lat'], $data['lng'], $data['acc'], 
            $photo_filename, $data['face_score'] ?? null,
            $distance ? round($distance, 2) : null,
            $geofence_radius,
            $emp_id
        ]);
        
        echo json_encode(["success" => true, "time" => $time]);
        exit;
    }
}

if (preg_match('/^attendance\/check-out$/', $route)) {
    checkEmployeeAuth();
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $emp_id = $_SESSION['user_id'];
        $today = date('Y-m-d');
        $time = date('Y-m-d H:i:s');
        
        $chk = $pdo->prepare("SELECT id, check_in_time, daily_salary_snapshot FROM attendance WHERE employee_id=? AND attendance_date=?");
        $chk->execute([$emp_id, $today]);
        $record = $chk->fetch();
        if (!$record) {
            http_response_code(400);
            echo json_encode(["error" => "No check-in found for today"]);
            exit;
        }
        
        $check_in_time = new DateTime($record['check_in_time']);
        $check_out_time = new DateTime($time);
        $diff = $check_in_time->diff($check_out_time);
        $minutes = ($diff->days * 24 * 60) + ($diff->h * 60) + $diff->i;
        
        $status = 'PRESENT';
        $earned = $record['daily_salary_snapshot'];
        
        // Geofence Calculation for checkout
        $site_id = $record['site_id'];
        $distance = null;
        if ($site_id) {
            $site_stmt = $pdo->prepare("SELECT latitude, longitude, geofence_radius FROM sites WHERE id = ?");
            $site_stmt->execute([$site_id]);
            $site = $site_stmt->fetch();
            if ($site && !empty($site['latitude']) && !empty($site['longitude'])) {
                $distance = haversineGreatCircleDistance(
                    (float)$data['lat'], (float)$data['lng'], 
                    (float)$site['latitude'], (float)$site['longitude']
                );
            }
        }
        
        $photo_filename = processBase64Image($data['photo'] ?? null);
        
        $stmt = $pdo->prepare("UPDATE attendance SET status=?, check_out_time=?, check_out_lat=?, check_out_lng=?, check_out_acc=?, check_out_photo=?, check_out_face_score=?, check_out_distance=?, working_minutes=?, earned_salary=? WHERE id=?");
        $stmt->execute([
            $status, $time, 
            $data['lat'], $data['lng'], $data['acc'], 
            $photo_filename, $data['face_score'] ?? null, 
            $distance ? round($distance, 2) : null,
            $minutes, $earned, $record['id']
        ]);
        
        echo json_encode(["success" => true, "time" => $time, "minutes" => $minutes, "status" => $status]);
        exit;
    }
}
?>
