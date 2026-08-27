import { useEffect, useState } from 'react';
import { notify } from '../lib/notify';
import {
  fetchSpotBySlug,
  toggleLike,
  toggleBookmark,
  isSpotLiked,
  isSpotBookmarked,
  reportSpot,
  deleteSpot,
} from '../lib/spots';
import { fetchSpotReviews, deleteSpotReview } from '../lib/spotReviews';
import { reportReview, filterBlockedAuthors } from '../lib/moderation';
import { useAuth } from '../lib/AuthContext';
import type { Spot, SpotReview, ReportReason } from '../types/database';

// スポット詳細の取得といいね・行きたい・通報の操作をまとめたフック。
// フル画面の詳細画面と、地図画面のプレビューシートの両方から共有して使う。
// 引数はURL/遷移で使うLIMap ID（slug）。いいね・行きたい・通報などのDB操作は
// FK制約が内部の主キー(id)を参照しているため、取得したspot.idを使う。
export function useSpotDetail(slug: string | null) {
  const { session, blockedUserIds } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reviews, setReviews] = useState<SpotReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const loadReviews = (spotDbId: string) => {
    setReviewsLoading(true);
    fetchSpotReviews(spotDbId)
      .then((data) => setReviews(filterBlockedAuthors(data, blockedUserIds)))
      .catch((e) => console.warn('レビュー取得エラー', e))
      .finally(() => setReviewsLoading(false));
  };

  useEffect(() => {
    if (!slug) return;
    setSpot(null);
    setLoading(true);
    setShowReport(false);
    setReviews([]);

    fetchSpotBySlug(slug)
      .then((data) => {
        setSpot(data);
        loadReviews(data.id);
        if (session?.user) {
          isSpotLiked(session.user.id, data.id).then(setLiked).catch(() => {});
          isSpotBookmarked(session.user.id, data.id).then(setBookmarked).catch(() => {});
        } else {
          setLiked(false);
          setBookmarked(false);
        }
      })
      .catch((e) => console.warn('スポット取得エラー', e))
      .finally(() => setLoading(false));
  }, [slug, session?.user?.id]);

  const refreshReviews = () => {
    if (spot) loadReviews(spot.id);
  };

  const handleDeleteReview = async (review: SpotReview) => {
    if (!session?.user || session.user.id !== review.author_id) return;
    try {
      await deleteSpotReview(review);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (e: any) {
      notify('削除に失敗しました', e.message);
    }
  };

  const handleReportReview = async (review: SpotReview, reason: ReportReason) => {
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    try {
      await reportReview(session.user.id, review.id, reason);
      notify('通報を受け付けました', 'ご協力ありがとうございます。');
    } catch (e: any) {
      notify('エラー', e.message);
    }
  };

  const handleLike = async () => {
    if (!spot) return;
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    const next = !liked;
    setLiked(next);
    // 件数はDBのトリガーで更新されるが、体感速度のためここでも即座に反映する
    setSpot((s) => (s ? { ...s, like_count: Math.max(0, s.like_count + (next ? 1 : -1)) } : s));
    try {
      await toggleLike(session.user.id, spot.id, !next);
    } catch {
      setLiked(!next);
      setSpot((s) => (s ? { ...s, like_count: Math.max(0, s.like_count + (next ? -1 : 1)) } : s));
    }
  };

  const handleBookmark = async () => {
    if (!spot) return;
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    const next = !bookmarked;
    setBookmarked(next);
    setSpot((s) => (s ? { ...s, bookmark_count: Math.max(0, s.bookmark_count + (next ? 1 : -1)) } : s));
    try {
      await toggleBookmark(session.user.id, spot.id, !next);
    } catch {
      setBookmarked(!next);
      setSpot((s) => (s ? { ...s, bookmark_count: Math.max(0, s.bookmark_count + (next ? -1 : 1)) } : s));
    }
  };

  const handleReport = async (reason: ReportReason) => {
    if (!spot) return;
    if (!session?.user) {
      notify('ログインが必要です');
      return;
    }
    try {
      await reportSpot(session.user.id, spot.id, reason);
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
    reviews,
    reviewsLoading,
    refreshReviews,
    handleDeleteReview,
    handleReportReview,
  };
}
