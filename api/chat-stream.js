export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send current messages to new client
  messages.forEach(msg => {
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    res.end();
  });
}

// This is global in Vercel serverless (shared until redeploy)
let messages = [];
