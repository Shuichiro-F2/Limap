// app.json をベースに、開発ビルド（APP_VARIANT=development）のときだけ
// アプリ名とパッケージ名を変えることで、配布用アプリと同じ端末に共存させられるようにする。
// eas.json の "development" ビルドプロファイルで APP_VARIANT=development を設定している。
//
// また、Mapbox SDK のダウンロード用シークレットトークン（RNMapboxMapsDownloadToken）は
// app.json に直接書かず、.env（Git管理外）から読み込んでここで注入する。
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
