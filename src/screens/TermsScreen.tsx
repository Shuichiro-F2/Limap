import React, { useEffect } from 'react';
import StaticContentScreen from '../components/StaticContentScreen';
import { TERMS_PAGE } from '../content/staticPages';
import { applyStaticPageSeo, resetSeo } from '../lib/seo';

// 利用規約ページ。ログイン不要で誰でも閲覧できる。
export default function TermsScreen() {
  useEffect(() => {
    applyStaticPageSeo(TERMS_PAGE);
    return () => resetSeo();
  }, []);

  return <StaticContentScreen content={TERMS_PAGE} />;
}
