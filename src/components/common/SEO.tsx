import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
    const { i18n } = useTranslation();

    const baseUrl = 'https://emlakcrm.app';
    const canonicalUrl = `${baseUrl}${location.pathname}`;
    const fullOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

    const defaultTitle = 'Emlak CRM | Gayrimenkul Yönetim Sistemi';
    const defaultDescription = 'Modern, mobile-first real estate CRM for Turkish agencies and agents. Manage properties, tenants, contracts, reminders and daily workflows in one simple, secure system.';
    const defaultKeywords = 'emlak crm, gayrimenkul yönetim sistemi, emlak yazılımı, kiracı takip programı, sözleşme yönetimi, real estate crm, property management, tenant tracking, contract management';

    const finalTitle = title || defaultTitle;
    const finalDescription = description || defaultDescription;
    const finalKeywords = keywords || defaultKeywords;

    // Determine hreflang URLs
    const hreflangTr = `${canonicalUrl}${canonicalUrl.includes('?') ? '&' : '?'}lang=tr`;
    const hreflangEn = `${canonicalUrl}${canonicalUrl.includes('?') ? '&' : '?'}lang=en`;

    return (
        <Helmet>
            {/* HTML lang attribute */}
            <html lang={i18n.language} />

            {/* Basic meta tags */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            <meta name="keywords" content={finalKeywords} />
            <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />

            {/* Canonical URL */}
            <link rel="canonical" href={canonicalUrl} />

            {/* Hreflang tags for bilingual support */}
            <link rel="alternate" hrefLang="tr" href={hreflangTr} />
            <link rel="alternate" hrefLang="en" href={hreflangEn} />
            <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

            {/* Open Graph tags */}
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:site_name" content="Emlak CRM" />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={fullOgImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Emlak CRM - Real Estate Management System" />
            <meta property="og:locale" content={i18n.language === 'tr' ? 'tr_TR' : 'en_US'} />
            <meta property="og:locale:alternate" content={i18n.language === 'tr' ? 'en_US' : 'tr_TR'} />

            {/* Twitter Card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
            <meta name="twitter:image" content={fullOgImage} />
            <meta name="twitter:image:alt" content="Emlak CRM Dashboard Preview" />
        </Helmet>
    );
};
