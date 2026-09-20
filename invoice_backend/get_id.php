<?php require 'api/db.php'; $stmt = $pdo->query('SELECT id FROM invoices LIMIT 1'); print_r($stmt->fetch());
