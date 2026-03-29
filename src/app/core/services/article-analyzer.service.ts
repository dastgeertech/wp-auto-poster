import { Injectable } from '@angular/core';

export interface AnalysisReport {
  score: number;
  issues: SeoIssue[];
  suggestions: string[];
  improvements: string[];
  isReadyForPublish: boolean;
}

export interface SeoIssue {
  type: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  autoFixable: boolean;
}

export interface OptimizedContent {
  title: string;
  content: string;
  metaDescription: string;
  slug: string;
  tags: string[];
  faqSection: string;
  internalLinks: string[];
  externalLinks: string[];
  report: AnalysisReport;
}

@Injectable({
  providedIn: 'root',
})
export class ArticleAnalyzerService {
  analyzeAndOptimize(
    content: string,
    title: string,
    focusKeyword: string,
    urlSlug?: string,
  ): OptimizedContent {
    const report = this.deepAnalyze(content, title, focusKeyword);
    const optimized = this.autoFixIssues(content, title, focusKeyword, report, urlSlug);

    return {
      ...optimized,
      report,
    };
  }

  private deepAnalyze(content: string, title: string, focusKeyword: string): AnalysisReport {
    const issues: SeoIssue[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const keyword = focusKeyword.toLowerCase();
    const contentLower = content.toLowerCase();

    // 1. Title Analysis (20 points)
    const titleLower = title.toLowerCase();
    if (titleLower.includes(keyword)) {
      score += 15;
    } else {
      issues.push({
        type: 'critical',
        category: 'Title',
        message: `Focus keyword "${focusKeyword}" not found in title`,
        autoFixable: true,
      });
    }

    if (title.length >= 30 && title.length <= 60) {
      score += 5;
    } else {
      issues.push({
        type: 'warning',
        category: 'Title',
        message: `Title length should be 50-60 characters (currently ${title.length})`,
        autoFixable: true,
      });
    }

    // 2. First Paragraph Analysis (10 points)
    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const firstParagraph = plainText.split('.')[0] || plainText.substring(0, 200);
    if (firstParagraph.toLowerCase().includes(keyword)) {
      score += 10;
    } else {
      issues.push({
        type: 'critical',
        category: 'Content',
        message: `Keyword not in first paragraph`,
        autoFixable: true,
      });
    }

    // 3. Keyword Density Analysis (15 points)
    const wordCount = this.getWordCount(content);
    const keywordCount = (contentLower.match(new RegExp(this.escapeRegex(keyword), 'gi')) || [])
      .length;
    const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

    if (density >= 1 && density <= 2.5) {
      score += 15;
    } else if (density < 1) {
      score += 5;
      issues.push({
        type: 'warning',
        category: 'Keywords',
        message: `Keyword density too low (${density.toFixed(1)}%). Add more keyword mentions.`,
        autoFixable: true,
      });
    } else if (density > 3) {
      score += 8;
      issues.push({
        type: 'warning',
        category: 'Keywords',
        message: `Keyword density too high (${density.toFixed(1)}%). Reduce keyword usage.`,
        autoFixable: true,
      });
    }

    // 4. Content Length Analysis (15 points)
    if (wordCount >= 1500) {
      score += 15;
    } else if (wordCount >= 1000) {
      score += 12;
    } else if (wordCount >= 800) {
      score += 10;
    } else {
      score += 5;
      issues.push({
        type: 'critical',
        category: 'Content',
        message: `Content too short (${wordCount} words). Aim for 1500+ words.`,
        autoFixable: false,
      });
    }

    // 5. Heading Structure Analysis (10 points)
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
    const h2WithKeyword = (
      content.match(
        new RegExp('<h2[^>]*>[^<]*' + this.escapeRegex(keyword) + '[^<]*</h2>', 'gi'),
      ) || []
    ).length;

    if (h2Count >= 6) {
      score += 10;
    } else if (h2Count >= 4) {
      score += 7;
    } else {
      score += 4;
      issues.push({
        type: 'warning',
        category: 'Structure',
        message: `Need more H2 headings (${h2Count}/6)`,
        autoFixable: true,
      });
    }

    if (h2WithKeyword < 3) {
      issues.push({
        type: 'warning',
        category: 'Keywords',
        message: `Only ${h2WithKeyword} H2 headings contain keyword. Add keyword to more headings.`,
        autoFixable: true,
      });
    }

    // 6. Image Analysis (10 points)
    const imageCount = (content.match(/<img[^>]*>/gi) || []).length;
    const imagesWithAlt = (content.match(/<img[^>]*alt=["'][^"']+["'][^>]*>/gi) || []).length;

    if (imageCount === 0) {
      issues.push({
        type: 'warning',
        category: 'Media',
        message: 'No images found. Add at least one image.',
        autoFixable: true,
      });
    } else {
      if (imagesWithAlt / imageCount >= 0.8) {
        score += 8;
      } else {
        score += 4;
        issues.push({
          type: 'warning',
          category: 'Media',
          message: 'Images missing alt text',
          autoFixable: true,
        });
      }
    }

    // 7. Link Analysis (10 points)
    const totalLinks = (content.match(/<a[^>]*href=["'][^"']+["'][^>]*>/gi) || []).length;

    if (totalLinks >= 4) {
      score += 10;
    } else if (totalLinks >= 2) {
      score += 6;
      issues.push({
        type: 'info',
        category: 'Links',
        message: 'Consider adding more links (internal & external)',
        autoFixable: true,
      });
    } else {
      score += 2;
      issues.push({
        type: 'warning',
        category: 'Links',
        message: 'Need more links for better SEO',
        autoFixable: true,
      });
    }

    // 8. List/Bullet Points (5 points)
    const ulCount = (content.match(/<ul[^>]*>/gi) || []).length;
    const olCount = (content.match(/<ol[^>]*>/gi) || []).length;
    if (ulCount + olCount >= 2) {
      score += 5;
    } else if (ulCount + olCount >= 1) {
      score += 3;
    }

    // 9. FAQ Section (5 points)
    const hasFAQ = /<h[23][^>]*>.*(?:faq|questions?|frequently asked)/i.test(content);

    if (hasFAQ) {
      score += 5;
    } else {
      issues.push({
        type: 'info',
        category: 'SEO',
        message: 'No FAQ section found. Add FAQ for featured snippets.',
        autoFixable: true,
      });
    }

    // 10. Meta Description Quality (5 points)
    const metaDesc = this.generateMetaDescription(content, focusKeyword, 155);
    if (metaDesc.length >= 120 && metaDesc.length <= 160) {
      score += 5;
    } else {
      score += 2;
    }

    // 11. Word variety (5 points)
    const uniqueWords = new Set(plainText.toLowerCase().split(/\s+/));
    const uniqueRatio = uniqueWords.size / wordCount;
    if (uniqueRatio > 0.5) {
      score += 5;
    } else {
      score += 3;
    }

    const improvements: string[] = [];
    issues.forEach((issue) => {
      if (issue.autoFixable) {
        improvements.push(`Auto-fix: ${issue.message}`);
      }
    });

    return {
      score: Math.min(100, score),
      issues,
      suggestions,
      improvements,
      isReadyForPublish: score >= 80,
    };
  }

  private autoFixIssues(
    content: string,
    title: string,
    focusKeyword: string,
    report: AnalysisReport,
    urlSlug?: string,
  ): {
    title: string;
    content: string;
    metaDescription: string;
    slug: string;
    tags: string[];
    faqSection: string;
    internalLinks: string[];
    externalLinks: string[];
  } {
    let optimizedContent = content;
    const keyword = focusKeyword.toLowerCase();

    // 1. Fix first paragraph if keyword missing
    if (
      !optimizedContent
        .replace(/<[^>]*>/g, '')
        .substring(0, 200)
        .toLowerCase()
        .includes(keyword)
    ) {
      optimizedContent = this.addKeywordToFirstParagraph(optimizedContent, focusKeyword);
    }

    // 2. Add keyword to H2 headings if needed
    const h2WithKeyword = (
      optimizedContent.match(
        new RegExp('<h2[^>]*>[^<]*' + this.escapeRegex(keyword) + '[^<]*</h2>', 'gi'),
      ) || []
    ).length;

    if (h2WithKeyword < 3) {
      optimizedContent = this.addKeywordToHeadings(optimizedContent, focusKeyword);
    }

    // 3. Add FAQ section if missing
    const hasFAQ = /<h[23][^>]*>.*(?:faq|questions?)/i.test(optimizedContent);
    let faqSection = '';
    if (!hasFAQ) {
      faqSection = this.generateFAQSection(focusKeyword);
      optimizedContent = optimizedContent + '\n\n' + faqSection;
    }

    // 4. Ensure images have alt text
    optimizedContent = this.fixImageAltText(optimizedContent, focusKeyword);

    // 5. Add internal/external links if needed
    const linkCount = (optimizedContent.match(/<a[^>]*>/gi) || []).length;
    if (linkCount < 3) {
      optimizedContent = optimizedContent + this.generateRelatedLinks(focusKeyword);
    }

    // 6. Generate proper meta description
    const metaDescription = this.generateMetaDescription(optimizedContent, focusKeyword, 155);

    // 7. Generate URL slug
    const slug = urlSlug || this.generateSlug(title);

    // 8. Generate tags
    const tags = this.generateTags(optimizedContent, focusKeyword);

    // 9. Extract existing links
    const internalLinks = this.extractLinks(optimizedContent, true);
    const externalLinks = this.extractLinks(optimizedContent, false);

    return {
      title: this.optimizeTitle(title, focusKeyword),
      content: optimizedContent,
      metaDescription,
      slug,
      tags,
      faqSection,
      internalLinks,
      externalLinks,
    };
  }

  private addKeywordToFirstParagraph(content: string, keyword: string): string {
    const plainContent = content.replace(/<[^>]*>/g, ' ');
    const firstPunct = plainContent.indexOf('.');

    if (firstPunct === -1 || firstPunct > 150) {
      return content;
    }

    const firstParagraphEnd = firstPunct + 1;
    const firstParagraph = plainContent.substring(0, firstParagraphEnd).trim();

    const insertionPoint = Math.min(50, firstParagraph.length);
    const enhanced =
      firstParagraph.substring(0, insertionPoint) +
      ' ' +
      keyword +
      firstParagraph.substring(insertionPoint);

    const escapedParagraph = this.escapeRegex(firstParagraph);
    const regex = new RegExp(escapedParagraph, 'i');
    return content.replace(regex, enhanced);
  }

  private addKeywordToHeadings(content: string, keyword: string): string {
    const h2Regex = /<h2([^>]*)>([^<]+)<\/h2>/gi;
    let match;
    let count = 0;
    let result = content;

    while ((match = h2Regex.exec(content)) !== null && count < 2) {
      if (!match[2].toLowerCase().includes(keyword.toLowerCase())) {
        const enhanced = '<h2' + match[1] + '>' + match[2] + ' - ' + keyword + '</h2>';
        result = result.replace(match[0], enhanced);
        count++;
      }
    }

    return result;
  }

  private generateFAQSection(keyword: string): string {
    const faqs = [
      {
        question: 'What is ' + keyword + '?',
        answer:
          keyword +
          ' refers to the latest developments in technology. It encompasses various aspects including implementation, best practices, and real-world applications that are transforming how we interact with technology.',
      },
      {
        question: 'How does ' + keyword + ' work?',
        answer:
          keyword +
          ' works through advanced algorithms and modern computing infrastructure. The technology leverages cloud resources and innovative approaches to deliver seamless experiences across different platforms.',
      },
      {
        question: 'Is ' + keyword + ' worth investing in?',
        answer:
          'Yes, ' +
          keyword +
          ' represents significant advancement. Organizations investing in ' +
          keyword +
          ' are seeing substantial returns in productivity and competitive advantage.',
      },
      {
        question: 'What are the main benefits of ' + keyword + '?',
        answer:
          'Main benefits include improved efficiency, cost savings, enhanced user experience, and scalability. ' +
          keyword +
          ' also offers better integration and future-proof features.',
      },
      {
        question: 'How can I get started with ' + keyword + '?',
        answer:
          'To get started, assess your current infrastructure and identify areas where ' +
          keyword +
          ' can add value. Begin with a pilot project, gather feedback, and scale gradually.',
      },
    ];

    let faqHtml = '\n\n<h2>Frequently Asked Questions About ' + keyword + '</h2>\n';
    faqHtml += '<div itemscope itemtype="https://schema.org/FAQPage">\n';

    faqs.forEach((faq) => {
      faqHtml += '<div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">\n';
      faqHtml += '<h3 itemprop="name">' + faq.question + '</h3>\n';
      faqHtml += '<div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">\n';
      faqHtml += '<div itemprop="text">' + faq.answer + '</div>\n';
      faqHtml += '</div>\n</div>\n';
    });

    faqHtml += '</div>\n';

    return faqHtml;
  }

  private fixImageAltText(content: string, keyword: string): string {
    let fixed = content.replace(/<img([^>]*?)>/gi, (match, attrs) => {
      if (!attrs.includes('alt=')) {
        return '<img' + attrs + ' alt="' + keyword + ' - Related image">';
      }
      return match;
    });

    return fixed;
  }

  private generateRelatedLinks(keyword: string): string {
    return `
<div class="related-resources">
<h3>Related Resources</h3>
<ul>
<li><a href="#">Learn more about ${keyword}</a></li>
<li><a href="#">${keyword} best practices guide</a></li>
<li><a href="#">Latest ${keyword} news and updates</a></li>
</ul>
</div>`;
  }

  private optimizeTitle(title: string, keyword: string): string {
    const keywordLower = keyword.toLowerCase();
    const titleLower = title.toLowerCase();

    if (titleLower.includes(keywordLower)) {
      if (title.length < 40) {
        const baseTitle = title.replace(new RegExp(this.escapeRegex(keyword), 'i'), '').trim();
        return (keyword + ': ' + baseTitle).substring(0, 60);
      }
      return title;
    }

    if (title.length + keyword.length + 3 <= 60) {
      return keyword + ' - ' + title;
    }

    return title;
  }

  private generateMetaDescription(content: string, keyword: string, maxLength: number): string {
    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    let description = plainText.substring(0, maxLength);

    const lastSpace = description.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      description = description.substring(0, lastSpace);
    }

    if (!description.toLowerCase().includes(keyword.toLowerCase())) {
      description = keyword + ' - ' + description;
      if (description.length > maxLength) {
        description = description.substring(0, maxLength - 3) + '...';
      }
    }

    return description.trim();
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  private generateTags(content: string, keyword: string): string[] {
    const tags = [keyword];

    const words = content
      .replace(/<[^>]*>/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);

    const frequency: { [key: string]: number } = {};
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }

    const topWords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .filter(([word]) => !tags.includes(word) && !tags.some((t) => t.includes(word)))
      .map(([word]) => word);

    tags.push(...topWords);

    return tags.slice(0, 8);
  }

  private extractLinks(content: string, isInternal: boolean): string[] {
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      if (isInternal && (href.startsWith('/') || href.includes('dastgeertech'))) {
        links.push(href);
      } else if (!isInternal && href.startsWith('http')) {
        links.push(href);
      }
    }

    return links;
  }

  private getWordCount(content: string): number {
    return content
      .replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getScoreBreakdown(
    report: AnalysisReport,
  ): { category: string; score: number; maxScore: number }[] {
    return [
      { category: 'Title Optimization', score: Math.min(20, report.score * 0.2), maxScore: 20 },
      { category: 'Content Quality', score: Math.min(20, report.score * 0.2), maxScore: 20 },
      { category: 'Keyword Usage', score: Math.min(15, report.score * 0.15), maxScore: 15 },
      { category: 'Structure & Headings', score: Math.min(15, report.score * 0.15), maxScore: 15 },
      { category: 'Media & Links', score: Math.min(15, report.score * 0.15), maxScore: 15 },
      { category: 'Readability', score: Math.min(15, report.score * 0.15), maxScore: 15 },
    ];
  }
}
