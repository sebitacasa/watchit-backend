require("dotenv").config();
const express = require('express');
const axios = require('axios');
const router = express.Router();
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;



router.get('/youtube-search', async (req, res) => {
  const { searchQuery } = req.query;

  try {
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          maxResults: 10,
          key: YOUTUBE_API_KEY
        },
      }
    );

    const results = response.data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
    }));

    res.json(results);
  } catch (error) {
    console.error('YouTube search error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from YouTube' });
  }
});

module.exports = router;