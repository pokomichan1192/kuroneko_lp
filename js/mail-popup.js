/**
 * mail-popup.js - メールポップアップ制御
 */

document.addEventListener('DOMContentLoaded', function () {
  initMailPopup();
});

function initMailPopup() {
  var modal = document.getElementById('mail-modal');
  if (!modal) return;

  var closeBtn = modal.querySelector('.modal-close');
  var copyBtn = modal.querySelector('.mail-popup-btn-copy');

  // Mailリンククリックでポップアップ表示
  document.addEventListener('click', function (e) {
    var mailLink = e.target.closest('[data-mail-popup]');
    if (!mailLink) return;

    e.preventDefault();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  // 閉じる
  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // コピーボタン
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var email = '9kuro6neko.kobo@gmail.com';
      navigator.clipboard.writeText(email).then(function () {
        copyBtn.textContent = 'コピーしました！';
        setTimeout(function () {
          copyBtn.textContent = 'コピー';
        }, 2000);
      });
    });
  }
}
