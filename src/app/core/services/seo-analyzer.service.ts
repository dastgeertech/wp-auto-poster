import { Injectable } from '@angular/core';
import { SeoAnalysis } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SeoAnalyzerService {
  analyzeSeo(
    content: string,
    title: string,
    focusKeyword: string,
    url: string = '',
    metaDescription?: string,
  ): SeoAnalysis {
    const suggestions: string[] = [];
    let score = 0;

    const keyword = focusKeyword.toLowerCase().trim();
    const contentLower = content.toLowerCase();
    const titleLower = title.toLowerCase();

    // 1. Keyword in title (12 points)
    const titleHasKeyword = titleLower.includes(keyword);
    if (titleHasKeyword) {
      score += 12;
    } else {
      suggestions.push(`Add focus keyword "${focusKeyword}" to the title`);
    }

    // 2. Keyword in first 100 words (10 points)
    const first100Words = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500)
      .toLowerCase();
    const firstParagraphHasKeyword = first100Words.includes(keyword);
    if (firstParagraphHasKeyword) {
      score += 10;
    } else {
      suggestions.push(`Include focus keyword in the first paragraph`);
    }

    // 3. Keyword density 1-3% (12 points)
    const wordCount = this.getWordCount(content);
    const keywordCount = this.countKeywordOccurrences(contentLower, keyword);
    const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

    if (keywordDensity >= 1 && keywordDensity <= 3) {
      score += 12;
    } else if (keywordDensity > 0 && keywordDensity < 1) {
      score += 6;
      suggestions.push(
        `Increase keyword density (currently ${keywordDensity.toFixed(1)}%, aim for 1-3%)`,
      );
    } else if (keywordDensity > 3) {
      score += 8;
      suggestions.push(
        `Reduce keyword density (currently ${keywordDensity.toFixed(1)}%, keep under 3%)`,
      );
    } else {
      suggestions.push(`Add focus keyword to the content`);
    }

    // 4. Meta description optimized (12 points)
    const metaDescLength = metaDescription ? metaDescription.length : 0;
    const hasMetaDescription = !!metaDescription;
    const metaHasKeyword = metaDescription?.toLowerCase().includes(keyword);

    if (hasMetaDescription && metaDescLength >= 120 && metaDescLength <= 160 && metaHasKeyword) {
      score += 12;
    } else if (hasMetaDescription && metaDescLength >= 120 && metaDescLength <= 160) {
      score += 8;
      suggestions.push(`Add focus keyword to meta description`);
    } else if (hasMetaDescription && metaDescLength > 0) {
      score += 5;
      suggestions.push(
        `Meta description should be 120-160 characters (currently ${metaDescLength})`,
      );
    } else {
      suggestions.push(`Add a meta description between 120-160 characters`);
    }

    // 5. Content length optimized (10 points)
    if (wordCount >= 1500) {
      score += 10;
    } else if (wordCount >= 1000) {
      score += 8;
    } else if (wordCount >= 800) {
      score += 6;
      suggestions.push(`Content could be longer for better SEO (currently ${wordCount} words)`);
    } else if (wordCount >= 500) {
      score += 4;
      suggestions.push(`Content could be longer (currently ${wordCount} words, aim for 800+)`);
    } else {
      suggestions.push(`Increase content length (currently ${wordCount} words, aim for 800+)`);
    }

    // 6. Heading structure optimized (8 points)
    const headingCount = this.countHeadings(content);
    const keywordInHeadings = this.countKeywordInHeadings(content, keyword);
    if (headingCount >= 6 && keywordInHeadings >= 3) {
      score += 8;
    } else if (headingCount >= 4 && keywordInHeadings >= 2) {
      score += 6;
      suggestions.push(`Consider adding more H2 headings with keyword`);
    } else if (headingCount >= 2) {
      score += 4;
      suggestions.push(`Consider adding more subheadings (currently ${headingCount})`);
    } else {
      suggestions.push(`Add at least 2 subheadings (currently ${headingCount})`);
    }

    // 7. Images with optimized alt text (8 points)
    const hasImages = this.hasImages(content);
    const imageAltText = this.hasAltText(content);
    const altTextWithKeyword = this.hasAltTextWithKeyword(content, keyword);
    if (hasImages && altTextWithKeyword) {
      score += 8;
    } else if (hasImages && imageAltText) {
      score += 6;
      suggestions.push(`Add focus keyword to image alt text`);
    } else if (hasImages) {
      score += 3;
      suggestions.push(`Add descriptive alt text to images with the focus keyword`);
    } else {
      suggestions.push(`Add at least one image with descriptive alt text`);
    }

    // 8. Internal/External links optimized (8 points)
    const internalLinks = this.countInternalLinks(content);
    const externalLinks = this.countExternalLinks(content);
    const totalLinks = internalLinks + externalLinks;
    if (totalLinks >= 4 && internalLinks >= 2 && externalLinks >= 2) {
      score += 8;
    } else if (totalLinks >= 3) {
      score += 6;
      if (internalLinks < 1) suggestions.push(`Add more internal links`);
      if (externalLinks < 1) suggestions.push(`Add external links to authoritative sources`);
    } else if (totalLinks >= 2) {
      score += 4;
      suggestions.push(`Consider adding more links for better SEO`);
    } else if (totalLinks >= 1) {
      score += 2;
      suggestions.push(`Add at least 2 internal/external links`);
    } else {
      suggestions.push(`Add at least 2 internal/external links`);
    }

    // 9. URL optimized (5 points)
    const urlHasKeyword = url.toLowerCase().includes(keyword.replace(/\s+/g, '-'));
    if (urlHasKeyword) {
      score += 5;
    } else {
      suggestions.push(`Include focus keyword in the URL slug`);
    }

    // 10. FAQ/Featured Snippet Ready (5 points)
    const hasFAQ = this.hasFAQSection(content);
    const hasList = this.hasBulletPoints(content);
    if (hasFAQ && hasList) {
      score += 5;
    } else if (hasFAQ || hasList) {
      score += 3;
      if (!hasFAQ) suggestions.push(`Add FAQ section for featured snippet optimization`);
    } else {
      suggestions.push(`Add FAQ section for better search visibility`);
    }

    // 11. Word count in first paragraph (5 points)
    const firstParaWords = this.getFirstParagraphWordCount(content);
    if (firstParaWords >= 50 && firstParaWords <= 150) {
      score += 5;
    } else if (firstParaWords >= 30) {
      score += 3;
    } else {
      score += 1;
      suggestions.push(`First paragraph should be 50-150 words (currently ${firstParaWords})`);
    }

    // 12. Content freshness indicators (5 points)
    const hasDate = this.hasDateIndicators(content);
    const hasStatistics = this.hasStatistics(content);
    if (hasDate && hasStatistics) {
      score += 5;
    } else if (hasDate || hasStatistics) {
      score += 3;
    } else {
      score += 1;
      suggestions.push(`Add dates and statistics to show content freshness`);
    }

    // Calculate readability
    const readabilityScore = this.calculateReadability(content);

    // Readability bonus (5 points)
    if (readabilityScore >= 60 && readabilityScore <= 80) {
      score += 5;
    } else if (readabilityScore >= 50) {
      score += 3;
    }

    return {
      score,
      focusKeyword,
      titleHasKeyword,
      firstParagraphHasKeyword,
      keywordDensity,
      metaDescriptionLength: metaDescLength,
      hasMetaDescription,
      contentLength: wordCount,
      headingCount,
      hasImages,
      imageAltText,
      internalLinks,
      externalLinks,
      readabilityScore,
      suggestions: suggestions.slice(0, 10),
      urlHasKeyword,
    };
  }

  private getWordCount(text: string): number {
    return text
      .replace(/<[^>]*>/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private countKeywordOccurrences(text: string, keyword: string): number {
    if (!keyword) return 0;
    const regex = new RegExp(this.escapeRegex(keyword), 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private countHeadings(content: string): number {
    const h2Matches = content.match(/<h2[^>]*>/gi) || [];
    const h3Matches = content.match(/<h3[^>]*>/gi) || [];
    return h2Matches.length + h3Matches.length;
  }

  private hasImages(content: string): boolean {
    return content.includes('<img') || content.includes('![image]') || content.includes('![alt]');
  }

  private hasAltText(content: string): boolean {
    const imgRegex = /<img[^>]*alt=["']([^"']+)["'][^>]*>/gi;
    const match = imgRegex.exec(content);
    return match !== null && match[1].length > 0;
  }

  private countInternalLinks(content: string): number {
    const regex = new RegExp('<a[^>]*href=["\'](/[^"\']*)["\'][^>]*>', 'gi');
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  }

  private countExternalLinks(content: string): number {
    const regex = new RegExp('<a[^>]*href=["\'](https?://[^"\']*)["\'][^>]*>', 'gi');
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  }

  calculateReadability(content: string): number {
    const plainText = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = plainText.split(/\s+/).filter((w) => w.length > 0);

    if (words.length === 0) return 0;

    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const complexWords = words.filter((w) => w.length > 6).length;
    const avgSyllablesPerWord = this.countSyllables(plainText) / words.length;

    // Flesch Reading Ease formula approximation
    let score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    // Normalize to 0-100
    score = Math.max(0, Math.min(100, score));

    return Math.round(score);
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let total = 0;

    for (const word of words) {
      let syllables = word.length / 3;
      if (word.endsWith('e')) syllables -= 0.1;
      if (word.endsWith('ed') && word.length > 3) syllables -= 0.1;
      if (word.includes('le') && word.length > 2 && !word.includes('ble')) syllables += 0.1;
      total += Math.max(1, Math.round(syllables));
    }

    return total;
  }

  private countKeywordInHeadings(content: string, keyword: string): number {
    const h2Matches = content.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
    const h3Matches = content.match(/<h3[^>]*>([^<]+)<\/h3>/gi) || [];
    const allHeadings = [...h2Matches, ...h3Matches];
    let count = 0;

    for (const heading of allHeadings) {
      if (heading.toLowerCase().includes(keyword.toLowerCase())) {
        count++;
      }
    }

    return count;
  }

  private hasAltTextWithKeyword(content: string, keyword: string): boolean {
    const imgRegex = /<img[^>]*alt=["']([^"']+)["'][^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      if (match[1].toLowerCase().includes(keyword.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  private hasFAQSection(content: string): boolean {
    const faqPatterns = [
      /<h[23][^>]*>.*faq.*<\/h[23]>/i,
      /<h[23][^>]*>.*questions.*<\/h[23]>/i,
      /<h[23][^>]*>.*frequently.*asked.*<\/h[23]>/i,
    ];

    for (const pattern of faqPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  private hasBulletPoints(content: string): boolean {
    const ulCount = (content.match(/<ul[^>]*>/gi) || []).length;
    const liCount = (content.match(/<li[^>]*>/gi) || []).length;

    return ulCount >= 2 || liCount >= 4;
  }

  private getFirstParagraphWordCount(content: string): number {
    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const firstParaEnd = plainText.indexOf('.', 100);
    const firstPara =
      firstParaEnd > 0 ? plainText.substring(0, firstParaEnd + 1) : plainText.substring(0, 200);

    return firstPara.split(/\s+/).filter((w) => w.length > 0).length;
  }

  private hasDateIndicators(content: string): boolean {
    const datePatterns = [
      /\b(2024|2025|2026)\b/,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
      /\b(this year|last year|current year)\b/i,
      /\brecent(ly)?\b/i,
    ];

    for (const pattern of datePatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  private hasStatistics(content: string): boolean {
    const statPatterns = [
      /\b\d+%/,
      /\b\d+[\s-]?(million|billion|thousand|percent)\b/i,
      /\b\d+x\b/,
      /\b\$\d+(\.\d+)?\s?(billion|million|thousand)?\b/,
      /\b\d+\s?(years?|days?|months?|hours?)\b/i,
    ];

    let matchCount = 0;
    for (const pattern of statPatterns) {
      if (pattern.test(content)) {
        matchCount++;
      }
    }

    return matchCount >= 2;
  }

  generateMetaDescription(content: string, keyword: string, maxLength: number = 160): string {
    const plainText = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const first150Chars = plainText.substring(0, maxLength);

    // Try to end at a complete sentence
    const lastPeriod = first150Chars.lastIndexOf('.');
    const lastComma = first150Chars.lastIndexOf(',');

    let endIndex = lastPeriod > 50 ? lastPeriod + 1 : lastComma > 50 ? lastComma + 1 : maxLength;

    let metaDesc = plainText.substring(0, endIndex).trim();

    // Add keyword if not present
    if (!metaDesc.toLowerCase().includes(keyword.toLowerCase())) {
      metaDesc = `${keyword}: ${metaDesc}`;
    }

    return metaDesc.substring(0, maxLength);
  }

  generateSlug(keyword: string): string {
    return keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }
}
