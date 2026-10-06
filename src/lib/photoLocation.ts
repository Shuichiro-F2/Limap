// 投稿する写真の撮影場所（EXIF の GPS）から、スポットの位置を読み取る。
// 位置の指定は投稿でいちばん手間のかかる手順なので、写真に撮影場所が入っていれば最初から入れておく
// （投稿画面では、位置がまだ空のときだけ使い、地図で直せることを伝える）。
//
// - iOS / Android: expo-image-picker の exif（iOS は "{GPS}" の中、Android は GPSLatitude などのタグ）
// - Web: exif が返らないため、選んだ写真の元のデータ（base64 の JPEG）から EXIF を直接読む
//   （ネイティブの base64 は quality 指定で作り直されて EXIF が消えているため、exif の方を使う）

type LatLng = { lat: number; lng: number };

function valid(lat: number, lng: number): LatLng | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  // 0,0 は位置情報が無いときの値として入っていることがあるので使わない
  if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return null;
  return { lat, lng };
}

// "35/1,40/1,1234/100" のような度分秒の文字列、度分秒の配列、または10進数を、10進数の度にする
function toDegrees(value: unknown): number {
  if (typeof value === 'number') return value;
  const parts: number[] = (Array.isArray(value) ? value : String(value ?? '').split(','))
    .map((p) => {
      if (typeof p === 'number') return p;
      const [n, d] = String(p).split('/').map(Number);
      return d ? n / d : n;
    })
    .filter((n) => Number.isFinite(n));
  if (!parts.length) return NaN;
  return (parts[0] ?? 0) + (parts[1] ?? 0) / 60 + (parts[2] ?? 0) / 3600;
}

function signed(deg: number, ref: unknown, negative: string): number {
  return String(ref ?? '').toUpperCase().startsWith(negative) ? -Math.abs(deg) : deg;
}

// expo-image-picker の exif から読む（iOS・Android）
export function gpsFromExif(exif: Record<string, any> | null | undefined): LatLng | null {
  if (!exif) return null;
  const ios = exif['{GPS}'];
  if (ios && ios.Latitude != null && ios.Longitude != null) {
    return valid(signed(toDegrees(ios.Latitude), ios.LatitudeRef, 'S'), signed(toDegrees(ios.Longitude), ios.LongitudeRef, 'W'));
  }
  if (exif.GPSLatitude != null && exif.GPSLongitude != null) {
    return valid(
      signed(toDegrees(exif.GPSLatitude), exif.GPSLatitudeRef, 'S'),
      signed(toDegrees(exif.GPSLongitude), exif.GPSLongitudeRef, 'W')
    );
  }
  return null;
}

function base64ToBytes(b64: string, maxBytes: number): Uint8Array {
  const clean = b64.replace(/^data:[^,]*,/, '');
  // 先頭だけで足りる（EXIF は JPEG の最初の方にある）
  const head = clean.slice(0, Math.ceil((maxBytes * 4) / 3 / 4) * 4);
  const bin = typeof atob === 'function' ? atob(head) : '';
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// JPEG のデータ（base64）から EXIF の GPS を読む（Web 用）
export function gpsFromJpegBase64(b64: string | null | undefined): LatLng | null {
  if (!b64) return null;
  try {
    const bytes = base64ToBytes(b64, 256 * 1024);
    const view = new DataView(bytes.buffer);
    if (view.getUint16(0) !== 0xffd8) return null; // JPEG ではない
    let offset = 2;
    while (offset + 4 < bytes.length) {
      const marker = view.getUint16(offset);
      const size = view.getUint16(offset + 2);
      // APP1 で "Exif\0\0" から始まるものが EXIF
      if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966) {
        return parseTiffGps(view, offset + 10);
      }
      if ((marker & 0xff00) !== 0xff00 || size < 2) return null;
      offset += 2 + size;
    }
  } catch {
    // 読めない写真は、位置を入れないだけ
  }
  return null;
}

function parseTiffGps(view: DataView, tiff: number): LatLng | null {
  const little = view.getUint16(tiff) === 0x4949;
  const u16 = (o: number) => view.getUint16(o, little);
  const u32 = (o: number) => view.getUint32(o, little);
  const ifd0 = tiff + u32(tiff + 4);
  let gpsIfd = 0;
  for (let i = 0, n = u16(ifd0); i < n; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (u16(entry) === 0x8825) gpsIfd = tiff + u32(entry + 8);
  }
  if (!gpsIfd) return null;
  const tags: Record<number, unknown> = {};
  for (let i = 0, n = u16(gpsIfd); i < n; i++) {
    const entry = gpsIfd + 2 + i * 12;
    const tag = u16(entry);
    const typ = u16(entry + 2);
    const count = u32(entry + 4);
    if (typ === 2) {
      // ASCII（N/S/E/W）。4バイト以内なので値はエントリの中にある
      tags[tag] = String.fromCharCode(view.getUint8(entry + 8));
    } else if (typ === 5 && count === 3) {
      // RATIONAL ×3（度・分・秒）
      const at = tiff + u32(entry + 8);
      tags[tag] = [0, 1, 2].map((k) => u32(at + k * 8) / (u32(at + k * 8 + 4) || 1));
    }
  }
  if (!tags[2] || !tags[4]) return null;
  return valid(signed(toDegrees(tags[2]), tags[1], 'S'), signed(toDegrees(tags[4]), tags[3], 'W'));
}

// 選んだ写真のどれかに撮影場所があれば返す（先に選んだ写真から順に見る）
export function locationFromAssets(assets: { exif?: Record<string, any> | null; base64?: string | null }[]): LatLng | null {
  for (const a of assets) {
    const loc = gpsFromExif(a.exif) ?? gpsFromJpegBase64(a.base64);
    if (loc) return loc;
  }
  return null;
}
