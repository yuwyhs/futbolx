// api/token.js
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { stream, url } = req.query;

  const SECRET_KEY = process.env.STREAM_SECRET_KEY || 'my_super_secret_key_123';
  const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://hotelfix.futx.sryze.cc';

  /*
   * NEW:
   * If live.html sends the complete M3U8 URL, decide here
   * whether it belongs to the currently configured token CDN.
   */
  if (url) {
    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid stream URL' });
    }

    let configuredCdn;

    try {
      configuredCdn = new URL(CDN_BASE_URL);
    } catch {
      return res.status(500).json({ error: 'Invalid CDN_BASE_URL configuration' });
    }

    /*
     * Compare the hostname here.
     * live.html does NOT need to know what the current CDN is.
     */
    if (
      parsedUrl.hostname.toLowerCase() !==
      configuredCdn.hostname.toLowerCase()
    ) {
      return res.status(200).json({
        url: url,
        tokenized: false
      });
    }

    /*
     * Extract the stream name from:
     *
     * /CHANNEL_NAME/index.m3u8
     *
     * Also supports a CDN_BASE_URL that has a path.
     */
    let streamName = parsedUrl.pathname;

    const configuredBasePath = configuredCdn.pathname.replace(/\/+$/, '');

    if (
      configuredBasePath &&
      configuredBasePath !== '/' &&
      streamName.startsWith(configuredBasePath)
    ) {
      streamName = streamName.slice(configuredBasePath.length);
    }

    streamName = streamName
      .replace(/^\/+/, '')
      .replace(/\/index\.m3u8$/i, '')
      .replace(/\/+$/, '');

    if (!streamName) {
      return res.status(400).json({
        error: 'Unable to determine stream name from URL'
      });
    }

    return generateTokenizedUrl(
      streamName,
      SECRET_KEY,
      CDN_BASE_URL,
      req,
      res
    );
  }

  /*
   * OLD /api/token?stream=CHANNEL_NAME support.
   * Kept so anything else using the old API continues working.
   */
  if (!stream) {
    return res.status(400).json({
      error: 'Missing stream or url parameter'
    });
  }

  return generateTokenizedUrl(
    stream,
    SECRET_KEY,
    CDN_BASE_URL,
    req,
    res
  );
};


/*
 * Generate the Flussonic token.
 */
function generateTokenizedUrl(stream, SECRET_KEY, CDN_BASE_URL, req, res) {
  // Get real user IP from Vercel headers
  const userIp =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress;

  const now = Math.floor(Date.now() / 1000);
  const start = now - 300;
  const end = now + 60;

  const salt = crypto.randomBytes(8).toString('hex');

  // Flussonic SHA1 formula using real user IP
  const stringToHash =
    `${stream}${userIp}${start}${end}${SECRET_KEY}${salt}`;

  const hash = crypto
    .createHash('sha1')
    .update(stringToHash)
    .digest('hex');

  const token = `${hash}-${salt}-${end}-${start}`;

  const cleanCdnBaseUrl = CDN_BASE_URL.replace(/\/+$/, '');

  const tokenizedUrl =
    `${cleanCdnBaseUrl}/${stream}/index.m3u8?token=${token}`;

  return res.status(200).json({
    url: tokenizedUrl,
    tokenized: true
  });
}
