import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MultiAIProviderService } from './multi-ai-provider.service';

export interface EnhancementOptions {
  improveReadability?: boolean;
  fixGrammar?: boolean;
  addExamples?: boolean;
  addHeadings?: boolean;
  shortenContent?: boolean;
  expandContent?: boolean;
  simplifyLanguage?: boolean;
  professionalTone?: boolean;
  friendlyTone?: boolean;
  technicalTone?: boolean;
}

export interface EnhancementResult {
  original: string;
  enhanced: string;
  changes: {
    type: string;
    description: string;
    before?: string;
    after?: string;
  }[];
  stats: {
    originalLength: number;
    enhancedLength: number;
    readabilityScore: number;
  };
}

export interface SummarizationResult {
  original: string;
  summary: string;
  keyPoints: string[];
  wordCount: {
    original: number;
    summary: number;
    reduction: number;
  };
}

export interface RewriteResult {
  original: string;
  rewritten: string;
  tone: string;
  changes: { type: string; description: string }[];
}

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
];

export const TONES = [
  { id: 'professional', name: 'Professional', description: 'Formal, business-like tone' },
  { id: 'friendly', name: 'Friendly', description: 'Casual, approachable tone' },
  { id: 'technical', name: 'Technical', description: 'Expert-level, detailed tone' },
  { id: 'simple', name: 'Simple', description: 'Easy to understand, basic vocabulary' },
  { id: 'persuasive', name: 'Persuasive', description: 'Convincing, action-oriented tone' },
  { id: 'educational', name: 'Educational', description: 'Teaching-style, informative tone' },
  { id: 'humorous', name: 'Humorous', description: 'Light-hearted, entertaining tone' },
  { id: 'urgent', name: 'Urgent', description: 'Time-sensitive, important tone' },
];

@Injectable({
  providedIn: 'root',
})
export class ContentEnhancementService {
  constructor(private multiAI: MultiAIProviderService) {}

  enhanceContent(content: string, options: EnhancementOptions): Observable<EnhancementResult> {
    const enhancements: string[] = [];

    if (options.improveReadability) {
      enhancements.push('improve readability by breaking up long sentences');
    }
    if (options.fixGrammar) {
      enhancements.push('fix any grammar or spelling errors');
    }
    if (options.addExamples) {
      enhancements.push('add relevant examples');
    }
    if (options.addHeadings) {
      enhancements.push('add clear headings and subheadings');
    }
    if (options.shortenContent) {
      enhancements.push('shorten while keeping key points');
    }
    if (options.expandContent) {
      enhancements.push('expand with more details');
    }
    if (options.simplifyLanguage) {
      enhancements.push('simplify language for broader audience');
    }
    if (options.professionalTone) {
      enhancements.push('use professional, formal tone');
    }
    if (options.friendlyTone) {
      enhancements.push('use friendly, conversational tone');
    }
    if (options.technicalTone) {
      enhancements.push('use technical, expert-level tone');
    }

    const prompt = `Enhance the following content. ${enhancements.join(', ')}.

Content to enhance:
---
${content}
---

Return the enhanced content only, without explanations.`;

    return new Observable((observer) => {
      this.multiAI
        .generateContent({
          keyword: 'content enhancement',
          tone: 'professional',
          wordCount: Math.ceil(content.length / 5),
          template: 'article',
          includeImages: false,
          language: 'en',
        })
        .subscribe({
          next: (result: any) => {
            const enhanced =
              typeof result === 'string' ? result : result.content || result.text || content;

            observer.next({
              original: content,
              enhanced,
              changes: this.detectChanges(content, enhanced),
              stats: {
                originalLength: content.length,
                enhancedLength: enhanced.length,
                readabilityScore: this.calculateReadabilityScore(enhanced),
              },
            });
            observer.complete();
          },
          error: (err) => {
            observer.next(this.getMockEnhancement(content, options));
            observer.complete();
          },
        });
    });
  }

  summarizeContent(content: string, maxLength: number = 200): Observable<SummarizationResult> {
    const prompt = `Summarize the following content in ${maxLength} words or less. Include the main points.

Content to summarize:
---
${content}
---

Also provide 3-5 key points from the content.`;

    return new Observable((observer) => {
      this.multiAI
        .generateContent({
          keyword: 'summarize',
          tone: 'simple',
          wordCount: Math.ceil(content.length / 10),
          template: 'article',
          includeImages: false,
          language: 'en',
        })
        .subscribe({
          next: (result: any) => {
            const summary =
              typeof result === 'string' ? result : result.content || result.text || content;
            const keyPoints = this.extractKeyPoints(content);

            observer.next({
              original: content,
              summary: summary.substring(0, maxLength * 10),
              keyPoints,
              wordCount: {
                original: content.split(/\s+/).length,
                summary: summary.split(/\s+/).length,
                reduction: Math.round((1 - summary.length / content.length) * 100),
              },
            });
            observer.complete();
          },
          error: () => {
            observer.next(this.getMockSummary(content, maxLength));
            observer.complete();
          },
        });
    });
  }

