// LIMap 読み物記事: 日本語/英語の表示切り替え。
// SEO上はページの初期HTMLで日本語を優先させたいため、
// サーバー側では日本語ブロックのみを可視状態でレンダリングし、
// ここでは「クリックされたら表示言語を切り替える」だけの軽量なJSにしている。
(function () {
  var STORAGE_KEY = 'limap-article-lang';

  function applyLang(lang) {
    var blocks = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < blocks.length; i++) {
      var el = blocks[i];
      if (el.getAttribute('data-lang') === lang) {
        el.classList.add('lang-active');
      } else {
        el.classList.remove('lang-active');
      }
    }
    var buttons = document.querySelectorAll('.lang-switch button');
    for (var j = 0; j < buttons.length; j++) {
      var btn = buttons[j];
      if (btn.getAttribute('data-set-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
    document.documentElement.setAttribute('lang', lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // localStorageが使えない環境でも表示切り替え自体は動作させる
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('.lang-switch button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        applyLang(e.currentTarget.getAttribute('data-set-lang'));
      });
    }

    // 初期表示は常に日本語（SEO優先）。前回英語を選んでいた場合のみ、
    // ユーザー操作の結果として英語表示に切り替える。
    var saved = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {}
    applyLang(saved === 'en' ? 'en' : 'ja');
  });
})();
