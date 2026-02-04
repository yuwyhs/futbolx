let messages = [];
let mutedUsers = new Set();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, text } = req.body;

  if (!username || !text) {
    return res.status(400).json({ error: 'Username and message required' });
  }

  const lowerUser = username.toLowerCase();
  const isOwner = lowerUser === 'optimus';

  // Check if muted
  if (mutedUsers.has(lowerUser) && !isOwner) {
    return res.status(403).json({ error: 'You are muted' });
  }

  // Handle owner commands
  if (isOwner && text.startsWith('/')) {
    const [cmd, ...args] = text.slice(1).trim().split(/\s+/);

    if (cmd === 'clear') {
      messages = [];
      broadcast({ type: 'system', text: 'Chat cleared by owner' });
      return res.status(200).json({ success: true });
    }

    if (cmd === 'mute' && args[0]) {
      const target = args[0].replace('@', '').toLowerCase();
      mutedUsers.add(target);
      broadcast({ type: 'system', text: `@${target} has been muted by owner` });
      return res.status(200).json({ success: true });
    }

    if (cmd === 'unmute' && args[0]) {
      const target = args[0].replace('@', '').toLowerCase();
      mutedUsers.delete(target);
      broadcast({ type: 'system', text: `@${target} has been unmuted` });
      return res.status(200).json({ success: true });
    }

    if (cmd === 'kick' && args[0]) {
      const target = args[0].replace('@', '').toLowerCase();
      broadcast({ type: 'system', text: `@${target} has been kicked from chat` });
      return res.status(200).json({ success: true });
    }
  }

  // Normal message
  const message = {
    username,
    text,
    timestamp: Date.now()
  };

  messages.push(message);
  // Keep only last 200 messages
  if (messages.length > 200) messages.shift();

  broadcast(message);

  res.status(200).json({ success: true });
}

// Helper to send to all connected clients
function broadcast(data) {
  // In real app you'd use a pub/sub or redis
  // For this simple version we just log (SSE will see new messages on refresh)
  console.log('Broadcast:', data);
}
