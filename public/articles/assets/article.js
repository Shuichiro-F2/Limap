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

// 日本語版(/articles/)と英語版(/en/articles/)は別のページとして生成しているため、
// 言語の切り替えは <a> のリンクで行う（以前ここにあった、1ページ内で表示を切り替える処理は不要になった）。

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
