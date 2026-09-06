// スポットカードのサムネイル画像(SNS投稿から取得したthumbnail_url)の読み込みに
// 失敗した場合、img要素をピンアイコンのプレースホルダーに置き換える。
// generate-articles.js側のonerror属性から呼び出す想定のグローバル関数。
window.__limapSpotThumbFallback = function (img) {
  var placeholder = document.createElement('div');
  placeholder.className = 'spot-card-thumb spot-card-thumb-empty';
  placeholder.innerHTML =
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>';
  if (img && img.parentNode) {
    img.parentNode.replaceChild(placeholder, img);
  }
};

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

// LIMap iOS向けApp Store誘導バナー。
// アプリ本体(src/components/AppStoreBanner.tsx)と同じ判定条件・同じlocalStorageキーで
// 動かしているため、アプリ側と記事ページのどちらか一方で閉じれば、もう一方でも表示されない。
// 非iOS端末で一瞬でも表示されないよう、HTML側は hidden 属性つきで出力しておき、
// 条件を満たしたときだけここで外す。
(function () {
  var DISMISS_KEY = 'limap-ios-app-banner-dismissed';

  function isIOS() {
    var ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    // iPadOS 13以降はUAがMacとして送られてくるため、タッチ対応のMacintoshもiPadとして扱う
    return /Macintosh/.test(ua) && 'ontouchend' in document;
  }

  function isStandalone() {
    var media =
      typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
    return media || window.navigator.standalone === true;
  }

  function isDismissed() {
    try {
      return window.localStorage.getItem(DISMISS_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.getElementById('app-banner');
    if (!banner) return;
    if (!isIOS() || isStandalone() || isDismissed()) return;

    banner.hidden = false;

    var close = document.getElementById('app-banner-close');
    if (!close) return;
    close.addEventListener('click', function () {
      banner.hidden = true;
      try {
        window.localStorage.setItem(DISMISS_KEY, '1');
      } catch (e) {
        // localStorageが使えない環境では諦める(次回また表示されるだけで実害はない)
      }
    });
  });
})();
