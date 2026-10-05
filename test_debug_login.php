<?php
$data = json_encode(['username' => 'superadmin', 'password' => 'superadmin123', 'role' => 'admin']);
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => $data,
        'ignore_errors' => true,
    ]
];
$context  = stream_context_create($options);
$result = file_get_contents('https://lavender-spoonbill-208950.hostingersite.com/invoice_backend/api/debug_login.php', false, $context);
echo "Result:\n$result\n";
?>
