import React, { useEffect } from 'react';
import StaticContentScreen from '../components/StaticContentScreen';
import SupportCard from '../components/SupportCard';
import { ABOUT_PAGE } from '../content/staticPages';
import { applyStaticPageSeo, resetSeo } from '../lib/seo';

// 「リミナルスペースとは」解説ページ。ログイン不要で誰でも閲覧できる。
export default function AboutScreen() {
  useEffect(() => {
    applyStaticPageSeo(ABOUT_PAGE);
    return () => resetSeo();
  }, []);

  // 末尾にKo-fiでの支援カードを表示する(Web版のみ。ネイティブではSupportCardがnullを返す)
  return <StaticContentScreen content={ABOUT_PAGE} footer={<SupportCard />} />;
}
