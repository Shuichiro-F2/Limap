import React, { useEffect } from 'react';
import StaticContentScreen from '../components/StaticContentScreen';
import { ABOUT_PAGE } from '../content/staticPages';
import { applyStaticPageSeo, resetSeo } from '../lib/seo';

// 「リミナルスペースとは」解説ページ。ログイン不要で誰でも閲覧できる。
export default function AboutScreen() {
  useEffect(() => {
    applyStaticPageSeo(ABOUT_PAGE);
    return () => resetSeo();
  }, []);

  return <StaticContentScreen content={ABOUT_PAGE} />;
}
