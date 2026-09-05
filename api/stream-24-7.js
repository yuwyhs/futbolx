const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    const streamsDir = path.join(process.cwd(), 'api', 'streams');

    const categories = {
      "Sports": "sports.json",
      "Entertainment": "entertainment.json",
      "Kids": "kids.json",
      "Music": "music.json",
      "Movies VOD": "movies-vod.json",
      "News": "news.json",
      "Religion": "religion.json",
      "Anime": "anime.json",
      "Movies Live": "movies-live.json"
    };

    const streams = {};

    for (const [category, fileName] of Object.entries(categories)) {
      const filePath = path.join(streamsDir, fileName);

      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        streams[category] = JSON.parse(data);
      } else {
        streams[category] = [];
      }
    }

    res.status(200).json({
      success: true,
      streams
    });

  } catch (error) {
    console.error('Failed to load 24/7 streams:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to load streams'
    });
  }
};
