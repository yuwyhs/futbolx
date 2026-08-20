// api/token.js
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { stream } = req.query;
  if (!stream) return res.status(400).json({ error: 'Missing stream parameter' });

  const SECRET_KEY = process.env.STREAM_SECRET_KEY || 'my_super_secret_key_123';
  const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://hotelfix.futx.sryze.cc';

  // Get real user IP from Vercel headers
  const userIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;

  const now = Math.floor(Date.now() / 1000);
  const start = now - 300; 
  const end = now + 60; // Token expires in 60s (prevents sharing links)
  const salt = crypto.randomBytes(8).toString('hex');

  // Flussonic SHA1 formula using real user IP
  const stringToHash = `${stream}${userIp}${start}${end}${SECRET_KEY}${salt}`;
  const hash = crypto.createHash('sha1').update(stringToHash).digest('hex');

  const token = `${hash}-${salt}-${end}-${start}`;
  const tokenizedUrl = `${CDN_BASE_URL}/${stream}/index.m3u8?token=${token}`;

  return res.status(200).json({ url: tokenizedUrl });
};
