import { Injectable, signal } from '@angular/core';

export interface TrackedKeyword {
  id: string;
  keyword: string;
  url: string;
  searchEngine: 'google' | 'bing' | 'yahoo' | 'yandex';
  location: string;
  device: 'desktop' | 'mobile';
  currentRank: number;
  previousRank: number;
  bestRank: number;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: number[];
  lastUpdated: Date;
  competitors: { domain: string; rank: number }[];
}

export interface KeywordStats {
  totalKeywords: number;
  avgPosition: number;
  topMovers: { keyword: string; change: number }[];
  totalSearchVolume: number;
  opportunities: TrackedKeyword[];
}

@Injectable({
  providedIn: 'root',
})
export class KeywordTrackerService {
  private keywords = signal<TrackedKeyword[]>([]);

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('tracked_keywords');
      if (saved) {
        this.keywords.set(
          JSON.parse(saved).map((k: any) => ({
            ...k,
            lastUpdated: new Date(k.lastUpdated),
          })),
        );
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('tracked_keywords', JSON.stringify(this.keywords()));
  }

  private initializeMockData(): void {
    if (this.keywords().length === 0) {
      const mockKeywords: TrackedKeyword[] = [
        {
          id: '1',
          keyword: 'best SEO tools 2024',
          url: 'https://yoursite.com/seo-tools',
          searchEngine: 'google',
          location: 'United States',
          device: 'desktop',
          currentRank: 5,
          previousRank: 12,
          bestRank: 3,
          searchVolume: 12500,
          difficulty: 65,
          cpc: 8.5,
          trend: [45, 38, 25, 18, 15, 12, 8, 5],
          lastUpdated: new Date(),
          competitors: [
            { domain: 'semrush.com', rank: 1 },
            { domain: 'moz.com', rank: 2 },
            { domain: 'ahrefs.com', rank: 3 },
          ],
        },
        {
          id: '2',
          keyword: 'digital marketing guide',
          url: 'https://yoursite.com/marketing-guide',
          searchEngine: 'google',
          location: 'United States',
          device: 'desktop',
          currentRank: 8,
          previousRank: 6,
          bestRank: 4,
          searchVolume: 8200,
          difficulty: 58,
          cpc: 6.2,
          trend: [15, 14, 12, 11, 10, 9, 9, 8],
          lastUpdated: new Date(),
          competitors: [
            { domain: 'hubspot.com', rank: 1 },
            { domain: 'marketing.hubspot.com', rank: 2 },
          ],
        },
        {
          id: '3',
          keyword: 'content marketing strategies',
          url: 'https://yoursite.com/content-strategies',
          searchEngine: 'google',
          location: 'United Kingdom',
          device: 'mobile',
          currentRank: 15,
          previousRank: 22,
          bestRank: 12,
          searchVolume: 5600,
          difficulty: 52,
          cpc: 5.8,
          trend: [35, 32, 28, 25, 22, 20, 18, 15],
          lastUpdated: new Date(),
          competitors: [],
        },
        {
          id: '4',
          keyword: 'social media management',
          url: 'https://yoursite.com/social-media',
          searchEngine: 'google',
          location: 'United States',
          device: 'desktop',
          currentRank: 3,
          previousRank: 5,
          bestRank: 2,
          searchVolume: 15000,
          difficulty: 72,
          cpc: 9.2,
          trend: [12, 10, 8, 7, 6, 5, 4, 3],
          lastUpdated: new Date(),
          competitors: [
            { domain: 'hootsuite.com', rank: 1 },
            { domain: 'buffer.com', rank: 2 },
          ],
        },
        {
          id: '5',
          keyword: 'email marketing tips',
          url: 'https://yoursite.com/email-marketing',
          searchEngine: 'bing',
          location: 'United States',
          device: 'desktop',
          currentRank: 12,
          previousRank: 15,
          bestRank: 8,
          searchVolume: 4200,
          difficulty: 45,
          cpc: 4.5,
          trend: [25, 23, 20, 18, 16, 14, 13, 12],
          lastUpdated: new Date(),
          competitors: [],
        },
        {
          id: '6',
          keyword: 'website optimization techniques',
          url: 'https://yoursite.com/optimization',
          searchEngine: 'google',
          location: 'Canada',
          device: 'mobile',
          currentRank: 25,
          previousRank: 30,
          bestRank: 20,
          searchVolume: 3200,
          difficulty: 48,
          cpc: 5.0,
          trend: [45, 42, 38, 35, 32, 29, 27, 25],
          lastUpdated: new Date(),
          competitors: [],
        },
        {
          id: '7',
          keyword: 'SEO for small business',
          url: 'https://yoursite.com/small-business-seo',
          searchEngine: 'google',
          location: 'United States',
          device: 'desktop',
          currentRank: 7,
          previousRank: 18,
          bestRank: 5,
          searchVolume: 9800,
          difficulty: 55,
          cpc: 7.2,
          trend: [55, 48, 35, 25, 18, 14, 10, 7],
          lastUpdated: new Date(),
          competitors: [{ domain: ' Forbes.com', rank: 1 }],
        },
        {
          id: '8',
          keyword: 'link building strategies',
          url: 'https://yoursite.com/link-building',
          searchEngine: 'google',
          location: 'United States',
          device: 'desktop',
          currentRank: 18,
          previousRank: 25,
          bestRank: 15,
          searchVolume: 6800,
          difficulty: 62,
          cpc: 8.0,
          trend: [42, 38, 32, 28, 24, 21, 19, 18],
          lastUpdated: new Date(),
          competitors: [],
        },
      ];
      this.keywords.set(mockKeywords);
      this.saveData();
    }
  }

