// app.json をベースに、開発ビルド（APP_VARIANT=development）のときだけ
// アプリ名とパッケージ名を変えることで、配布用アプリと同じ端末に共存させられるようにする。
// eas.json の "development" ビルドプロファイルで APP_VARIANT=development を設定している。
//
// また、Mapbox SDK のダウンロード用シークレットトークンは app.json に直接書かない。
// @rnmapbox/maps の現在の推奨は、環境変数 RNMAPBOX_MAPS_DOWNLOAD_TOKEN にトークンを入れておく方法
// （ビルド中の pod install / Gradle がその環境変数を直接読む）。
// その環境変数が無い環境（EAS に未登録など）では、従来どおり .env の MAPBOX_DOWNLOAD_TOKEN を
// プラグインの設定（RNMapboxMapsDownloadToken。非推奨で警告が出る）として渡し、ビルドが通るようにしておく。
require('dotenv').config();

module.exports = ({ config }) => {
  const isDev = process.env.APP_VARIANT === 'development';

  return {
    ...config,
    name: isDev ? 'Limap Dev' : config.name,
    ios: {
      ...config.ios,
      bundleIdentifier: isDev ? 'com.v.xo2.limap.dev' : config.ios.bundleIdentifier,
    },
    android: {
      ...config.android,
      package: isDev ? 'com.v.xo2.limap.dev' : config.android.package,
    },
    plugins: config.plugins.map((plugin) => {
      if (Array.isArray(plugin) && plugin[0] === '@rnmapbox/maps') {
        if (process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN) return plugin;
        return [
          '@rnmapbox/maps',
          {
            ...plugin[1],
            RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN,
          },
        ];
      }
      return plugin;
    }),
  };
};
