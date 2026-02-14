<?php
header('Content-Type: text/plain');

$stream_name = $_GET['name']    ?? '';
$token       = $_GET['token']   ?? '';
$client_ip   = $_GET['ip']      ?? '';
$referer     = $_SERVER['HTTP_REFERER'] ?? '';

$allowed_domains = [
    'futbol-x.site',
    'www.futbol-x.site',
    'damn.futbol-x.site'
];

$referer_valid = false;
foreach ($allowed_domains as $domain) {
    if (stripos($referer, $domain) !== false) {
        $referer_valid = true;
        break;
    }
}

if (!$referer_valid && $referer !== '') {
    http_response_code(403);
    echo "Invalid referer";
    exit;
}

$psg_token = 'psg-test-2026-finest-1402';

if ($token === $psg_token) {
    http_response_code(200);
    header('X-Max-Sessions: 2');
    header('X-AuthDuration: 7200');
    echo "OK";
} else {
    http_response_code(403);
    echo "Forbidden";
}
?>
