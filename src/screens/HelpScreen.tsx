import React, { useEffect } from 'react';
import StaticContentScreen from '../components/StaticContentScreen';
import { getStaticPage } from '../content/staticPages';
import { useLanguage } from '../lib/i18n';
import { applyStaticPageSeo, resetSeo } from '../lib/seo';

// 「使い方」ページ。ログイン不要で誰でも閲覧できる。
export default function HelpScreen() {
  const { language } = useLanguage();
  const page = getStaticPage('help', language);

  useEffect(() => {
    applyStaticPageSeo(page);
    return () => resetSeo();
  }, [page]);

  return <StaticContentScreen content={page} />;
}
