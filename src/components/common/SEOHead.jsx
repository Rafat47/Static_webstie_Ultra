import { useEffect } from 'react';
import { useConfig } from '../../context/ConfigContext';

export default function SEOHead({ title, description, image }) {
  const { config } = useConfig();

  useEffect(() => {
    const brandName = config?.siteSettings?.brandName || 'Hair Shurokkha';
    const siteTitle = title || config?.seo?.defaultTitle || brandName;
    document.title = siteTitle;

    const favicon = config?.siteSettings?.faviconUrl || '/hair-shurokkha-logo-transparent.png';
    let linkIcon = document.querySelector('link[rel="icon"]');
    if (linkIcon) {
      linkIcon.href = favicon;
      linkIcon.type = 'image/png';
    }

    const metaDescription = description || config?.seo?.defaultDescription;
    if (metaDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = metaDescription;
    }

    const ogImg = image || config?.seo?.ogImage || '/hair-shurokkha-logo-transparent.png';
    if (ogImg) {
      let metaOgImage = document.querySelector('meta[property="og:image"]');
      if (metaOgImage) {
        metaOgImage.content = ogImg;
      }
    }
  }, [title, description, image, config]);

  return null;
}

