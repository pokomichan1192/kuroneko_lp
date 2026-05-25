/**
 * youtube-loader.js - YouTube Data API v3で最新動画を自動取得
 * フォールバック: data/youtube.json
 * キャッシュ: localStorage（1時間）
 */

var YOUTUBE_CONFIG = {
  apiKey: 'AIzaSyAMVCJuzQUTb0oJpJd1mL7kidDpK0lV1R8',
  channelId: 'UC8wrPmR-fklVWah2jF9Zx_w',
  cacheKey: 'kuroneko_youtube_cache',
  cacheDuration: 60 * 60 * 1000 // 1時間
};

document.addEventListener('DOMContentLoaded', function () {
  var container = document.querySelector('.youtube-grid');
  if (!container) return;

  var limit = container.dataset.limit ? parseInt(container.dataset.limit) : 4;

  // キャッシュをチェック
  var cached = getCache();
  if (cached) {
    renderYouTube(container, cached.slice(0, limit));
    return;
  }

  // APIから取得
  fetchFromAPI(limit)
    .then(function (videos) {
      setCache(videos);
      renderYouTube(container, videos.slice(0, limit));
    })
    .catch(function () {
      // フォールバック: JSONファイルから取得
      fetchFromJSON(limit, container);
    });
});

function fetchFromAPI(maxResults) {
  var url = 'https://www.googleapis.com/youtube/v3/search' +
    '?part=snippet' +
    '&channelId=' + YOUTUBE_CONFIG.channelId +
    '&type=video' +
    '&order=date' +
    '&maxResults=' + maxResults +
    '&key=' + YOUTUBE_CONFIG.apiKey;

  return fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('API error');
      return res.json();
    })
    .then(function (data) {
      if (!data.items || data.items.length === 0) throw new Error('No items');

      return data.items.map(function (item) {
        var date = new Date(item.snippet.publishedAt);
        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          date: date.getFullYear() + '.' +
            String(date.getMonth() + 1).padStart(2, '0') + '.' +
            String(date.getDate()).padStart(2, '0')
        };
      });
    });
}

function fetchFromJSON(limit, container) {
  fetch('data/youtube.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var items = limit ? data.slice(0, limit) : data;
      renderYouTube(container, items);
    })
    .catch(function (err) {
      console.error('YouTube フォールバックも失敗:', err);
    });
}

function renderYouTube(container, items) {
  container.innerHTML = items.map(function (item) {
    var thumbnailUrl = 'https://i.ytimg.com/vi/' + item.videoId + '/hqdefault.jpg';
    var videoUrl = 'https://www.youtube.com/watch?v=' + item.videoId;

    return '<a href="' + escapeHtml(videoUrl) + '" target="_blank" rel="noopener noreferrer" class="youtube-card">' +
      '<div class="youtube-card-thumbnail">' +
        '<img src="' + escapeHtml(thumbnailUrl) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
        '<div class="youtube-play-btn"></div>' +
      '</div>' +
      '<p class="youtube-card-title">' + escapeHtml(item.title) + '</p>' +
      '<p class="youtube-card-date">' + escapeHtml(item.date) + '</p>' +
    '</a>';
  }).join('');
}

function getCache() {
  try {
    var raw = localStorage.getItem(YOUTUBE_CONFIG.cacheKey);
    if (!raw) return null;
    var cache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > YOUTUBE_CONFIG.cacheDuration) {
      localStorage.removeItem(YOUTUBE_CONFIG.cacheKey);
      return null;
    }
    return cache.data;
  } catch (e) {
    return null;
  }
}

function setCache(data) {
  try {
    localStorage.setItem(YOUTUBE_CONFIG.cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));
  } catch (e) {}
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
