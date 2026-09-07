/**
 * game-loader.js - GAMEページ（一覧→詳細→遊ぶ）
 * URLハッシュ（#game-id）で一覧/詳細を切り替える
 */

var GAME_DATA_URL = 'data/games.json';
var gameItems = [];

document.addEventListener('DOMContentLoaded', function () {
  loadGames();
  window.addEventListener('hashchange', renderGameView);
});

/**
 * games.json を読み込み、初回描画する
 */
function loadGames() {
  fetch(GAME_DATA_URL)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      gameItems = data;
      renderGameView();
    })
    .catch(function (err) {
      console.error('Game データの読み込みに失敗:', err);
    });
}

/**
 * ハッシュに応じて一覧 or 詳細を表示
 */
function renderGameView() {
  var listView = document.getElementById('game-list-view');
  var detailView = document.getElementById('game-detail-view');
  if (!listView || !detailView) return;

  var id = getGameIdFromHash();
  var game = id ? findGameById(id) : null;

  if (game) {
    renderGameDetail(document.getElementById('game-detail'), game);
    listView.classList.remove('is-active');
    detailView.classList.add('is-active');
    window.scrollTo(0, 0);
  } else {
    renderGameList(document.getElementById('game-list'), gameItems);
    detailView.classList.remove('is-active');
    listView.classList.add('is-active');
  }
}

function getGameIdFromHash() {
  var hash = window.location.hash.replace(/^#\/?/, '');
  return hash ? decodeURIComponent(hash) : '';
}

function findGameById(id) {
  for (var i = 0; i < gameItems.length; i++) {
    if (gameItems[i].id === id) return gameItems[i];
  }
  return null;
}

/**
 * 一覧（カード）を描画
 */
function renderGameList(container, items) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<p class="game-empty">公開中のゲームはまだありません。</p>';
    return;
  }
  container.innerHTML = items.map(function (item) {
    return '<a href="#' + encodeURIComponent(item.id) + '" class="game-card">' +
      renderGameThumb(item) +
      '<div class="game-card-info">' +
        renderTags(item.tags) +
        '<h3 class="game-card-title">' + escapeHtml(item.title) + '</h3>' +
        '<p class="game-card-catch">' + escapeHtml(item.catch) + '</p>' +
        '<span class="game-card-more">VIEW MORE →</span>' +
      '</div>' +
    '</a>';
  }).join('');
}

/**
 * 詳細を描画
 */
function renderGameDetail(container, game) {
  if (!container) return;
  container.innerHTML =
    '<a href="#" class="game-back">← 一覧に戻る</a>' +
    '<div class="game-detail-head">' +
      renderGameThumb(game) +
      '<div>' +
        renderTags(game.tags) +
        '<h3 class="game-detail-title">' + escapeHtml(game.title) + '</h3>' +
        '<p class="game-detail-catch">' + escapeHtml(game.catch) + '</p>' +
        '<div class="game-detail-desc">' + renderParagraphs(game.description) + '</div>' +
        '<a href="' + escapeHtml(game.link) + '" target="_blank" rel="noopener noreferrer" class="btn-play">' +
          '<img src="img/decorations/paw-gold.svg" alt="" class="btn-play-paw">遊ぶ' +
        '</a>' +
        '<span class="btn-play-note">※ 新しいタブで外部サイトが開きます</span>' +
      '</div>' +
    '</div>' +
    '<div class="game-blocks">' +
      renderBlock('こんな人に遊んでほしい', renderList(game.recommend, 'ul')) +
      renderBlock('対応環境', renderList(game.devices, 'ul') + renderList(game.notes, 'ul')) +
      '<div class="game-block game-block-wide">' +
        '<h4 class="game-block-title">遊び方</h4>' +
        renderList(game.howto, 'ol') +
        (game.tips ? '<p class="game-block-tips">💡 ' + escapeHtml(game.tips) + '</p>' : '') +
      '</div>' +
    '</div>';
}

function renderGameThumb(item) {
  var inner = item.image
    ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">'
    : '<div class="game-thumb-placeholder" aria-hidden="true">🌙🐈‍⬛</div>';
  return '<div class="game-thumb">' + inner + '</div>';
}

function renderTags(tags) {
  if (!tags || !tags.length) return '';
  return '<div class="game-tags">' +
    tags.map(function (t) { return '<span class="game-genre">' + escapeHtml(t) + '</span>'; }).join('') +
  '</div>';
}

function renderBlock(title, bodyHtml) {
  return '<div class="game-block">' +
    '<h4 class="game-block-title">' + escapeHtml(title) + '</h4>' +
    bodyHtml +
  '</div>';
}

function renderParagraphs(arr) {
  if (!arr || !arr.length) return '';
  return arr.map(function (t) { return '<p>' + escapeHtml(t) + '</p>'; }).join('');
}

function renderList(arr, tag) {
  if (!arr || !arr.length) return '';
  return '<' + tag + '>' + arr.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('') + '</' + tag + '>';
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
