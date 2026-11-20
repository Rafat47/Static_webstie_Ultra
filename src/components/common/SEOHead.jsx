import { useEffect } from 'react';

export default function SEOHead({ description, image }) {
  useEffect(() => {
    // Keep browser tab title always constant as the brand name across all pages
    document.title = 'Hair Shurokkha';

    // Ensure tab icon is the transparent brand logo
    let linkIcon = document.querySelector('link[rel="icon"]');
    if (linkIcon) {
      linkIcon.href = '/hair-shurokkha-logo-transparent.png';
      linkIcon.type = 'image/png';
    }

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    if (image) {
      let metaOgImage = document.querySelector('meta[property="og:image"]');
      if (metaOgImage) {
        metaOgImage.content = image;
      }
    }
  }, [description, image]);

  return null;
}

