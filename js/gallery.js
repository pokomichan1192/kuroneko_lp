/**
 * gallery.js - ギャラリーポップアップモーダル制御
 */

document.addEventListener('DOMContentLoaded', function () {
  initGalleryModal();
});

function initGalleryModal() {
  var modal = document.getElementById('gallery-modal');
  if (!modal) return;

  var modalImage = modal.querySelector('.gallery-modal-image');
  var closeBtn = modal.querySelector('.modal-close');
  var prevBtn = modal.querySelector('.gallery-modal-prev');
  var nextBtn = modal.querySelector('.gallery-modal-next');

  var currentIndex = 0;
  var galleryItems = [];

  // ギャラリーアイテムクリック（イベント委譲）
  document.addEventListener('click', function (e) {
    var item = e.target.closest('.gallery-item');
    if (!item) return;

    // 現在のギャラリーアイテムを取得
    galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    currentIndex = parseInt(item.dataset.index) || galleryItems.indexOf(item);

    openModal();
  });

  function openModal() {
    if (galleryItems.length === 0) return;

    var item = galleryItems[currentIndex];
    var img = item.querySelector('img');
    if (!img) return;

    modalImage.src = img.src;
    modalImage.alt = img.alt;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    updateModalImage();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    updateModalImage();
  }

  function updateModalImage() {
    var item = galleryItems[currentIndex];
    var img = item.querySelector('img');
    if (img) {
      modalImage.src = img.src;
      modalImage.alt = img.alt;
    }
  }

  // イベントリスナー
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (prevBtn) prevBtn.addEventListener('click', showPrev);
  if (nextBtn) nextBtn.addEventListener('click', showNext);

  // オーバーレイクリックで閉じる
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  // キーボード操作
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('active')) return;

    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
}
