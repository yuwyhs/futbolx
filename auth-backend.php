<?php
header('Content-Type: text/plain');

// Get data from Flussonic's POST request
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Required fields from Flussonic
$client_ip     = $data['ip'] ?? '';
$user_agent    = $data['user_agent'] ?? '';
$referer       = $data['referer'] ?? '';  // This is the key for domain lock
$stream_name   = $data['name'] ?? '';     // e.g. 'test'

// Your allowed domains (add variations as needed)
$allowed_domains = [
    'futbol-x.site',
    'www.futbol-x.site',
    'https://futbol-x.site',
    'http://futbol-x.site',
];

// Check if Referer matches one of allowed (case-insensitive, partial match ok)
$allowed = false;
$referer_lower = strtolower($referer);
foreach ($allowed_domains as $domain) {
    if (strpos($referer_lower, strtolower($domain)) !== false) {
        $allowed = true;
        break;
    }
}

// Also allow if no referer but perhaps from trusted IP (optional, less secure)
// if (empty($referer) && $client_ip === 'YOUR_SERVER_IP') { $allowed = true; }

if ($allowed) {
    // Allow playback
    echo "200 OK\n";
    // Optional: echo "session_id=abc123\n"; if you want to track sessions
} else {
    // Deny (VLC/direct/other sites/no referer)
    http_response_code(403);
    echo "403 Forbidden\n";
    echo "reason=Invalid referer\n";
}
?>
