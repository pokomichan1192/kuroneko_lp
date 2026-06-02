/**
 * data-loader.js - JSONデータを読み込んで各セクションを描画
 */

document.addEventListener('DOMContentLoaded', function () {
  loadTopics();
  loadWorks();
  loadGoods();
  // YouTubeはyoutube-loader.jsで処理
  loadGallery();
});

/* ========================================
   Topics
   ======================================== */
function loadTopics() {
  var container = document.querySelector('.topics-embed');
  if (!container) return;

  fetch('data/topics.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      renderTopics(container, data);
    })
    .catch(function (err) {
      console.error('Topics データの読み込みに失敗:', err);
    });
}

function renderTopics(container, items) {
  container.innerHTML = '';

  // ツイートURLからIDを抽出
  function getTweetId(url) {
    var match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  }

  function createTweets() {
    items.forEach(function (item) {
      var tweetId = getTweetId(item.tweet_url);
      if (!tweetId) return;

      var wrapper = document.createElement('div');
      wrapper.className = 'topics-tweet-wrapper';
      container.appendChild(wrapper);

      twttr.widgets.createTweet(tweetId, wrapper, {
        lang: 'ja',
        width: 550,
        conversation: 'none'
      });
    });
  }

  // twttr.widgets が使えるまで待機
  if (typeof twttr !== 'undefined' && twttr.widgets) {
    createTweets();
  } else {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (typeof twttr !== 'undefined' && twttr.widgets) {
        createTweets();
        clearInterval(timer);
      } else if (attempts > 30) {
        clearInterval(timer);
      }
    }, 500);
  }
}

/* ========================================
   Works
   ======================================== */
function loadWorks() {
  var container = document.querySelector('.works-list');
  if (!container) return;

  var limit = container.dataset.limit ? parseInt(container.dataset.limit) : null;

  fetch('data/works.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var items = limit ? data.slice(0, limit) : data;
      renderWorks(container, items);
    })
    .catch(function (err) {
      console.error('Works データの読み込みに失敗:', err);
    });
}

function renderWorks(container, items) {
  container.innerHTML = items.map(function (item) {
    return '<div class="works-item">' +
      '<span class="works-category">' + escapeHtml(item.category) + '</span>' +
      '<span class="works-title">' + escapeHtml(item.title) + '</span>' +
      '<span class="works-date">' + escapeHtml(item.date) + '</span>' +
      '</div>';
  }).join('');
}

/* ========================================
   Goods
   ======================================== */
function loadGoods() {
  var container = document.querySelector('.goods-grid');
  if (!container) return;

  var limit = container.dataset.limit ? parseInt(container.dataset.limit) : null;

  fetch('data/goods.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var items = limit ? data.slice(0, limit) : data;
      renderGoods(container, items);
    })
    .catch(function (err) {
      console.error('Goods データの読み込みに失敗:', err);
    });
}

function renderGoods(container, items) {
  container.innerHTML = items.map(function (item) {
    return '<a href="' + escapeHtml(item.link) + '" target="_blank" rel="noopener noreferrer" class="goods-card">' +
      '<div class="goods-card-image">' +
        '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '" loading="lazy">' +
      '</div>' +
      '<div class="goods-card-info">' +
        '<p class="goods-card-name">' + escapeHtml(item.name) + '</p>' +
        '<div class="goods-card-bottom">' +
          '<p class="goods-card-price">' + escapeHtml(item.price) + '</p>' +
          '<span class="goods-card-cart">' +
            '<svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.16 14.26l.04-.12.94-1.7h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20.04 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z"/></svg>' +
          '</span>' +
        '</div>' +
      '</div>' +
    '</a>';
  }).join('');
}

/* ========================================
   YouTube
   ======================================== */
function loadYouTube() {
  var container = document.querySelector('.youtube-grid');
  if (!container) return;

  var limit = container.dataset.limit ? parseInt(container.dataset.limit) : null;

  fetch('data/youtube.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var items = limit ? data.slice(0, limit) : data;
      renderYouTube(container, items);
    })
    .catch(function (err) {
      console.error('YouTube データの読み込みに失敗:', err);
    });
}

function renderYouTube(container, items) {
  container.innerHTML = items.map(function (item) {
    var thumbnailUrl = 'https://img.youtube.com/vi/' + item.videoId + '/maxresdefault.jpg';
    var videoUrl = 'https://www.youtube.com/watch?v=' + item.videoId;

    return '<a href="' + videoUrl + '" target="_blank" rel="noopener noreferrer" class="youtube-card">' +
      '<div class="youtube-card-thumbnail">' +
        '<img src="' + thumbnailUrl + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
        '<div class="youtube-play-btn"></div>' +
      '</div>' +
      '<p class="youtube-card-title">' + escapeHtml(item.title) + '</p>' +
      '<p class="youtube-card-date">' + escapeHtml(item.date) + '</p>' +
    '</a>';
  }).join('');
}

/* ========================================
   Gallery
   ======================================== */
function loadGallery() {
  var container = document.querySelector('.gallery-grid');
  if (!container) return;

  var limit = container.dataset.limit ? parseInt(container.dataset.limit) : null;

  fetch('data/gallery.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var items = limit ? data.slice(0, limit) : data;
      renderGallery(container, items);
    })
    .catch(function (err) {
      console.error('Gallery データの読み込みに失敗:', err);
    });
}

function renderGallery(container, items) {
  container.innerHTML = items.map(function (item, index) {
    var isComingSoon = item.image.indexOf('coming-soon') !== -1;
    var hasLink = item.link ? true : false;
    var classes = 'gallery-item' + (isComingSoon ? ' gallery-item--disabled' : '');
    var dataAttrs = hasLink ? ' data-link="' + escapeHtml(item.link) + '"' : ' data-index="' + index + '"';

    return '<div class="' + classes + '"' + dataAttrs + '>' +
      '<div class="gallery-item-image">' +
        '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.label) + '" loading="lazy">' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ========================================
   Utility
   ======================================== */
function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
