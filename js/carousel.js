/**
 * carousel.js - 中央表示型カルーセル（左右チラ見え・無限ループ）
 * 5倍複製でバッファを十分確保し、ジャンプを最小限にする
 */

document.addEventListener('DOMContentLoaded', function () {
  initCarousel();
});

function initCarousel() {
  var container = document.querySelector('.carousel-container');
  if (!container) return;

  fetch('data/carousel.json')
    .then(function (res) { return res.json(); })
    .then(function (config) {
      buildCarousel(container, config);
    })
    .catch(function (err) {
      console.error('カルーセルデータの読み込みに失敗しました:', err);
    });
}

function buildCarousel(container, config) {
  var slides = config.slides;
  var track = container.querySelector('.carousel-track');
  var heroSection = container.closest('.hero-section') || container.parentElement;
  var dotsContainer = heroSection.querySelector('.carousel-dots');

  if (!track || slides.length === 0) return;

  var totalSlides = slides.length;
  var copies = 5;

  // スライドを5倍複製
  for (var c = 0; c < copies; c++) {
    slides.forEach(function (slide, i) {
      var slideEl = document.createElement('div');
      slideEl.className = 'carousel-slide';
      slideEl.dataset.realIndex = i;

      if (slide.hasLink && slide.link) {
        slideEl.innerHTML = '<a href="' + slide.link + '" target="_blank" rel="noopener noreferrer">' +
          '<img src="' + slide.image + '" alt="' + slide.alt + '" loading="lazy">' +
          '</a>';
      } else {
        slideEl.innerHTML = '<img src="' + slide.image + '" alt="' + slide.alt + '" loading="lazy">';
      }

      track.appendChild(slideEl);
    });
  }

  // ドット
  if (dotsContainer) {
    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'スライド ' + (i + 1) + ' に移動');
      dot.dataset.index = i;
      dotsContainer.appendChild(dot);
    });
  }

  // 真ん中のグループからスタート
  var currentIndex = totalSlides * 2;
  var allSlideEls = track.querySelectorAll('.carousel-slide');
  var autoplayTimer = null;

  function getSlideMetrics() {
    var slideEl = allSlideEls[0];
    var style = getComputedStyle(slideEl);
    var w = slideEl.offsetWidth;
    var ml = parseInt(style.marginLeft) || 0;
    var mr = parseInt(style.marginRight) || 0;
    return { width: w, total: w + ml + mr };
  }

  function getOffset(idx) {
    var m = getSlideMetrics();
    var containerW = container.offsetWidth;
    return (containerW - m.width) / 2 - idx * m.total;
  }

  function updateUI() {
    var realIndex = currentIndex % totalSlides;
    allSlideEls.forEach(function (s, i) {
      s.classList.toggle('active', i === currentIndex);
    });
    if (dotsContainer) {
      var dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach(function (d, i) { d.classList.toggle('active', i === realIndex); });
    }
  }

  function jumpTo(idx) {
    track.style.transition = 'none';
    currentIndex = idx;
    track.style.transform = 'translateX(' + getOffset(currentIndex) + 'px)';
    updateUI();
  }

  function slideTo(idx) {
    // スライド前に真ん中グループから離れすぎていたら静かに戻す
    normalizeQuietly();
    track.style.transition = 'transform 0.5s ease';
    currentIndex = idx;
    track.style.transform = 'translateX(' + getOffset(currentIndex) + 'px)';
    updateUI();
  }

  // 真ん中グループから離れすぎたら静かに戻す
  function normalizeQuietly() {
    var centerStart = totalSlides * 2;
    if (currentIndex < totalSlides || currentIndex >= totalSlides * 4) {
      var realIndex = ((currentIndex % totalSlides) + totalSlides) % totalSlides;
      jumpTo(centerStart + realIndex);
    }
  }

  // 初期表示
  jumpTo(currentIndex);

  function goNext() {
    slideTo(currentIndex + 1);
    resetAutoplay();
  }

  function goPrev() {
    slideTo(currentIndex - 1);
    resetAutoplay();
  }

  // ボタン
  var prevBtn = container.querySelector('.carousel-btn-prev');
  var nextBtn = container.querySelector('.carousel-btn-next');
  if (prevBtn) prevBtn.addEventListener('click', goPrev);
  if (nextBtn) nextBtn.addEventListener('click', goNext);

  // ドットクリック
  if (dotsContainer) {
    dotsContainer.addEventListener('click', function (e) {
      var dot = e.target.closest('.carousel-dot');
      if (!dot) return;
      var targetReal = parseInt(dot.dataset.index);
      var currentReal = currentIndex % totalSlides;
      slideTo(currentIndex + (targetReal - currentReal));
      resetAutoplay();
    });
  }

  // 非アクティブスライドクリック
  track.addEventListener('click', function (e) {
    var slide = e.target.closest('.carousel-slide');
    if (!slide) return;
    var idx = Array.prototype.indexOf.call(allSlideEls, slide);
    if (idx !== currentIndex) {
      e.preventDefault();
      slideTo(idx);
      resetAutoplay();
    }
  });

  // 自動再生（インターバルごとに静かに正規化も行う）
  function startAutoplay() {
    if (!config.autoplay) return;
    autoplayTimer = setInterval(function () {
      normalizeQuietly();
      goNext();
    }, config.interval || 5000);
  }
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }
  startAutoplay();

  // タッチスワイプ
  var touchStartX = 0;
  track.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  track.addEventListener('touchend', function (e) {
    var diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
  }, { passive: true });

  // リサイズ
  window.addEventListener('resize', function () { jumpTo(currentIndex); });
}
