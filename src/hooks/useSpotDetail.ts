import { useEffect, useState } from 'react';
import { notify } from '../lib/notify';
import {
  fetchSpotById,
  toggleLike,
  toggleBookmark,
  isSpotLiked,
  isSpotBookmarked,
  reportSpot,
  deleteSpot,
} from '../lib/spots';
import { useAuth } from '../lib/AuthContext';
import type { Spot, ReportReason } from '../types/database';

// スポット詳細の取得といいね・行きたい・通報の操作をまとめたフック。
// フル画面の詳細画面と、地図画面のプレビューシートの両方から共有して使う。
export function useSpotDetail(spotId: string | null) {
  const { session } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!spotId) return;
    setSpot(null);
    setLoading(true);
    setShowReport(false);

    fetchSpotById(spotId)
      .then(setSpot)
      .finally(() => setLoading(false));

    if (session?.user) {
      isSpotLiked(session.user.id, spotId).then(setLiked).catch(() => {});
      isSpotBookmarked(session.user.id, spotId).then(setBookmarked).catch(() => {});
    } else {
      setLiked(false);
      setBookmarked(false);
    }
  }, [spotId, session?.user?.id]);

  const handleLike = async () => {
    if (!spotId) return;
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    const next = !liked;
    setLiked(next);
    try {
      await toggleLike(session.user.id, spotId, !next);
    } catch {
      setLiked(!next);
    }
  };

  const handleBookmark = async () => {
    if (!spotId) return;
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await toggleBookmark(session.user.id, spotId, !next);
    } catch {
      setBookmarked(!next);
    }
  };

  const handleReport = async (reason: ReportReason) => {
    if (!spotId) return;
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    try {
      await reportSpot(session.user.id, spotId, reason);
      setShowReport(false);
      notify('通報を受け付けました', 'ご協力ありがとうございます。');
    } catch (e: any) {
      notify('エラー', e.message);
    }
  };

  // 投稿者本人かどうか（削除メニューの表示可否に使う）
  const isOwner = !!session?.user && !!spot && session.user.id === spot.author_id;

  const handleDelete = async (): Promise<boolean> => {
    if (!spot || !isOwner) return false;
    setDeleting(true);
    try {
      await deleteSpot(spot);
      return true;
    } catch (e: any) {
      notify('削除に失敗しました', e.message);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    spot,
    loading,
    liked,
    bookmarked,
    showReport,
    setShowReport,
    handleLike,
    handleBookmark,
    handleReport,
    isOwner,
    deleting,
    handleDelete,
  };
}
