const sports = require('./streams/sports.json');
const entertainment = require('./streams/entertainment.json');
const kids = require('./streams/kids.json');
const music = require('./streams/music.json');
const movies = require('./streams/movies.json');
const news = require('./streams/news.json');
const anime = require('./streams/anime.json');

module.exports = function handler(req, res) {
  try {
    const streams = {
      Sports: Array.isArray(sports) ? sports : [],
      Entertainment: Array.isArray(entertainment) ? entertainment : [],
      Kids: Array.isArray(kids) ? kids : [],
      Music: Array.isArray(music) ? music : [],
      Movies: Array.isArray(movies) ? movies : [],
      News: Array.isArray(news) ? news : [],
      Anime: Array.isArray(anime) ? anime : []
    };

    return res.status(200).json({
      success: true,
      streams
    });

  } catch (error) {
    console.error('24/7 API error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to load streams',
      details: error.message
    });
  }
};
