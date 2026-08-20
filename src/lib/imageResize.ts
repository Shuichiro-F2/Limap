import { Image, Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

// 投稿画像は、スマホのカメラ写真そのまま（数MB・数千px四方）だと、
// マイページ/検索のグリッドのような小さいサムネイルとして表示する際にも
// ブラウザ/OSが元の解像度のままデコードすることになり、動作が重くなる主因になっていた。
// （投稿数の多いアカウントのプロフィール画面を開くと、大量の高解像度画像を同時に
// デコードしてメモリを使い切り、タブ/アプリが再読み込みを繰り返す不具合の主因もこれ）
// アップロード前にこのファイルで縮小・再圧縮し、あわせてWebP形式に変換する。
// WebPはJPEGと同等以上の画質を保ちながらファイルサイズを大きく削減できる。
const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.75;

export interface ResizedImage {
  base64: string;
  contentType: string;
}

export interface ResizeOptions {
  // 長辺(縦横どちらか大きい方)がこのサイズを超えないよう縮小する
  maxDimension?: number;
  // 0〜1の圧縮品質
  quality?: number;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

function base64FromDataUrl(dataUrl: string): string | null {
  const commaIndex = dataUrl.indexOf(',');
  return commaIndex === -1 ? null : dataUrl.slice(commaIndex + 1);
}

// Web版: Canvasで縮小・WebPへの再エンコードを行う（追加の依存ライブラリなしで完結する）。
async function resizeOnWeb(uri: string, maxDimension: number, quality: number): Promise<ResizedImage> {
  return await new Promise<ResizedImage>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      const longEdge = Math.max(width, height);
      if (longEdge > maxDimension) {
        const scale = maxDimension / longEdge;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvasの初期化に失敗しました'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // ごく一部の古いブラウザはtoDataURL('image/webp')に対応しておらず、
      // その場合は暗黙的にPNGを返してくることがあるため、
      // 実際にWebPとして書き出せたかをMIMEタイプの接頭辞で確認し、
      // 対応していなければJPEGにフォールバックする。
      const webpDataUrl = canvas.toDataURL('image/webp', quality);
      const isWebpSupported = webpDataUrl.startsWith('data:image/webp');
      const dataUrl = isWebpSupported ? webpDataUrl : canvas.toDataURL('image/jpeg', quality);
      const base64 = base64FromDataUrl(dataUrl);
      if (!base64) {
        reject(new Error('画像のエンコードに失敗しました'));
        return;
      }
      resolve({ base64, contentType: isWebpSupported ? 'image/webp' : 'image/jpeg' });
    };
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = uri;
  });
}

// ネイティブ版: expo-image-manipulatorで縮小・WebPへの再エンコードを行う。
async function resizeOnNative(uri: string, maxDimension: number, quality: number): Promise<ResizedImage> {
  const { width, height } = await getImageSize(uri);
  const longEdge = Math.max(width, height);

  // resizeアクションは指定した一辺だけを渡すと、縦横比を保ったままもう一辺を自動計算してくれる。
  // 横長/正方形の画像はwidthを、縦長の画像はheightを指定することで、
  // Web版のCanvas実装と同じく「長辺を上限サイズに収める」挙動に揃える。
  const actions =
    longEdge > maxDimension
      ? [{ resize: width >= height ? { width: maxDimension } : { height: maxDimension } }]
      : [];

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.WEBP,
    base64: true,
  });
  if (!result.base64) {
    throw new Error('画像の変換に失敗しました');
  }
  return { base64: result.base64, contentType: 'image/webp' };
}

export async function resizeImageForUpload(
  uri: string,
  base64: string | null | undefined,
  options: ResizeOptions = {}
): Promise<ResizedImage | null> {
  if (!base64) return null;
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;

  try {
    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') return { base64, contentType: 'image/jpeg' };
      return await resizeOnWeb(uri, maxDimension, quality);
    }
    return await resizeOnNative(uri, maxDimension, quality);
  } catch {
    // 縮小/変換に失敗した場合も投稿自体は継続できるよう、元の画像にフォールバックする
    return { base64, contentType: 'image/jpeg' };
  }
}

// contentTypeから、Storageに保存する際の拡張子を決める
export function extensionForContentType(contentType: string): string {
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/png') return 'png';
  return 'jpg';
}

// グリッド/フィードカードなど、小さくしか表示しないサムネイル用の設定。
// フル画像よりさらに小さく・強めに圧縮し、一覧画面で大量に同時表示しても軽くなるようにする。
export const THUMBNAIL_RESIZE_OPTIONS: ResizeOptions = { maxDimension: 640, quality: 0.6 };
