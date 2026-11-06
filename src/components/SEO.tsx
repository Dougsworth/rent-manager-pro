import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
  type?: string;
}

const SITE_NAME = 'EasyCollect';
const SITE_URL = 'https://easycollectja.com';
const DEFAULT_DESCRIPTION =
  'Rent and loan tracking for landlords and lenders in Jamaica. Send pay links, collect proof of payment, send reminders and see who owes you at a glance. Free for now.';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  path = '/',
  type = 'website',
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : 'EasyCollect | Collect rent and loans in Jamaica';
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={OG_IMAGE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  );
}
