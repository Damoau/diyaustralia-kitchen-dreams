import { Helmet } from 'react-helmet-async';
import { useMetaTags } from '@/hooks/useMetaTags';

interface SEOTagsProps {
  pageType?: 'static' | 'product' | 'category' | 'room' | 'custom';
  pageIdentifier?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  productName?: string;
  categoryName?: string;
}

export function SEOTags({
  pageType = 'static',
  pageIdentifier = '/',
  fallbackTitle,
  fallbackDescription,
  productName,
  categoryName,
}: SEOTagsProps) {
  const { data: metaTags } = useMetaTags(pageType, pageIdentifier);

  // Use database meta tags if available, otherwise use fallbacks
  const title = metaTags?.title || fallbackTitle || 'Custom Kitchens & Cabinets';
  const description = metaTags?.description || fallbackDescription || 'Premium quality custom cabinets';
  const keywords = metaTags?.keywords?.join(', ') || '';
  const ogTitle = metaTags?.og_title || title;
  const ogDescription = metaTags?.og_description || description;
  const ogImage = metaTags?.og_image || '/og-image.jpg';
  const twitterCard = metaTags?.twitter_card || 'summary_large_image';
  const canonicalUrl = metaTags?.canonical_url || `https://yourdomain.com${pageIdentifier}`;
  const robots = metaTags?.robots || 'index, follow';

  // Build dynamic title for product/category pages
  const finalTitle = productName ? `${productName} | ${title}` : categoryName ? `${categoryName} | ${title}` : title;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {metaTags?.structured_data && (
        <script type="application/ld+json">
          {JSON.stringify(metaTags.structured_data)}
        </script>
      )}
    </Helmet>
  );
}
