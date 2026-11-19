import { useEffect } from 'react';

export default function SEOHead({ title, description, image }) {
  useEffect(() => {
    if (title) {
      document.title = title.includes('Regrow') ? title : `${title} | Regrow Hair Care BD`;
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
  }, [title, description, image]);

  return null;
}
