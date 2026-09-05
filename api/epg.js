const https = require('https');

const EPG_URL = 'https://tv.futtv.nx.kg/epg';

let cachedData = null;
let cachedAt = 0;

// Refresh the EPG cache every 10 minutes
const CACHE_TIME = 10 * 60 * 1000;

function fetchEPG() {
  return new Promise((resolve, reject) => {
    const request = https.get(
      EPG_URL,
      {
        headers: {
          'User-Agent': 'FutbolX EPG/1.0',
          'Accept': 'application/xml,text/xml,*/*'
        }
      },
      (response) => {
        let data = '';

        response.setEncoding('utf8');

        response.on('data', chunk => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new Error(`EPG server returned HTTP ${response.statusCode}`)
            );
            return;
          }

          if (!data.trim()) {
            reject(new Error('EPG response was empty'));
            return;
          }

          resolve(data);
        });
      }
    );

    request.setTimeout(20000, () => {
      request.destroy(new Error('EPG request timed out'));
    });

    request.on('error', reject);
  });
}

function decodeXML(text) {
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripTags(text) {
  return decodeXML(
    String(text)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]*>/g, '')
      .trim()
  );
}

function getTag(block, tag) {
  const regex = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    'i'
  );

  const match = block.match(regex);

  return match ? stripTags(match[1]) : '';
}

function getAttribute(text, attribute) {
  const regex = new RegExp(
    `${attribute}\\s*=\\s*["']([^"']+)["']`,
    'i'
  );

  const match = text.match(regex);

  return match ? decodeXML(match[1]) : '';
}

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function parseEPG(xml) {
  const channels = {};
  const programmes = [];

  // Parse channels
  const channelRegex = /<channel\b[^>]*>([\s\S]*?)<\/channel>/gi;

  let match;

  while ((match = channelRegex.exec(xml)) !== null) {
    const block = match[0];
    const content = match[1];

    const id = getAttribute(block, 'id');

    if (!id) continue;

    const displayName = getTag(content, 'display-name');

    channels[id] = {
      id,
      name: displayName || id,
      normalized: normalizeName(displayName || id)
    };
  }

  // Parse programmes
  const programmeRegex =
    /<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi;

  while ((match = programmeRegex.exec(xml)) !== null) {
    const attributes = match[1];
    const content = match[2];

    const channel = getAttribute(attributes, 'channel');
    const start = getAttribute(attributes, 'start');
    const stop = getAttribute(attributes, 'stop');

    if (!channel || !start || !stop) continue;

    const title = getTag(content, 'title');

    if (!title) continue;

    const description = getTag(content, 'desc');

    programmes.push({
      channel,
      title,
      description,
      start,
      stop
    });
  }

  return {
    success: true,
    updated_at: new Date().toISOString(),
    channels,
    programmes
  };
}

module.exports = async function handler(req, res) {
  try {
    // Allow GET only
    if (req.method && req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    const now = Date.now();

    // Use cache when still fresh
    if (cachedData && now - cachedAt < CACHE_TIME) {
      res.setHeader('Cache-Control', 'public, max-age=600');

      return res.status(200).json({
        ...cachedData,
        cached: true,
        cache_age_seconds: Math.floor((now - cachedAt) / 1000)
      });
    }

    // Fetch fresh EPG
    const xml = await fetchEPG();

    const parsed = parseEPG(xml);

    cachedData = parsed;
    cachedAt = now;

    res.setHeader('Cache-Control', 'public, max-age=600');

    return res.status(200).json({
      ...parsed,
      cached: false,
      cache_age_seconds: 0
    });

  } catch (error) {
    console.error('EPG API error:', error);

    // If the external EPG is temporarily unavailable,
    // return previously cached data if we have it.
    if (cachedData) {
      return res.status(200).json({
        ...cachedData,
        cached: true,
        stale: true
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to load EPG',
      details: error.message
    });
  }
};
