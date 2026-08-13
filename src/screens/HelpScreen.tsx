import React, { useEffect } from 'react';
import StaticContentScreen from '../components/StaticContentScreen';
import { HELP_PAGE } from '../content/staticPages';
import { applyStaticPageSeo, resetSeo } from '../lib/seo';

// 「使い方」ページ。ログイン不要で誰でも閲覧できる。
export default function HelpScreen() {
  useEffect(() => {
    applyStaticPageSeo(HELP_PAGE);
    return () => resetSeo();
  }, []);

  return <StaticContentScreen content={HELP_PAGE} />;
}
