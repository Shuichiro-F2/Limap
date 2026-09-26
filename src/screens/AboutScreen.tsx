import React, { useEffect } from 'react';
import StaticContentScreen from '../components/StaticContentScreen';
import SupportCard from '../components/SupportCard';
import { getStaticPage } from '../content/staticPages';
import { useLanguage } from '../lib/i18n';
import { applyStaticPageSeo, resetSeo } from '../lib/seo';

// 「リミナルスペースとは」解説ページ。ログイン不要で誰でも閲覧できる。
export default function AboutScreen() {
  const { language } = useLanguage();
  const page = getStaticPage('about', language);

  useEffect(() => {
    applyStaticPageSeo(page);
    return () => resetSeo();
  }, [page]);

  // 末尾にKo-fiでの支援カードを表示する(Web版のみ。ネイティブではSupportCardがnullを返す)
  return <StaticContentScreen content={page} footer={<SupportCard />} />;
}
