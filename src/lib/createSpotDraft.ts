import type * as ImagePicker from 'expo-image-picker';
import type { Tag, VisitTime } from '../types/database';
import type { DetectedEmbed } from './embeds';

// 投稿作成画面(CreateSpotScreen)で「地図から選択」を経由して位置選択画面へ
// 遷移し、場所を確定して戻ってくる間だけ入力途中のフォーム内容を保持しておくための
// モジュールスコープの一時保存領域。
//
// React StateはWeb版のnavigation.navigate('CreateSpot', {...})往復時に、
// 環境によってはCreateSpotScreenコンポーネントが再マウントされてしまうことがあり、
// その場合useState内の入力内容がすべて失われてしまう。モジュールスコープの変数は
// Reactのマウント/アンマウントに影響されないため、ここに退避しておけば往復後に
// 復元できる。
//
// 「地図から選択」に遷移する直前にのみ保存し、CreateSpotScreen側で座標を
// 受け取ったタイミングで一度だけ復元してすぐに消費する(使い捨て)ため、
// 全く関係のない新規投稿を開始した際に古い下書きが誤って復元されることはない。
export type CreateSpotDraft = {
  title: string;
  description: string;
  access: string;
  visitTime: VisitTime | null;
  googleMapsUrl: string;
  selectedTags: Tag[];
  tagInput: string;
  images: ImagePicker.ImagePickerAsset[];
  embeds: DetectedEmbed[];
  embedInput: string;
};

let draft: CreateSpotDraft | null = null;

export function saveCreateSpotDraft(d: CreateSpotDraft) {
  draft = d;
}

// 一度取り出したら消費済みとして破棄する(使い捨て)
export function takeCreateSpotDraft(): CreateSpotDraft | null {
  const d = draft;
  draft = null;
  return d;
}