  getKeywords(): TrackedKeyword[] {
    return this.keywords();
  }

  getStats(): KeywordStats {
    const keywords = this.keywords();
    const topMovers = keywords
      .map((k) => ({
        keyword: k.keyword,
        change: k.previousRank - k.currentRank,
      }))
      .filter((k) => Math.abs(k.change) >= 3)
      .sort((a, b) => b.change - a.change)
      .slice(0, 5);

    const opportunities = keywords
      .filter((k) => k.currentRank <= 20 && k.difficulty < 60)
      .sort((a, b) => b.searchVolume - a.searchVolume);

    return {
      totalKeywords: keywords.length,
      avgPosition:
        keywords.length > 0
          ? Math.round(keywords.reduce((sum, k) => sum + k.currentRank, 0) / keywords.length)
          : 0,
      topMovers,
      totalSearchVolume: keywords.reduce((sum, k) => sum + k.searchVolume, 0),
      opportunities,
    };
  }

  addKeyword(
    keyword: Omit<TrackedKeyword, 'id' | 'lastUpdated' | 'trend' | 'bestRank'>,
  ): TrackedKeyword {
    const existing = this.keywords().find(
      (k) => k.keyword.toLowerCase() === keyword.keyword.toLowerCase(),
    );
    if (existing) {
      return existing;
    }

    const newKeyword: TrackedKeyword = {
      ...keyword,
      id: 'kw_' + Date.now(),
      bestRank: keyword.currentRank,
      trend: [keyword.currentRank],
      lastUpdated: new Date(),
    };
    this.keywords.update((keywords) => [...keywords, newKeyword]);
    this.saveData();
    return newKeyword;
  }

  updateKeywordRank(id: string, newRank: number): void {
    this.keywords.update((keywords) =>
      keywords.map((k) => {
        if (k.id === id) {
          const trend = [...k.trend, newRank].slice(-12);
          return {
            ...k,
            previousRank: k.currentRank,
            currentRank: newRank,
            bestRank: Math.min(k.bestRank, newRank),
            trend,
            lastUpdated: new Date(),
          };
        }
        return k;
      }),
    );
    this.saveData();
  }

  deleteKeyword(id: string): void {
    this.keywords.update((keywords) => keywords.filter((k) => k.id !== id));
    this.saveData();
  }

  refreshRankings(): void {
    this.keywords.update((keywords) =>
      keywords.map((k) => {
        const change = Math.floor(Math.random() * 5) - 2;
        const newRank = Math.max(1, Math.min(100, k.currentRank + change));
        const trend = [...k.trend, newRank].slice(-12);
        return {
          ...k,
          previousRank: k.currentRank,
          currentRank: newRank,
          bestRank: Math.min(k.bestRank, newRank),
          trend,
          lastUpdated: new Date(),
        };
      }),
    );
    this.saveData();
  }

  getPositionChanges(): { improved: number; declined: number; unchanged: number } {
    const keywords = this.keywords();
    return {
      improved: keywords.filter((k) => k.currentRank < k.previousRank).length,
      declined: keywords.filter((k) => k.currentRank > k.previousRank).length,
      unchanged: keywords.filter((k) => k.currentRank === k.previousRank).length,
    };
  }
}
