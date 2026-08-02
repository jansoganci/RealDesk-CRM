import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogType?: string;
    noindex?: boolean;
}

export const SEO = ({
    title,
    description,
    keywords,
    ogImage = '/og-image.jpg',
    ogType = 'website',
    noindex = false,
}: SEOProps) => {
    const location = useLocation();

    const baseUrl = 'https://closewell.app';
    const canonicalUrl = `${baseUrl}${location.pathname}`;
    const fullOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

    const defaultTitle = 'Closewell | The CRM for US Real Estate Agents';
    const defaultDescription = 'Modern, mobile-first real estate CRM for US agencies and agents. Manage properties, tenants, contracts, reminders and daily workflows in one simple, secure system.';
    const defaultKeywords = 'closewell, real estate crm, property management, tenant tracking, contract management, US real estate software';

    const finalTitle = title || defaultTitle;
    const finalDescription = description || defaultDescription;
    const finalKeywords = keywords || defaultKeywords;

    return (
        <Helmet>
            {/* HTML lang attribute — English-only app */}
            <html lang="en" />

            {/* Basic meta tags */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            <meta name="keywords" content={finalKeywords} />
            <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />

            {/* Canonical URL */}
            <link rel="canonical" href={canonicalUrl} />

            <link rel="alternate" hrefLang="en" href={canonicalUrl} />
            <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

            {/* Open Graph tags */}
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:site_name" content="Closewell" />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={fullOgImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Closewell - Real Estate Management System" />
            <meta property="og:locale" content="en_US" />

            {/* Twitter Card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
            <meta name="twitter:image" content={fullOgImage} />
            <meta name="twitter:image:alt" content="Closewell Dashboard Preview" />
        </Helmet>
    );
};
