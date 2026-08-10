// api/token.js
const crypto = require('crypto');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { stream } = req.query;

  if (!stream) {
    return res.status(400).json({ error: 'Missing stream parameter' });
  }

  const SECRET_KEY = process.env.STREAM_SECRET_KEY || 'my_super_secret_key_123';
  const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://fix.futx.sryze.cc';

  // Flussonic token timestamps
  const now = Math.floor(Date.now() / 1000);
  const start = now - 300;  // 5-minute buffer for time drift
  const end = now + 3600;   // Token expires in 1 hour
  const ip = 'no_check_ip';
  const salt = crypto.randomBytes(8).toString('hex');

  // Flussonic SHA-1 formula: stream + ip + start + end + secret + salt
  const stringToHash = `${stream}${ip}${start}${end}${SECRET_KEY}${salt}`;
  const hash = crypto.createHash('sha1').update(stringToHash).digest('hex');

  // Format: hash-salt-endtime-starttime
  const token = `${hash}-${salt}-${end}-${start}`;

  // Complete tokenized M3U8 URL
  const tokenizedUrl = `${CDN_BASE_URL}/${stream}/index.m3u8?token=${token}`;

  return res.status(200).json({ url: tokenizedUrl });
};
