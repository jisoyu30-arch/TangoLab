// 페이지별 메타 태그 동적 설정
import { useEffect } from 'react';

interface MetaOptions {
  title?: string;
  description?: string;
  image?: string;
}

export function usePageMeta({ title, description, image }: MetaOptions) {
  useEffect(() => {
    const siteName = '석정소유의 탱고랩';
    const fullTitle = title ? `${title} · ${siteName}` : siteName;

    // Document title
    document.title = fullTitle;

    // OG meta tags
    const setMeta = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setNameMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setMeta('og:title', fullTitle);
    if (description) {
      setMeta('og:description', description);
      setNameMeta('description', description);
    }
    setMeta('og:type', 'website');
    setMeta('og:url', window.location.href);
    if (image) setMeta('og:image', image);

    setNameMeta('twitter:card', 'summary_large_image');
    setNameMeta('twitter:title', fullTitle);
    if (description) setNameMeta('twitter:description', description);
    if (image) setNameMeta('twitter:image', image);
  }, [title, description, image]);
}
