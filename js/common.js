/**
 * common.js - ヘッダー/フッター挿入、モバイルメニュー制御
 */

document.addEventListener('DOMContentLoaded', function () {
  insertHeader();
  insertFooter();
  initMobileMenu();
  initSmoothScroll();
  initDropdowns();
});

/**
 * ヘッダーHTMLを挿入
 */
function insertHeader() {
  const headerEl = document.querySelector('.site-header');
  if (!headerEl) return;

  headerEl.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="header-logo">
        <span class="header-logo-title">🐾 黒猫千鶴</span>
        <span class="header-logo-subtitle">~ KURONEKO CHIZURU ~</span>
      </a>
      <nav class="header-nav">
        <a href="index.html#topics">TOPICS</a>
        <a href="index.html#works">WORKS</a>
        <a href="index.html#goods">GOODS</a>
        <a href="index.html#youtube">YOUTUBE</a>
        <a href="index.html#gallery">GALLERY</a>
        <a href="index.html#contact">CONTACT</a>
      </nav>
      <button class="hamburger" aria-label="メニューを開く">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
    <div class="mobile-nav-overlay"></div>
    <nav class="mobile-nav">
      <a href="index.html#topics">TOPICS</a>
      <a href="index.html#works">WORKS</a>
      <a href="index.html#goods">GOODS</a>
      <a href="index.html#youtube">YOUTUBE</a>
      <a href="index.html#gallery">GALLERY</a>
      <a href="index.html#contact">CONTACT</a>
    </nav>
  `;

  // ヘッダー直後に波打ちSVGを挿入（背景透明、黒部分のみ描画）
  var headerWave = document.createElement('div');
  headerWave.className = 'wave-divider wave-divider-top';
  headerWave.innerHTML = '<svg viewBox="0 0 1440 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block"><path d="M0,0 L0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,0 Z" fill="#1A1A1A"/></svg>';
  headerEl.parentNode.insertBefore(headerWave, headerEl.nextSibling);
}

/**
 * フッターHTMLを挿入
 */
function insertFooter() {
  const footerEl = document.querySelector('.site-footer');
  if (!footerEl) return;

  // 波打ちSVGをフッターの前に挿入
  var waveDiv = document.createElement('div');
  waveDiv.className = 'wave-divider wave-divider-bottom';
  waveDiv.innerHTML = '<svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill="#1A1A1A"/></svg>';
  footerEl.parentNode.insertBefore(waveDiv, footerEl);

  footerEl.innerHTML = `
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-menu">
          <ul class="footer-menu-list">
            <li><a href="index.html#topics">TOPICS</a></li>
            <li><a href="index.html#works">WORKS</a></li>
            <li><a href="index.html#goods">GOODS</a></li>
            <li><a href="index.html#youtube">YOUTUBE</a></li>
            <li><a href="index.html#gallery">GALLERY</a></li>
            <li><a href="index.html#contact">CONTACT</a></li>
          </ul>
        </div>
        <div class="footer-center">
          <a href="index.html" class="footer-logo">
            <span class="footer-logo-title">🐾 黒猫千鶴</span>
          </a>
          <span class="footer-logo-subtitle">~ KURONEKO CHIZURU ~</span>
        </div>
        <div class="footer-right">
          <p class="footer-right-title">黒猫千鶴 OFFICIAL</p>
        </div>
      </div>
      <p class="footer-copyright">&copy; Kuroneko Chizuru</p>
    </div>
  `;
}

/**
 * モバイルメニューの開閉制御
 */
function initMobileMenu() {
  document.addEventListener('click', function (e) {
    var hamburger = e.target.closest('.hamburger');
    if (hamburger) {
      hamburger.classList.toggle('active');
      var mobileNav = document.querySelector('.mobile-nav');
      var overlay = document.querySelector('.mobile-nav-overlay');
      if (mobileNav) mobileNav.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
      return;
    }

    if (e.target.closest('.mobile-nav-overlay') || e.target.closest('.mobile-nav a')) {
      closeMobileMenu();
    }
  });
}

function closeMobileMenu() {
  var hamburger = document.querySelector('.hamburger');
  var mobileNav = document.querySelector('.mobile-nav');
  var overlay = document.querySelector('.mobile-nav-overlay');
  if (hamburger) hamburger.classList.remove('active');
  if (mobileNav) mobileNav.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

/**
 * スムーズスクロール（同ページ内のアンカーリンク）
 */
function initSmoothScroll() {
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href*="#"]');
    if (!link) return;

    var href = link.getAttribute('href');
    var hashIndex = href.indexOf('#');
    if (hashIndex === -1) return;

    var pagePath = href.substring(0, hashIndex);
    var hash = href.substring(hashIndex);

    // 同ページ内リンクの場合のみスムーズスクロール
    var isCurrentPage = !pagePath || pagePath === 'index.html' ||
      window.location.pathname.endsWith(pagePath);

    if (isCurrentPage && hash.length > 1) {
      var target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        var headerHeight = document.querySelector('.site-header').offsetHeight;
        var targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
        closeMobileMenu();
      }
    }
  });
}

/**
 * ドロップダウンの開閉制御
 */
function initDropdowns() {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-view-all-dropdown .btn-view-all');
    if (btn) {
      e.preventDefault();
      var dropdown = btn.closest('.btn-view-all-dropdown');
      dropdown.classList.toggle('open');
      return;
    }
    // ドロップダウン外をクリックで閉じる
    var openDropdowns = document.querySelectorAll('.btn-view-all-dropdown.open');
    openDropdowns.forEach(function (d) {
      if (!d.contains(e.target)) {
        d.classList.remove('open');
      }
    });
  });
}
