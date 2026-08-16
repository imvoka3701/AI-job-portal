import { Helmet } from "react-helmet-async";

interface SEOMetaProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  schemaMarkup?: Record<string, any>;
}

export function SEOMeta({ title, description, canonicalUrl, schemaMarkup }: SEOMetaProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Social Media */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://ai-job-portal.com/banner.jpg" />
      
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Structured Data JSON-LD for Google Rich Results */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
}
