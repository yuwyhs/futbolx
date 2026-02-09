<?php
// ---------------------------------------------------------------
//  PROTECTED M3U8 LINK - stream: test
// ---------------------------------------------------------------
// IMPORTANT: Replace the line below with YOUR REAL securerlink key
$secret = 'kX9mPqW3zT8rY2vL6nJ5cF4hB7uA1eD0xQ';     // ← CHANGE THIS !!!

$stream_name = 'test';

// How long should the link be valid?
$valid_for_seconds = 7200;      // 2 hours
// $valid_for_seconds = 3600;   // 1 hour
// $valid_for_seconds = 1800;   // 30 minutes

// ---------------------------------------------------------------
$valid_until = time() + $valid_for_seconds;

// Most compatible token format (includes IP)
$token_string = $_SERVER['REMOTE_ADDR'] . $stream_name . $valid_until . $secret;
$token = sha1($token_string);

// If many users have connectivity issues → use this version instead:
// $token_string = $stream_name . $valid_until . $secret;
// $token = sha1($token_string);

$m3u8_url = "https://ppv.futbol-x.site/{$stream_name}/index.m3u8?token={$token}&e={$valid_until}";
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Stream - Protected Link</title>
  <style>
    body {
      background: #0d1117;
      color: #c9d1d9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      text-align: center;
    }
    .container {
      max-width: 780px;
      margin: 0 auto;
    }
    h1 {
      color: #58a6ff;
    }
    .link-container {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
      word-break: break-all;
      font-family: ui-monospace, monospace;
      font-size: 15px;
      line-height: 1.5;
    }
    .valid-until {
      color: #8b949e;
      margin: 16px 0;
    }
    .success {
      color: #3fb950;
      font-weight: 600;
    }
    button {
      background: #238636;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 12px;
    }
    button:hover {
      background: #2ea043;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Test Stream</h1>

    <div class="valid-until">
      Link valid until: <span class="success"><?= date('Y-m-d H:i:s', $valid_until) ?></span>
      (<?= floor($valid_for_seconds / 3600) ?> hours)
    </div>

    <div class="link-container">
      <?= htmlspecialchars($m3u8_url) ?>
    </div>

    <p style="color:#8b949e; margin-top:20px;">
      Copy the link above and paste it into your player.
    </p>

    <button onclick="copyLink()">Copy link to clipboard</button>

    <script>
      function copyLink() {
        navigator.clipboard.writeText(<?= json_encode($m3u8_url) ?>)
          .then(() => alert('Link copied! Paste it in your player.'))
          .catch(() => alert('Could not copy — please select manually'));
      }
    </script>
  </div>
</body>
</html>
