import { Injectable, signal } from '@angular/core';

export interface ContentGap {
  id: string;
  topic: string;
  competitorRanks: { competitor: string; rank: number }[];
  yourRank?: number;
  searchVolume: number;
  difficulty: number;
  priority: 'high' | 'medium' | 'low';
  contentType: 'blog' | 'guide' | 'video' | 'infographic' | 'comparison';
  suggestedAngle: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface GapStats {
  totalGaps: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  totalSearchVolume: number;
  contentInProgress: number;
  contentCompleted: number;
}

@Injectable({
  providedIn: 'root',
})
export class ContentGapService {
  private gaps = signal<ContentGap[]>([]);

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('content_gaps');
      if (saved) {
        this.gaps.set(JSON.parse(saved));
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('content_gaps', JSON.stringify(this.gaps()));
  }

  private initializeMockData(): void {
    if (this.gaps().length === 0) {
      const mockGaps: ContentGap[] = [
        {
          id: '1',
          topic: 'How to do SEO in 2026',
          competitorRanks: [
            { competitor: 'Moz', rank: 3 },
            { competitor: 'Ahrefs', rank: 5 },
          ],
          yourRank: 45,
          searchVolume: 15000,
          difficulty: 65,
          priority: 'high',
          contentType: 'guide',
          suggestedAngle: 'Focus on AI impact and E-E-A-T signals',
          status: 'not_started',
        },
        {
          id: '2',
          topic: 'Best backlink strategies',
          competitorRanks: [
            { competitor: 'Ahrefs', rank: 2 },
            { competitor: 'Semrush', rank: 4 },
          ],
          yourRank: 28,
          searchVolume: 12000,
          difficulty: 58,
          priority: 'high',
          contentType: 'blog',
          suggestedAngle: 'Modern link building with digital PR',
          status: 'in_progress',
        },
        {
          id: '3',
          topic: 'Local SEO checklist',
          competitorRanks: [
            { competitor: 'BrightLocal', rank: 1 },
            { competitor: 'Moz', rank: 6 },
          ],
          yourRank: 52,
          searchVolume: 8500,
          difficulty: 45,
          priority: 'medium',
          contentType: 'guide',
          suggestedAngle: 'Include Google Business Profile optimization',
          status: 'not_started',
        },
        {
          id: '4',
          topic: 'Technical SEO audit tools',
          competitorRanks: [
            { competitor: 'Screaming Frog', rank: 2 },
            { competitor: 'Semrush', rank: 5 },
          ],
          yourRank: 35,
          searchVolume: 6200,
          difficulty: 52,
          priority: 'medium',
          contentType: 'comparison',
          suggestedAngle: 'Compare free vs paid options',
          status: 'not_started',
        },
        {
          id: '5',
          topic: 'Content marketing ROI',
          competitorRanks: [
            { competitor: 'HubSpot', rank: 1 },
            { competitor: 'Content Marketing Institute', rank: 3 },
          ],
          searchVolume: 9800,
          difficulty: 55,
          priority: 'high',
          contentType: 'blog',
          suggestedAngle: 'Real case studies with metrics',
          status: 'not_started',
        },
        {
          id: '6',
          topic: 'Voice search optimization',
          competitorRanks: [
            { competitor: 'Search Engine Land', rank: 4 },
            { competitor: 'Backlinko', rank: 8 },
          ],
          yourRank: 67,
          searchVolume: 5200,
          difficulty: 48,
          priority: 'low',
          contentType: 'blog',
          suggestedAngle: 'Focus on conversational AI content',
          status: 'not_started',
        },
        {
          id: '7',
          topic: 'Mobile SEO best practices',
          competitorRanks: [
            { competitor: 'Google', rank: 1 },
            { competitor: 'Moz', rank: 7 },
          ],
          yourRank: 22,
          searchVolume: 11000,
          difficulty: 60,
          priority: 'high',
          contentType: 'guide',
          suggestedAngle: 'Core Web Vitals focus',
          status: 'completed',
        },
        {
          id: '8',
          topic: 'Keyword research for e-commerce',
          competitorRanks: [
            { competitor: 'Shopify', rank: 2 },
            { competitor: 'BigCommerce', rank: 5 },
          ],
          searchVolume: 7800,
          difficulty: 50,
          priority: 'medium',
          contentType: 'blog',
          suggestedAngle: 'Product-specific keyword strategies',
          status: 'not_started',
        },
        {
          id: '9',
          topic: 'Video SEO tutorial',
          competitorRanks: [
            { competitor: 'YouTube', rank: 1 },
            { competitor: 'Backlinko', rank: 12 },
          ],
          yourRank: 89,
          searchVolume: 4500,
          difficulty: 40,
          priority: 'low',
          contentType: 'video',
          suggestedAngle: 'Step-by-step for beginners',
          status: 'not_started',
        },
        {
          id: '10',
          topic: 'SEO for startups guide',
          competitorRanks: [
            { competitor: 'Y Combinator', rank: 3 },
            { competitor: 'Forbes', rank: 8 },
          ],
          searchVolume: 3200,
          difficulty: 35,
          priority: 'medium',
          contentType: 'guide',
          suggestedAngle: 'Budget-friendly SEO tactics',
          status: 'in_progress',
        },
      ];
      this.gaps.set(mockGaps);
      this.saveData();
    }
  }

  getGaps(): ContentGap[] {
    return this.gaps();
  }

  getStats(): GapStats {
    const gaps = this.gaps();
    return {
      totalGaps: gaps.length,
      highPriority: gaps.filter((g) => g.priority === 'high').length,
      mediumPriority: gaps.filter((g) => g.priority === 'medium').length,
      lowPriority: gaps.filter((g) => g.priority === 'low').length,
      totalSearchVolume: gaps.reduce((sum, g) => sum + g.searchVolume, 0),
      contentInProgress: gaps.filter((g) => g.status === 'in_progress').length,
      contentCompleted: gaps.filter((g) => g.status === 'completed').length,
    };
  }

  getHighPriorityGaps(): ContentGap[] {
    return this.gaps().filter((g) => g.priority === 'high' && g.status === 'not_started');
  }

  addGap(gap: Omit<ContentGap, 'id'>): ContentGap {
    const newGap: ContentGap = {
      ...gap,
      id: 'gap_' + Date.now(),
    };
    this.gaps.update((gaps) => [...gaps, newGap]);
    this.saveData();
    return newGap;
  }

  updateGapStatus(id: string, status: ContentGap['status']): void {
    this.gaps.update((gaps) => gaps.map((g) => (g.id === id ? { ...g, status } : g)));
    this.saveData();
  }

  deleteGap(id: string): void {
    this.gaps.update((gaps) => gaps.filter((g) => g.id !== id));
    this.saveData();
  }
}
