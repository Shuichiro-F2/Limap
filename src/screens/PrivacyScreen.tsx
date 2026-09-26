import React, { useEffect } from 'react';
import StaticContentScreen from '../components/StaticContentScreen';
import { getStaticPage } from '../content/staticPages';
import { useLanguage } from '../lib/i18n';
import { applyStaticPageSeo, resetSeo } from '../lib/seo';

// プライバシーポリシーページ。ログイン不要で誰でも閲覧できる。
export default function PrivacyScreen() {
  const { language } = useLanguage();
  const page = getStaticPage('privacy', language);

  useEffect(() => {
    applyStaticPageSeo(page);
    return () => resetSeo();
  }, [page]);

  return <StaticContentScreen content={page} />;
}
