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

    // 1. Keyword in title (10 points)
    const titleHasKeyword = titleLower.includes(keyword);
    const titleLength = title.length;
    if (titleHasKeyword && titleLength >= 30 && titleLength <= 60) {
      score += 10;
    } else if (titleHasKeyword) {
      score += 8;
      if (titleLength > 60) suggestions.push(`Title is too long (${titleLength} chars, max 60)`);
      if (titleLength < 30) suggestions.push(`Title is too short (${titleLength} chars, min 30)`);
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

    // 3. Keyword density 1-2.5% (10 points)
    const wordCount = this.getWordCount(content);
    const keywordCount = this.countKeywordOccurrences(contentLower, keyword);
    const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

    if (keywordDensity >= 1 && keywordDensity <= 2.5) {
      score += 10;
    } else if (keywordDensity > 0 && keywordDensity < 1) {
      score += 5;
      suggestions.push(
        `Increase keyword density (currently ${keywordDensity.toFixed(1)}%, aim for 1-2.5%)`,
      );
    } else if (keywordDensity > 2.5 && keywordDensity <= 3.5) {
      score += 7;
      suggestions.push(
        `Keyword density is slightly high (${keywordDensity.toFixed(1)}%), consider reducing slightly`,
      );
    } else if (keywordDensity > 3.5) {
      score += 3;
      suggestions.push(
        `Reduce keyword density (currently ${keywordDensity.toFixed(1)}%, keep under 3%)`,
      );
    } else {
      suggestions.push(`Add focus keyword to the content`);
    }

    // 4. Meta description optimized (10 points)
    const metaDescLength = metaDescription ? metaDescription.length : 0;
    const hasMetaDescription = !!metaDescription && metaDescLength > 0;
    const metaHasKeyword = metaDescription?.toLowerCase().includes(keyword);

    if (hasMetaDescription && metaDescLength >= 120 && metaDescLength <= 160 && metaHasKeyword) {
      score += 10;
    } else if (hasMetaDescription && metaDescLength >= 120 && metaDescLength <= 160) {
      score += 7;
      suggestions.push(`Add focus keyword to meta description`);
    } else if (hasMetaDescription && metaDescLength > 0) {
      score += 4;
      suggestions.push(
        `Meta description should be 120-160 characters (currently ${metaDescLength})`,
      );
    } else {
      suggestions.push(`Add a meta description between 120-160 characters`);
    }

    // 5. Content length optimized (10 points)
    if (wordCount >= 1500) {
      score += 10;
    } else if (wordCount >= 1200) {
      score += 9;
    } else if (wordCount >= 1000) {
      score += 8;
    } else if (wordCount >= 800) {
      score += 6;
      suggestions.push(`Content could be longer (currently ${wordCount} words, aim for 1200+)`);
    } else if (wordCount >= 500) {
      score += 4;
      suggestions.push(`Content could be longer (currently ${wordCount} words, aim for 800+)`);
    } else {
      suggestions.push(`Increase content length (currently ${wordCount} words, aim for 1000+)`);
    }

    // 6. Heading structure optimized (8 points)
    const headingCount = this.countHeadings(content);
    const h2Count = this.countH2Headings(content);
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
    const imagesWithAlt = this.countImagesWithAlt(content);
    if (hasImages && altTextWithKeyword && imagesWithAlt >= 2) {
      score += 8;
    } else if (hasImages && altTextWithKeyword) {
      score += 6;
      suggestions.push(`Add more images with descriptive alt text containing the keyword`);
    } else if (hasImages && imageAltText) {
      score += 4;
      suggestions.push(`Add focus keyword to image alt text`);
    } else if (hasImages) {
      score += 2;
      suggestions.push(`Add descriptive alt text to images with the focus keyword`);
    } else {
      suggestions.push(`Add at least 2 images with descriptive alt text`);
    }

    // 8. Internal/External links optimized (8 points)
    const internalLinks = this.countInternalLinks(content);
    const externalLinks = this.countExternalLinks(content);
    const totalLinks = internalLinks + externalLinks;
    const doFollowLinks = this.countDoFollowLinks(content);
    if (totalLinks >= 4 && internalLinks >= 2 && externalLinks >= 2) {
      score += 8;
    } else if (totalLinks >= 3 && internalLinks >= 1 && externalLinks >= 1) {
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
    const urlLength = url.length;
    if (urlHasKeyword && urlLength <= 50) {
      score += 5;
    } else if (urlHasKeyword) {
      score += 4;
      suggestions.push(`URL slug is too long (${urlLength} chars, keep under 50)`);
    } else {
      suggestions.push(`Include focus keyword in the URL slug`);
    }

    // 10. FAQ/Featured Snippet Ready (5 points)
    const hasFAQ = this.hasFAQSection(content);
    const faqCount = this.countFAQQuestions(content);
    const hasList = this.hasBulletPoints(content);
    if (hasFAQ && faqCount >= 4 && hasList) {
      score += 5;
    } else if (hasFAQ && faqCount >= 3) {
      score += 4;
    } else if (hasFAQ) {
      score += 3;
      suggestions.push(`Add more FAQ questions (currently ${faqCount}, aim for 4+)`);
    } else if (hasList) {
      score += 2;
      suggestions.push(`Add FAQ section for featured snippet optimization`);
    } else {
      suggestions.push(`Add FAQ section with 4+ questions for better search visibility`);
    }

    // 11. Content structure - paragraph length (5 points)
    const firstParaWords = this.getFirstParagraphWordCount(content);
    const avgParaLength = this.getAverageParagraphLength(content);
    if (
      firstParaWords >= 50 &&
      firstParaWords <= 150 &&
      avgParaLength >= 40 &&
      avgParaLength <= 100
    ) {
      score += 5;
    } else if (firstParaWords >= 30 && firstParaWords <= 200) {
      score += 3;
      if (avgParaLength > 100) suggestions.push(`Paragraphs are too long - break them up`);
    } else {
      score += 1;
      suggestions.push(`First paragraph should be 50-150 words, paragraphs should be 40-100 words`);
    }

    // 12. Content freshness indicators (5 points)
    const hasDate = this.hasDateIndicators(content);
    const hasStatistics = this.hasStatistics(content);
    const hasYear2026 = content.includes('2026');
    if (hasDate && hasStatistics && hasYear2026) {
      score += 5;
    } else if (hasDate && hasStatistics) {
      score += 4;
      suggestions.push(`Add references to 2026 to show content is current`);
    } else if (hasDate || hasStatistics) {
      score += 2;
      suggestions.push(`Add dates and statistics to show content freshness`);
    } else {
      score += 1;
      suggestions.push(`Add dates and statistics to show content is up-to-date`);
    }

    // 13. Schema markup readiness (5 points)
    const hasFAQSchema = this.hasFAQSchema(content);
    const hasArticleSchema = this.hasArticleSchema(content);
    if (hasFAQSchema && hasArticleSchema) {
      score += 5;
    } else if (hasFAQSchema || hasArticleSchema) {
      score += 3;
      suggestions.push(`Add FAQ schema markup for rich snippets`);
    } else {
      score += 2;
      suggestions.push(`Add FAQ and Article schema markup for rich snippets`);
    }

    // 14. Readability score (4 points)
    const readabilityScore = this.calculateReadability(content);
    if (readabilityScore >= 60 && readabilityScore <= 80) {
      score += 4;
    } else if (readabilityScore >= 50) {
      score += 3;
      suggestions.push(`Readability could be improved (score: ${readabilityScore})`);
    } else {
      score += 1;
      suggestions.push(`Simplify language for better readability`);
    }

    // 15. Lists and formatting (4 points)
    const ulCount = (content.match(/<ul[^>]*>/gi) || []).length;
    const olCount = (content.match(/<ol[^>]*>/gi) || []).length;
    const strongCount = (content.match(/<strong[^>]*>/gi) || []).length;
    if (ulCount >= 3 && olCount >= 1 && strongCount >= 3) {
      score += 4;
    } else if (ulCount >= 2 && strongCount >= 2) {
      score += 3;
    } else if (ulCount >= 1) {
      score += 2;
      suggestions.push(`Add more bullet points and formatting for scannability`);
    } else {
      score += 1;
      suggestions.push(`Add bullet points and formatting for better readability`);
    }

    // 16. Word count bonus for longer content (3 points)
    if (wordCount >= 2000) {
      score += 3;
    } else if (wordCount >= 1800) {
      score += 2;
    } else if (wordCount >= 1500) {
      score += 1;
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
      suggestions: suggestions.slice(0, 15),
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

  private countH2Headings(content: string): number {
    const h2Matches = content.match(/<h2[^>]*>/gi) || [];
    return h2Matches.length;
  }

  private countImagesWithAlt(content: string): number {
    const imgRegex = /<img[^>]*alt=["']([^"']+)["'][^>]*>/gi;
    let count = 0;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      if (match[1] && match[1].length > 0) {
        count++;
      }
    }
    return count;
  }

  private countDoFollowLinks(content: string): number {
    const nofollowRegex = /<a[^>]*rel=["']([^"']*)["'][^>]*>/gi;
    const allLinks = (content.match(/<a[^>]*>/gi) || []).length;
    let nofollowCount = 0;
    let match;
    while ((match = nofollowRegex.exec(content)) !== null) {
      if (match[1] && match[1].includes('nofollow')) {
        nofollowCount++;
      }
    }
    return Math.max(0, allLinks - nofollowCount);
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

  private countFAQQuestions(content: string): number {
    const dlMatches = content.match(/<dl[^>]*>[\s\S]*?<\/dl>/gi) || [];
    let questionCount = 0;

    for (const dl of dlMatches) {
      const dtMatches = dl.match(/<dt[^>]*>/gi) || [];
      questionCount += dtMatches.length;
    }

    const h3Matches = content.match(/<h[23][^>]*>.*\?.*<\/h[23]>/gi) || [];
    questionCount += h3Matches.length;

    const liMatches = content.match(/<li[^>]*>[^<]*\?[^<]*<\/li>/gi) || [];
    questionCount += liMatches.length;

    return questionCount;
  }

  private getAverageParagraphLength(content: string): number {
    const paragraphs = content.split(/<\/p>/gi).filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0) return 0;

    const totalWords = paragraphs.reduce((sum, p) => {
      const plainText = p
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return sum + plainText.split(/\s+/).filter((w) => w.length > 0).length;
    }, 0);

    return Math.round(totalWords / paragraphs.length);
  }

  private hasFAQSchema(content: string): boolean {
    return content.includes('application/ld+json') && content.includes('FAQPage');
  }

  private hasArticleSchema(content: string): boolean {
    return (
      content.includes('application/ld+json') &&
      (content.includes('NewsArticle') || content.includes('Article'))
    );
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
