<?php
require 'invoice_backend/api/db.php';
\ = \->query('SHOW TABLES');
\ = \->fetchAll(PDO::FETCH_COLUMN);
print_r(\);
