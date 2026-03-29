import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SchemaMarkupService {
  private siteName: string = 'Dastgeer Tech';
  private siteUrl: string = 'https://dastgeertech.studio';
  private logoUrl: string = '';
  private defaultAuthor: string = 'Dastgeer Tech Editorial Team';
  private defaultPublisher: string = 'Dastgeer Tech';
  private _publisherName: string = '';

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const settings = localStorage.getItem('wp_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.wordpress?.apiUrl) {
          this.siteUrl = parsed.wordpress.apiUrl.replace('/wp-json/wp/v2', '');
          this.extractSiteName();
        }
      }
    } catch (e) {
      console.log('Could not load settings for schema');
    }
  }

  private extractSiteName(): void {
    if (this.siteUrl) {
      try {
        const url = new URL(this.siteUrl);
        this.siteName = url.hostname.replace('www.', '').split('.')[0];
        this.siteName = this.siteName.charAt(0).toUpperCase() + this.siteName.slice(1);
      } catch (e) {
        this.siteName = 'Dastgeer Tech';
      }
    }
  }

  generateNewsArticleSchema(article: {
    title: string;
    content: string;
    publishDate: Date;
    modifiedDate?: Date;
    author?: string;
    category?: string;
    slug: string;
    featuredImage?: string;
  }): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: this.generateExcerpt(article.content, 150),
      image: [article.featuredImage || this.logoUrl],
      datePublished: article.publishDate.toISOString(),
      dateModified: (article.modifiedDate || article.publishDate).toISOString(),
      author: {
        '@type': 'Person',
        name: article.author || this.defaultAuthor,
        url: `${this.siteUrl}/author/${this.slugToAuthor(article.author || this.defaultAuthor)}`,
      },
      publisher: {
        '@type': 'Organization',
        name: this.publisherName || this.siteName,
        url: this.siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: this.logoUrl,
          width: 600,
          height: 60,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${this.siteUrl}/${article.slug}`,
      },
      articleSection: article.category || 'Technology',
      keywords: this.extractKeywords(article.content),
      wordCount: this.countWords(article.content),
      timeRequired: this.estimateReadTime(article.content),
      about: {
        '@type': 'Thing',
        name: article.category || 'Technology',
      },
      speaksLanguage: 'en-US',
    };

    return JSON.stringify(schema);
  }

  generateFAQSchema(faqs: Array<{ question: string; answer: string }>): string {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq, index) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
        position: index + 1,
      })),
    };

    return JSON.stringify(faqSchema);
  }

  generateHowToSchema(howTo: {
    title: string;
    description: string;
    steps: Array<{ name: string; text: string }>;
    totalTime?: string;
  }): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: howTo.title,
      description: howTo.description,
      totalTime: howTo.totalTime || 'PT30M',
      step: howTo.steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
      })),
    };

    return JSON.stringify(schema);
  }

  generateBreadcrumbSchema(slug: string, title: string, category?: string): string {
    const categoryName = category || 'Technology';
    const categorySlug = category?.toLowerCase().replace(/\s+/g, '-') || 'technology';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: this.siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: this.capitalizeCategory(categoryName),
          item: `${this.siteUrl}/category/${categorySlug}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: title,
          item: `${this.siteUrl}/${slug}`,
        },
      ],
    };

    return JSON.stringify(schema);
  }

  generateWebSiteSchema(): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      url: this.siteUrl,
      description: `${this.siteName} - Latest technology news, reviews, and guides`,
      inLanguage: 'en-US',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.siteUrl}/?s={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      publisher: {
        '@type': 'Organization',
        name: this.publisherName || this.siteName,
        url: this.siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: this.logoUrl,
        },
        sameAs: [
          'https://twitter.com/dastgeertech',
          'https://www.facebook.com/dastgeertech',
          'https://www.youtube.com/@dastgeertech',
        ],
      },
    };

    return JSON.stringify(schema);
  }

  generateArticleSchemas(article: {
    title: string;
    content: string;
    publishDate: Date;
    modifiedDate?: Date;
    author?: string;
    category?: string;
    slug: string;
    featuredImage?: string;
    faqs?: Array<{ question: string; answer: string }>;
  }): {
    newsArticle: string;
    breadcrumb: string;
    webPage: string;
    faq?: string;
    organization: string;
  } {
    const schemas: any = {
      newsArticle: this.generateNewsArticleSchema(article),
      breadcrumb: this.generateBreadcrumbSchema(article.slug, article.title, article.category),
      webPage: this.generateWebPageSchema(article),
      organization: this.generateOrganizationSchema(),
    };

    if (article.faqs && article.faqs.length > 0) {
      schemas.faq = this.generateFAQSchema(article.faqs);
    }

    return schemas;
  }

  private generateOrganizationSchema(): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${this.siteUrl}/#organization`,
      name: this.publisherName || this.siteName,
      url: this.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: this.logoUrl,
      },
      sameAs: [
        'https://twitter.com/dastgeertech',
        'https://www.facebook.com/dastgeertech',
        'https://www.instagram.com/dastgeertech',
        'https://www.linkedin.com/company/dastgeertech',
        'https://www.youtube.com/@dastgeertech',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: 'English',
      },
    };

    return JSON.stringify(schema);
  }

  private generateWebPageSchema(article: {
    title: string;
    content: string;
    publishDate: Date;
    slug: string;
  }): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: article.title,
      description: this.generateExcerpt(article.content, 160),
      datePublished: article.publishDate.toISOString(),
      url: `${this.siteUrl}/${article.slug}`,
      inLanguage: 'en-US',
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${this.siteUrl}/#website`,
        url: this.siteUrl,
        name: this.siteName,
      },
      about: {
        '@type': 'Article',
        headline: article.title,
        datePublished: article.publishDate.toISOString(),
      },
    };

    return JSON.stringify(schema);
  }

  generateNewsSitemap(
    posts: Array<{
      slug: string;
      publishDate: Date;
      category: string;
    }>,
  ): string {
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    sitemap += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    for (const post of posts) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${this.siteUrl}/${post.slug}</loc>\n`;
      sitemap += '    <news:news>\n';
      sitemap += '      <news:publication>\n';
      sitemap += `        <news:name>${this.publisherName || this.siteName}</news:name>\n`;
      sitemap += `        <news:language>en</news:language>\n`;
      sitemap += '      </news:publication>\n';
      sitemap += `      <news:publication_date>${post.publishDate.toISOString().split('T')[0]}</news:publication_date>\n`;
      sitemap += `        <news:title>${this.escapeXml(post.slug.replace(/-/g, ' '))}</news:title>\n`;
      sitemap += '    </news:news>\n';
      sitemap += '  </url>\n';
    }

    sitemap += '</urlset>';
    return sitemap;
  }

  private generateExcerpt(content: string, maxLength: number): string {
    const plainText = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    let excerpt = plainText.substring(0, maxLength);

    const lastSpace = excerpt.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      excerpt = excerpt.substring(0, lastSpace);
    }

    return excerpt.trim() + (plainText.length > maxLength ? '...' : '');
  }

  private extractKeywords(content: string): string {
    const words = content
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);

    const frequency: { [key: string]: number } = {};
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }

    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return sorted.join(', ');
  }

  private countWords(content: string): number {
    return content
      .replace(/<[^>]*>/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }

  private estimateReadTime(content: string): string {
    const wordCount = this.countWords(content);
    const minutes = Math.ceil(wordCount / 200);
    return `PT${minutes}M`;
  }

  private slugToAuthor(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  private capitalizeCategory(category: string): string {
    return category
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  setSiteInfo(info: {
    name?: string;
    url?: string;
    logo?: string;
    publisher?: string;
    author?: string;
  }): void {
    if (info.name) this.siteName = info.name;
    if (info.url) {
      this.siteUrl = info.url;
      this.extractSiteName();
    }
    if (info.logo) this.logoUrl = info.logo;
    if (info.publisher) this._publisherName = info.publisher;
    if (info.author) this.defaultAuthor = info.author;
  }

  get publisherName(): string {
    return this._publisherName || this.siteName;
  }
}