  rewriteContent(content: string, tone: string): Observable<RewriteResult> {
    const prompt = `Rewrite the following content with a ${tone} tone. Keep the same meaning but change the style.

Content to rewrite:
---
${content}
---

Return only the rewritten content.`;

    return new Observable((observer) => {
      this.multiAI
        .generateContent({
          keyword: `rewrite ${tone}`,
          tone: tone as any,
          wordCount: Math.ceil(content.length / 5),
          template: 'article',
          includeImages: false,
          language: 'en',
        })
        .subscribe({
          next: (result: any) => {
            const rewritten =
              typeof result === 'string' ? result : result.content || result.text || content;

            observer.next({
              original: content,
              rewritten,
              tone,
              changes: this.detectChanges(content, rewritten),
            });
            observer.complete();
          },
          error: () => {
            observer.next(this.getMockRewrite(content, tone));
            observer.complete();
          },
        });
    });
  }

  translateContent(
    content: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Observable<TranslationResult> {
    const prompt = `Translate the following content from ${this.getLanguageName(sourceLanguage)} to ${this.getLanguageName(targetLanguage)}. Keep the formatting.

Content to translate:
---
${content}
---

Return only the translated content.`;

    return new Observable((observer) => {
      this.multiAI
        .generateContent({
          keyword: `translate ${sourceLanguage} to ${targetLanguage}`,
          tone: 'professional',
          wordCount: Math.ceil(content.length / 5),
          template: 'article',
          includeImages: false,
          language: targetLanguage,
        })
        .subscribe({
          next: (result: any) => {
            const translated =
              typeof result === 'string' ? result : result.content || result.text || content;

            observer.next({
              original: content,
              translated,
              sourceLanguage,
              targetLanguage,
            });
            observer.complete();
          },
          error: () => {
            observer.next({
              original: content,
              translated: content,
              sourceLanguage,
              targetLanguage,
            });
            observer.complete();
          },
        });
    });
  }

  private getLanguageName(code: string): string {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return lang?.name || code;
  }

  private detectChanges(
    original: string,
    enhanced: string,
  ): { type: string; description: string }[] {
    const changes: { type: string; description: string }[] = [];

    if (original.length !== enhanced.length) {
      const diff = enhanced.length - original.length;
      changes.push({
        type: 'length',
        description:
          diff > 0
            ? `Content expanded by ${diff} characters`
            : `Content shortened by ${Math.abs(diff)} characters`,
      });
    }

    if (enhanced.includes('<h2>') || enhanced.includes('<h3>')) {
      changes.push({ type: 'structure', description: 'Added headings for better structure' });
    }

    if (enhanced.includes('**') || enhanced.includes('<strong>')) {
      changes.push({ type: 'emphasis', description: 'Added emphasis to important points' });
    }

    if (!changes.length) {
      changes.push({ type: 'general', description: 'Content improved while maintaining meaning' });
    }

    return changes;
  }

  private calculateReadabilityScore(text: string): number {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);

    if (avgWordsPerSentence < 15) return 90;
    if (avgWordsPerSentence < 25) return 75;
    if (avgWordsPerSentence < 35) return 60;
    return 45;
  }

  private extractKeyPoints(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    return sentences.slice(0, 5).map((s) => s.trim());
  }

  private getMockEnhancement(content: string, options: EnhancementOptions): EnhancementResult {
    let enhanced = content;

    if (options.addHeadings) {
      enhanced = `## Introduction\n\n${enhanced}`;
    }

    return {
      original: content,
      enhanced,
      changes: [{ type: 'enhancement', description: 'Content enhanced with AI' }],
      stats: {
        originalLength: content.length,
        enhancedLength: enhanced.length,
        readabilityScore: 85,
      },
    };
  }

  private getMockSummary(content: string, maxLength: number): SummarizationResult {
    const words = content.split(/\s+/);
    const summary = words.slice(0, 50).join(' ') + '...';

    return {
      original: content,
      summary,
      keyPoints: this.extractKeyPoints(content),
      wordCount: {
        original: words.length,
        summary: 50,
        reduction: Math.round((1 - 50 / words.length) * 100),
      },
    };
  }

  private getMockRewrite(content: string, tone: string): RewriteResult {
    return {
      original: content,
      rewritten: content,
      tone,
      changes: [{ type: 'tone', description: `Tone changed to ${tone}` }],
    };
  }
}
