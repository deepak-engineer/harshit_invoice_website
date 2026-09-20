<?php
require 'vendor/autoload.php';
require 'api/db.php';
require 'api/export.php';
generateExcel(1, $pdo, 'pdf');
