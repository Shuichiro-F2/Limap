import type * as ImagePicker from 'expo-image-picker';
import type { VisitTime } from '../types/database';
import type { DetectedEmbed } from './embeds';

// 新規投稿画面(CreateSpotScreen)で、既に近くに似たスポットがあると案内された際、
// 「レビューとして投稿する」を選んだ場合に、それまで入力していた内容
// (説明文・訪問時間帯・写真・SNS埋め込み)をAddReviewScreenへ引き継ぐための
// モジュールスコープの一時保存領域。画像(ImagePickerAsset)はシリアライズできないため
// route paramsではなくこの仕組みで受け渡す(src/lib/createSpotDraft.tsと同じ考え方)。
//
// 遷移直前に一度だけ保存し、AddReviewScreen側で一度だけ復元してすぐに消費する(使い捨て)。
export type ReviewDraft = {
  description: string;
  visitTime: VisitTime | null;
  images: ImagePicker.ImagePickerAsset[];
  embeds: DetectedEmbed[];
};

let draft: ReviewDraft | null = null;

export function saveReviewDraft(d: ReviewDraft) {
  draft = d;
}

// 一度取り出したら消費済みとして破棄する(使い捨て)
export function takeReviewDraft(): ReviewDraft | null {
  const d = draft;
  draft = null;
  return d;
}
