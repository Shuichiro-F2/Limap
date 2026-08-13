import { Platform } from 'react-native';

// 投稿画像は、スマホのカメラ写真そのまま（数MB・数千px四方）だと、
// マイページ/検索のグリッドのような小さいサムネイルとして表示する際にも
// ブラウザが元の解像度のままデコードすることになり、動作が重くなる主因になっていた。
// アップロード前にこの最大辺サイズまで縮小・再圧縮する。
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;

export interface ResizedImage {
  base64: string;
  contentType: string;
}

// Web版: Canvasで縮小・再エンコードしてから返す（追加の依存ライブラリなしで完結する）。
// ネイティブ版: expo-image-pickerのquality指定(0.7)で既に圧縮されているため、そのまま返す。
export async function resizeImageForUpload(
  uri: string,
  base64: string | null | undefined
): Promise<ResizedImage | null> {
  if (!base64) return null;

  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return { base64, contentType: 'image/jpeg' };
  }

  try {
    return await new Promise<ResizedImage>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        const longEdge = Math.max(width, height);
        if (longEdge > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / longEdge;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64, contentType: 'image/jpeg' });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        const commaIndex = dataUrl.indexOf(',');
        if (commaIndex === -1) {
          resolve({ base64, contentType: 'image/jpeg' });
          return;
        }
        resolve({ base64: dataUrl.slice(commaIndex + 1), contentType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.src = uri;
    });
  } catch {
    // 縮小に失敗した場合も投稿自体は継続できるよう、元の画像にフォールバックする
    return { base64, contentType: 'image/jpeg' };
  }
}
