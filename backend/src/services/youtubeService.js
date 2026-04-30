import https from 'https';

/**
 * Search YouTube and get direct play link for the first video result
 * No API key needed — scrapes the search results page
 * @param {string} query - Search query
 * @returns {Promise<string>} Direct YouTube watch URL with autoplay
 */
export function getFirstYouTubeVideo(query) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  return new Promise((resolve) => {
    const req = https.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          // Extract first videoId from YouTube's inline JSON data
          const videoIdMatch = data.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
          if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            const playUrl = `https://www.youtube.com/watch?v=${videoId}&autoplay=1`;
            console.log(`🎬 YouTube: Found video ${videoId} for "${query}"`);
            resolve(playUrl);
          } else {
            console.log(`⚠️ YouTube: No video found, falling back to search`);
            resolve(searchUrl);
          }
        } catch {
          resolve(searchUrl);
        }
      });
    });

    req.on('error', () => {
      console.log(`⚠️ YouTube: Network error, falling back to search`);
      resolve(searchUrl);
    });

    // Timeout after 5 seconds
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(searchUrl);
    });
  });
}
