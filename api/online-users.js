const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const COMETCHAT_API_KEY = process.env.COMETCHAT_API_KEY; // Set in Vercel dashboard
  try {
    const response = await fetch('https://2800057b1ec120ce.api-us.cometchat.io/v3.0/users?status=online', {
      method: 'GET',
      headers: {
        'apiKey': COMETCHAT_API_KEY,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.status(200).json({ onlineCount: data.data?.length || 0 });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ onlineCount: 0 });
  }
};
