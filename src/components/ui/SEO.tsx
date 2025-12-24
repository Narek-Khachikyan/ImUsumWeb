import { Helmet } from 'react-helmet-async';

interface SEOProps {
   title: string;
   description: string;
   keywords?: string;
   ogImage?: string;
   ogUrl?: string;
}

const SEO = ({
   title,
   description,
   keywords,
   ogImage = '/og-image.jpg',
   ogUrl = window.location.href,
}: SEOProps) => {
   const fullTitle = `${title} | ImUsum`;

   return (
      <Helmet>
         {/* Primary Meta Tags */}
         <title>{fullTitle}</title>
         <meta name="title" content={fullTitle} />
         <meta name="description" content={description} />
         {keywords && <meta name="keywords" content={keywords} />}

         {/* Open Graph / Facebook */}
         <meta property="og:type" content="website" />
         <meta property="og:url" content={ogUrl} />
         <meta property="og:title" content={fullTitle} />
         <meta property="og:description" content={description} />
         <meta property="og:image" content={ogImage} />

         {/* Twitter */}
         <meta property="twitter:card" content="summary_large_image" />
         <meta property="twitter:url" content={ogUrl} />
         <meta property="twitter:title" content={fullTitle} />
         <meta property="twitter:description" content={description} />
         <meta property="twitter:image" content={ogImage} />
      </Helmet>
   );
};

export default SEO;
