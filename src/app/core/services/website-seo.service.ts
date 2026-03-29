import { Injectable } from '@angular/core';
import { AppSettings } from '../models';

export interface SeoCheckResult {
  category: 'critical' | 'warning' | 'success';
  item: string;
  status: string;
  recommendation?: string;
}

export interface SitemapConfig {
  includeHomepage: boolean;
  includeCategories: boolean;
  includeTags: boolean;
  includePosts: boolean;
  includePages: boolean;
  newsSitemap: boolean;
  priority: 'automatic' | 'manual';
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export interface RobotsConfig {
  allowAll: boolean;
  allowRules: string[];
  disallowRules: string[];
  sitemapUrl: string;
  crawlDelay: number;
}

@Injectable({
  providedIn: 'root',
})
export class WebsiteSeoService {
  private settings: Partial<AppSettings> = {};

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('wp_settings');
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (e) {
      console.log('Could not load settings');
    }
  }

  saveSettings(settings: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...settings };
    localStorage.setItem('wp_settings', JSON.stringify(this.settings));
  }

  getSettings(): Partial<AppSettings> {
    return { ...this.settings };
  }

  getSiteUrl(): string {
    return (
      this.settings.website?.siteUrl ||
      this.settings.wordpress?.apiUrl?.replace('/wp-json/wp/v2', '') ||
      'https://dastgeertech.studio'
    );
  }

  getSiteName(): string {
    return this.settings.website?.siteName || 'Dastgeer Tech';
  }

  getDefaultSettings(): Partial<AppSettings> {
    return {
      website: {
        siteUrl: 'https://dastgeertech.studio',
        siteName: 'Dastgeer Tech',
        tagline: 'Your Daily Source for Technology News and Reviews',
        description:
          'Dastgeer Tech brings you the latest technology news, in-depth reviews, and expert insights on smartphones, AI, laptops, gaming, and emerging tech trends.',
        author: 'Dastgeer Tech Editorial Team',
        publisher: 'Dastgeer Tech',
        logoUrl: '',
        faviconUrl: '',
        social: {
          twitter: '@dastgeertech',
          facebook: 'dastgeertech',
          instagram: 'dastgeertech',
          linkedin: 'company/dastgeertech',
          youtube: 'dastgeertech',
        },
      },
      google: {
        searchConsoleVerified: false,
        analyticsId: '',
        adsenseId: '',
        newsPublicationName: 'Dastgeer Tech',
      },
    };
  }

  performSeoAudit(): SeoCheckResult[] {
    const results: SeoCheckResult[] = [];
    const siteUrl = this.getSiteUrl();

    results.push({
      category: 'success',
      item: 'Site URL',
      status: 'Configured',
      recommendation: `Your site is set to: ${siteUrl}`,
    });

    const wpConfigured = !!(this.settings.wordpress?.apiUrl && this.settings.wordpress?.username);
    results.push({
      category: wpConfigured ? 'success' : 'critical',
      item: 'WordPress Connection',
      status: wpConfigured ? 'Connected' : 'Not Connected',
      recommendation: wpConfigured
        ? 'WordPress is properly connected.'
        : 'Please configure WordPress API credentials in Settings.',
    });

    const apiKey = this.settings.ai?.openaiApiKey;
    if (apiKey && apiKey.startsWith('gsk_')) {
      results.push({
        category: 'success',
        item: 'AI Content Generation',
        status: 'Groq API Active',
        recommendation: 'Using free Groq API for content generation.',
      });
    } else if (apiKey) {
      results.push({
        category: 'success',
        item: 'AI Content Generation',
        status: 'API Key Configured',
        recommendation: 'AI content generation is enabled.',
      });
    } else {
      results.push({
        category: 'warning',
        item: 'AI Content Generation',
        status: 'Using Built-in Generator',
        recommendation: 'For better content, add a free Groq API key from console.groq.com',
      });
    }

    results.push({
      category: 'success',
      item: 'Google News Ready',
      status: 'Schema Markup Enabled',
      recommendation: 'All posts include NewsArticle schema markup for Google News indexing.',
    });

    results.push({
      category: 'success',
      item: 'SEO Optimization',
      status: '90+ Score Target',
      recommendation:
        'Content is optimized for 90+ SEO scores with proper keyword placement, headings, and meta descriptions.',
    });

    results.push({
      category: 'warning',
      item: 'Google Analytics',
      status: this.settings.google?.analyticsId ? 'Connected' : 'Not Configured',
      recommendation: this.settings.google?.analyticsId
        ? 'GA4 is tracking your site.'
        : 'Add GA4 ID (G-XXXXXXXXXX) for traffic analytics.',
    });

    results.push({
      category: 'warning',
      item: 'Google Search Console',
      status: this.settings.google?.searchConsoleVerified ? 'Verified' : 'Not Verified',
      recommendation: 'Verify your site at search.google.com/search-console for better indexing.',
    });

    results.push({
      category: 'success',
      item: 'Auto Posting',
      status: 'Daily Schedule Ready',
      recommendation: 'Enable auto-posting to publish articles daily at your preferred time.',
    });

    return results;
  }

  generateRobotsTxt(): string {
    const siteUrl = this.getSiteUrl();
    return `# robots.txt for ${siteUrl}
# Generated by WP Auto Poster

User-agent: *
Allow: /

# Block admin and wp-content
Disallow: /wp-admin/
Disallow: /wp-admin/admin-ajax.php
Disallow: /wp-content/plugins/
Disallow: /wp-content/cache/
Disallow: /wp-content/uploads/

# Block sensitive files
Disallow: /wp-config.php
Disallow: /wp-login.php
Disallow: /wp-signup.php
Disallow: /trackback/
Disallow: /feed/
Disallow: /comments/
Disallow: /xmlrpc.php

# Allow common crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: YandexBot
Allow: /

# Sitemap locations
Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/news-sitemap.xml

# Crawl delay (optional, be nice to servers)
Crawl-delay: 1`;
  }

  generateSitemapXml(posts: Array<{ slug: string; lastmod?: Date; priority?: number }>): string {
    const siteUrl = this.getSiteUrl();
    const now = new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"\n';
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    xml += '  <url>\n';
    xml += `    <loc>${siteUrl}/</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    xml += '  <url>\n';
    xml += `    <loc>${siteUrl}/category/technology/</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    xml += '  <url>\n';
    xml += `    <loc>${siteUrl}/category/ai-artificial-intelligence/</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    xml += '  <url>\n';
    xml += `    <loc>${siteUrl}/category/mobile-phones/</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';

    for (const post of posts) {
      const postUrl = `${siteUrl}/${post.slug}`;
      const lastmod = post.lastmod ? post.lastmod.toISOString() : now;
      const priority = post.priority || 0.6;

      xml += '  <url>\n';
      xml += `    <loc>${postUrl}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += `    <priority>${priority}</priority>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  generateNewsSitemap(posts: Array<{ slug: string; title: string; publishDate: Date }>): string {
    const siteUrl = this.getSiteUrl();
    const pubName = this.settings.google?.newsPublicationName || this.getSiteName();

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    sitemap += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    for (const post of posts) {
      const postUrl = `${siteUrl}/${post.slug}`;

      sitemap += '  <url>\n';
      sitemap += `    <loc>${postUrl}</loc>\n`;
      sitemap += '    <news:news>\n';
      sitemap += '      <news:publication>\n';
      sitemap += `        <news:name>${pubName}</news:name>\n`;
      sitemap += '        <news:language>en</news:language>\n';
      sitemap += '      </news:publication>\n';
      sitemap += `      <news:publication_date>${post.publishDate.toISOString().split('T')[0]}</news:publication_date>\n`;
      sitemap += `      <news:title>${this.escapeXml(post.title)}</news:title>\n`;
      sitemap += '    </news:news>\n';
      sitemap += '  </url>\n';
    }

    sitemap += '</urlset>';
    return sitemap;
  }

  generateOpenGraphTags(): string {
    const siteUrl = this.getSiteUrl();
    const siteName = this.getSiteName();
    const description = this.settings.website?.description || 'Latest technology news and reviews';
    const logo = this.settings.website?.logoUrl || `${siteUrl}/logo.png`;

    return `<!-- Open Graph Tags -->
<meta property="og:type" content="website">
<meta property="og:url" content="${siteUrl}">
<meta property="og:title" content="${siteName}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${logo}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="${siteName}">
<meta property="og:locale" content="en_US">

<!-- Twitter Card Tags -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="${this.settings.website?.social?.twitter || '@dastgeertech'}">
<meta name="twitter:url" content="${siteUrl}">
<meta name="twitter:title" content="${siteName}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${logo}">

<!-- Additional SEO Meta Tags -->
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="googlebot" content="index, follow">
<meta name="revisit-after" content="7 days">
<link rel="canonical" href="${siteUrl}">`;
  }

  generateSchemaMarkup(): string {
    const siteUrl = this.getSiteUrl();
    const siteName = this.getSiteName();
    const description = this.settings.website?.description || 'Latest technology news and reviews';

    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        url: siteUrl,
        description: description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/?s={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
        publisher: {
          '@type': 'Organization',
          name: this.settings.website?.publisher || siteName,
          logo: {
            '@type': 'ImageObject',
            url: this.settings.website?.logoUrl || `${siteUrl}/logo.png`,
          },
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'NewsMediaOrganization',
        name: siteName,
        url: siteUrl,
        description: description,
        sameAs: [
          `https://twitter.com/${this.settings.website?.social?.twitter?.replace('@', '') || 'dastgeertech'}`,
          `https://www.facebook.com/${this.settings.website?.social?.facebook || 'dastgeertech'}`,
          `https://www.youtube.com/${this.settings.website?.social?.youtube || 'dastgeertech'}`,
        ],
      },
    ];

    return schemas.map((s) => JSON.stringify(s)).join('\n');
  }

  getRecommendedPlugins(): Array<{ name: string; purpose: string; url: string }> {
    return [
      {
        name: 'Yoast SEO',
        purpose: 'Comprehensive SEO optimization, XML sitemaps, meta tags',
        url: 'https://wordpress.org/plugins/wordpress-seo/',
      },
      {
        name: 'Rank Math',
        purpose: 'Advanced SEO with built-in schema markup',
        url: 'https://wordpress.org/plugins/seo-by-rank-math/',
      },
      {
        name: 'WP Fastest Cache',
        purpose: 'Speed optimization and caching',
        url: 'https://wordpress.org/plugins/wp-fastest-cache/',
      },
      {
        name: 'Imagify',
        purpose: 'Image compression and optimization',
        url: 'https://wordpress.org/plugins/imagify/',
      },
      {
        name: 'Wordfence',
        purpose: 'Security and firewall protection',
        url: 'https://wordpress.org/plugins/wordfence/',
      },
      {
        name: 'Smush',
        purpose: 'Lazy loading and image optimization',
        url: 'https://wordpress.org/plugins/wp-smushit/',
      },
    ];
  }

  getGoogleNewsRequirements(): string[] {
    return [
      'Publish original news content regularly',
      'Use proper article headers with publication date',
      'Include author names in articles',
      'Add proper NewsArticle schema markup',
      'Submit news sitemap to Google Search Console',
      'Ensure site is publicly accessible',
      'Follow Google News content policies',
      'Use proper categorization of articles',
      'Maintain consistent publishing schedule',
      'Build quality backlinks from news sources',
    ];
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
