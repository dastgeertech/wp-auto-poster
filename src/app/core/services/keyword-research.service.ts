import { Injectable } from '@angular/core';

export interface KeywordAnalysis {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: 'low' | 'medium' | 'high';
  trends: {
    month: string;
    value: number;
  }[];
  relatedKeywords: string[];
  questions: string[];
  suggestions: string[];
}

export interface KeywordCluster {
  mainKeyword: string;
  relatedKeywords: string[];
  intent: 'informational' | 'transactional' | 'navigational' | 'commercial';
}

@Injectable({
  providedIn: 'root',
})
export class KeywordResearchService {
  private searchHistory: string[] = [];

  constructor() {
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem('keyword_history');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (e) {}
  }

  private saveHistory(): void {
    localStorage.setItem('keyword_history', JSON.stringify(this.searchHistory.slice(0, 100)));
  }

  analyzeKeyword(keyword: string): KeywordAnalysis {
    if (!this.searchHistory.includes(keyword)) {
      this.searchHistory.unshift(keyword);
      this.saveHistory();
    }

    const baseVolume = this.generateVolume(keyword);
    const difficulty = this.calculateDifficulty(keyword);
    const cpc = this.generateCpc(difficulty);

    return {
      keyword,
      volume: baseVolume,
      difficulty,
      cpc,
      competition: this.getCompetitionLevel(difficulty),
      trends: this.generateTrends(keyword),
      relatedKeywords: this.generateRelatedKeywords(keyword),
      questions: this.generateQuestions(keyword),
      suggestions: this.generateSuggestions(keyword),
    };
  }

  private generateVolume(keyword: string): number {
    const hash = this.hashString(keyword);
    const base = (hash % 90000) + 10000;
    return Math.round(base * (0.5 + Math.random()));
  }

  private calculateDifficulty(keyword: string): number {
    const hash = this.hashString(keyword);
    const base = hash % 100;

    const wordCount = keyword.split(' ').length;
    let modifier = 0;

    if (keyword.includes('best')) modifier += 15;
    if (keyword.includes('review')) modifier += 10;
    if (keyword.includes('free')) modifier -= 20;
    if (wordCount > 3) modifier -= 15;
    if (wordCount === 1) modifier += 20;

    return Math.min(100, Math.max(0, base + modifier));
  }

  private generateCpc(difficulty: number): number {
    const base = difficulty * 0.15 + 0.5;
    return Math.round(base * 100) / 100;
  }

  private getCompetitionLevel(difficulty: number): 'low' | 'medium' | 'high' {
    if (difficulty < 33) return 'low';
    if (difficulty < 66) return 'medium';
    return 'high';
  }

  private generateTrends(keyword: string): { month: string; value: number }[] {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const hash = this.hashString(keyword);
    const currentMonth = new Date().getMonth();

    return months.map((month, i) => {
      const offset = Math.sin((i + (hash % 6)) * 0.8) * 20;
      const trend = Math.sin(i * 0.5 + (hash % 10) * 0.3) * 15;
      const seasonal = i === currentMonth ? 20 : 0;
      return {
        month,
        value: Math.max(0, 50 + offset + trend + seasonal + Math.random() * 10),
      };
    });
  }

  private generateRelatedKeywords(keyword: string): string[] {
    const modifiers = [
      '2026',
      'best',
      'top',
      'free',
      'cheap',
      'review',
      'alternatives',
      'vs',
      'guide',
      'tutorial',
      'tips',
      'strategies',
      'tools',
      'software',
      'apps',
      'platforms',
    ];

    const base = keyword.toLowerCase();
    const results: string[] = [];

    for (let i = 0; i < 8; i++) {
      const mod = modifiers[this.hashString(keyword + i) % modifiers.length];
      results.push(`${mod} ${base}`);
    }

    const wordSplit = base.split(' ');
    if (wordSplit.length > 1) {
      results.push(`${wordSplit[0]} ${wordSplit[1]} alternatives`);
      results.push(`${wordSplit[0]} ${wordSplit[1]} comparison`);
    }

    return results.slice(0, 10);
  }

  private generateQuestions(keyword: string): string[] {
    const questionTypes = [
      `What is ${keyword}?`,
      `How to use ${keyword}?`,
      `Why is ${keyword} important?`,
      `Best ${keyword} for 2026?`,
      `How to choose ${keyword}?`,
      `Is ${keyword} worth it?`,
      `Top ${keyword} features?`,
      `How to get started with ${keyword}?`,
    ];

    return questionTypes.slice(0, 6);
  }

  private generateSuggestions(keyword: string): string[] {
    const suggestions: string[] = [];
    const words = keyword.split(' ');

    if (words.length < 3) {
      suggestions.push(`${keyword} for beginners`);
      suggestions.push(`${keyword} pricing`);
      suggestions.push(`${keyword} alternatives free`);
      suggestions.push(`how to optimize ${keyword}`);
    } else {
      suggestions.push(`best ${words[words.length - 1]} 2026`);
      suggestions.push(`${words[0]} vs ${words[words.length - 1]}`);
      suggestions.push(`${keyword} tutorial step by step`);
      suggestions.push(`ultimate guide to ${keyword}`);
    }

    return suggestions;
  }

  getKeywordClusters(keywords: string[]): KeywordCluster[] {
    const clusters: KeywordCluster[] = [];
    const processed = new Set<string>();

    for (const keyword of keywords) {
      if (processed.has(keyword.toLowerCase())) continue;

      const related = this.generateRelatedKeywords(keyword);
      const intent = this.determineIntent(keyword);

      clusters.push({
        mainKeyword: keyword,
        relatedKeywords: related.filter((k) => !processed.has(k.toLowerCase())).slice(0, 5),
        intent,
      });

      processed.add(keyword.toLowerCase());
      related.forEach((k) => processed.add(k.toLowerCase()));
    }

    return clusters;
  }

  private determineIntent(
    keyword: string,
  ): 'informational' | 'transactional' | 'navigational' | 'commercial' {
    const lower = keyword.toLowerCase();

    if (lower.includes('buy') || lower.includes('price') || lower.includes('cost')) {
      return 'transactional';
    }
    if (lower.includes('vs') || lower.includes('compare')) {
      return 'commercial';
    }
    if (lower.includes('login') || lower.includes('official')) {
      return 'navigational';
    }
    return 'informational';
  }

  compareKeywords(keywords: string[]): KeywordAnalysis[] {
    return keywords.map((k) => this.analyzeKeyword(k));
  }

  getSearchHistory(): string[] {
    return this.searchHistory.slice(0, 50);
  }

  clearHistory(): void {
    this.searchHistory = [];
    this.saveHistory();
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getDifficultyColor(difficulty: number): string {
    if (difficulty < 33) return '#00d9a5';
    if (difficulty < 66) return '#ffc107';
    return '#ff6b6b';
  }

  getVolumeColor(volume: number): string {
    if (volume > 50000) return '#00d9a5';
    if (volume > 10000) return '#64b5f6';
    return '#ffc107';
  }
}
