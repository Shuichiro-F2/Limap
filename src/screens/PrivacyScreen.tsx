import React, { useEffect } from 'react';
import StaticContentScreen from '../components/StaticContentScreen';
import { PRIVACY_PAGE } from '../content/staticPages';
import { applyStaticPageSeo, resetSeo } from '../lib/seo';

// プライバシーポリシーページ。ログイン不要で誰でも閲覧できる。
export default function PrivacyScreen() {
  useEffect(() => {
    applyStaticPageSeo(PRIVACY_PAGE);
    return () => resetSeo();
  }, []);

  return <StaticContentScreen content={PRIVACY_PAGE} />;
}
