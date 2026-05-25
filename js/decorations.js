/**
 * decorations.js - 背景装飾を各セクションに直接挿入
 */
document.addEventListener('DOMContentLoaded', function () {
  if (window.innerWidth < 768) return;

  var sections = [
    {
      selector: '#topics',
      items: [
        { src: 'img/decorations/footprint-gold.png', cls: 'deco-footprint', top: '30px', left: '30px', rotate: 15 },
        { src: 'img/decorations/footprint-white.png', cls: 'deco-footprint', bottom: '60px', left: '50px', rotate: -25 },
        { src: 'img/decorations/sparkle.png', cls: 'deco-sparkle', top: '50px', right: '60px', rotate: 0 },
        { src: 'img/decorations/sparkle.png', cls: 'deco-sparkle', bottom: '40px', right: '100px', rotate: 0 }
      ]
    },
    {
      selector: '#works',
      items: [
        { src: 'img/decorations/footprint-gold.png', cls: 'deco-footprint', top: '40px', right: '40px', rotate: -20 },
        { src: 'img/decorations/footprint-gold.png', cls: 'deco-footprint', top: '120px', left: '20px', rotate: 35 },
        { src: 'img/decorations/footprint-white.png', cls: 'deco-footprint', bottom: '80px', left: '25px', rotate: 30 },
        { src: 'img/decorations/cat-right.png', cls: 'deco-cat', bottom: '30px', right: '20px', rotate: 0 },
        { src: 'img/decorations/sparkle.png', cls: 'deco-sparkle', top: '60px', left: '60px', rotate: 0 }
      ]
    },
    {
      selector: '#goods',
      items: [
        { src: 'img/decorations/footprint-gold.png', cls: 'deco-footprint', top: '50px', left: '40px', rotate: -15 },
        { src: 'img/decorations/footprint-white.png', cls: 'deco-footprint', top: '100px', right: '30px', rotate: 20 },
        { src: 'img/decorations/footprint-gold.png', cls: 'deco-footprint', bottom: '60px', left: '60px', rotate: 40 },
        { src: 'img/decorations/sparkle.png', cls: 'deco-sparkle', top: '80px', right: '50px', rotate: 0 },
        { src: 'img/decorations/cat-right.png', cls: 'deco-cat', bottom: '40px', right: '15px', rotate: 0 }
      ]
    },
    {
      selector: '#youtube',
      items: [
        { src: 'img/decorations/footprint-white.png', cls: 'deco-footprint', top: '30px', left: '20px', rotate: 10 },
        { src: 'img/decorations/footprint-gold.png', cls: 'deco-footprint', top: '80px', right: '35px', rotate: -30 },
        { src: 'img/decorations/footprint-white.png', cls: 'deco-footprint', bottom: '50px', right: '50px', rotate: 15 },
        { src: 'img/decorations/sparkle.png', cls: 'deco-sparkle', bottom: '60px', right: '70px', rotate: 0 },
        { src: 'img/decorations/sparkle.png', cls: 'deco-sparkle', top: '40px', right: '90px', rotate: 0 },
        { src: 'img/decorations/cat-left.png', cls: 'deco-cat', top: '50px', left: '10px', rotate: 0 }
      ]
    },
    {
      selector: '#gallery',
      items: [
        { src: 'img/decorations/footprint-gold.png', cls: 'deco-footprint', top: '30px', right: '35px', rotate: 25 },
        { src: 'img/decorations/sparkle.png', cls: 'deco-sparkle', top: '50px', left: '50px', rotate: 0 },
        { src: 'img/decorations/footprint-gold.png', cls: 'deco-footprint', top: '200px', left: '15px', rotate: -10 },
        { src: 'img/decorations/cat-right.png', cls: 'deco-cat', top: '40px', right: '10px', rotate: 0 },
        { src: 'img/decorations/footprint-white.png', cls: 'deco-footprint', bottom: '40px', left: '30px', rotate: -20 },
        { src: 'img/decorations/footprint-white.png', cls: 'deco-footprint', bottom: '100px', right: '60px', rotate: 35 }
      ]
    },
    {
      selector: '#contact',
      items: [
        { src: 'img/decorations/sparkle.png', cls: 'deco-sparkle', top: '25px', right: '80px', rotate: 0 },
        { src: 'img/decorations/sparkle.png', cls: 'deco-sparkle', top: '60px', left: '50px', rotate: 0 },
        { src: 'img/decorations/footprint-gold.png', cls: 'deco-footprint', bottom: '30px', left: '40px', rotate: -10 },
        { src: 'img/decorations/footprint-white.png', cls: 'deco-footprint', top: '40px', right: '40px', rotate: 20 }
      ]
    }
  ];

  sections.forEach(function (sec) {
    var el = document.querySelector(sec.selector);
    if (!el) return;

    el.style.position = 'relative';
    el.style.overflow = 'visible';

    sec.items.forEach(function (d) {
      var img = document.createElement('img');
      img.src = d.src;
      img.alt = '';
      img.className = 'deco ' + d.cls;
      img.style.position = 'absolute';
      if (d.top) img.style.top = d.top;
      if (d.bottom) img.style.bottom = d.bottom;
      if (d.left) img.style.left = d.left;
      if (d.right) img.style.right = d.right;
      if (d.rotate) img.style.transform = 'rotate(' + d.rotate + 'deg)';
      img.style.pointerEvents = 'none';
      img.style.zIndex = '0';
      el.appendChild(img);
    });
  });
});
