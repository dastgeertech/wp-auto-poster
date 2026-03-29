import { Injectable, signal } from '@angular/core';

export interface Competitor {
  id: string;
  domain: string;
  name: string;
  logo?: string;
  traffic: number;
  trafficChange: number;
  keywords: number;
  domainAuthority: number;
  backlinks: number;
  topKeywords: { keyword: string; rank: number; traffic: number }[];
  topPages: { url: string; traffic: number; keywords: number }[];
  socialFollowers: {
    facebook: number;
    twitter: number;
    linkedin: number;
    instagram: number;
  };
  estimatedRevenue: string;
  adSpend: string;
  lastAnalyzed: Date;
}

export interface CompetitorAnalysis {
  totalCompetitors: number;
  avgTraffic: number;
  avgDA: number;
  sharedKeywords: number;
  contentGaps: { keyword: string; competitor: string; difficulty: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class CompetitorAnalyzerService {
  private competitors = signal<Competitor[]>([]);

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('competitors');
      if (saved) {
        this.competitors.set(
          JSON.parse(saved).map((c: any) => ({
            ...c,
            lastAnalyzed: new Date(c.lastAnalyzed),
          })),
        );
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('competitors', JSON.stringify(this.competitors()));
  }

  private initializeMockData(): void {
    if (this.competitors().length === 0) {
      const mockCompetitors: Competitor[] = [
        {
          id: '1',
          domain: 'hubspot.com',
          name: 'HubSpot',
          traffic: 4500000,
          trafficChange: 12.5,
          keywords: 125000,
          domainAuthority: 95,
          backlinks: 2500000,
          topKeywords: [
            { keyword: 'CRM software', rank: 1, traffic: 45000 },
            { keyword: 'marketing automation', rank: 2, traffic: 32000 },
            { keyword: 'sales software', rank: 1, traffic: 28000 },
          ],
          topPages: [
            { url: '/marketing/', traffic: 180000, keywords: 2500 },
            { url: '/pricing/', traffic: 150000, keywords: 1800 },
            { url: '/blog/', traffic: 120000, keywords: 5000 },
          ],
          socialFollowers: {
            facebook: 500000,
            twitter: 400000,
            linkedin: 300000,
            instagram: 200000,
          },
          estimatedRevenue: '$1B+',
          adSpend: 'High',
          lastAnalyzed: new Date(),
        },
        {
          id: '2',
          domain: 'semrush.com',
          name: 'SEMrush',
          traffic: 2800000,
          trafficChange: 8.2,
          keywords: 85000,
          domainAuthority: 91,
          backlinks: 1200000,
          topKeywords: [
            { keyword: 'SEO tools', rank: 1, traffic: 38000 },
            { keyword: 'keyword research', rank: 2, traffic: 25000 },
            { keyword: 'competitor analysis', rank: 1, traffic: 18000 },
          ],
          topPages: [
            { url: '/features/', traffic: 120000, keywords: 1500 },
            { url: '/pricing/', traffic: 95000, keywords: 1200 },
            { url: '/blog/', traffic: 85000, keywords: 3200 },
          ],
          socialFollowers: {
            facebook: 180000,
            twitter: 150000,
            linkedin: 100000,
            instagram: 50000,
          },
          estimatedRevenue: '$500M+',
          adSpend: 'Medium',
          lastAnalyzed: new Date(),
        },
        {
          id: '3',
          domain: 'moz.com',
          name: 'Moz',
          traffic: 1800000,
          trafficChange: 3.5,
          keywords: 65000,
          domainAuthority: 89,
          backlinks: 850000,
          topKeywords: [
            { keyword: 'SEO software', rank: 3, traffic: 22000 },
            { keyword: 'link building', rank: 2, traffic: 18000 },
            { keyword: 'domain authority', rank: 1, traffic: 15000 },
          ],
          topPages: [
            { url: '/products/', traffic: 80000, keywords: 1000 },
            { url: '/pricing/', traffic: 65000, keywords: 850 },
            { url: '/blog/', traffic: 55000, keywords: 2100 },
          ],
          socialFollowers: {
            facebook: 120000,
            twitter: 200000,
            linkedin: 80000,
            instagram: 35000,
          },
          estimatedRevenue: '$100M+',
          adSpend: 'Medium',
          lastAnalyzed: new Date(),
        },
        {
          id: '4',
          domain: 'ahrefs.com',
          name: 'Ahrefs',
          traffic: 2200000,
          trafficChange: 15.8,
          keywords: 72000,
          domainAuthority: 88,
          backlinks: 950000,
          topKeywords: [
            { keyword: 'backlink checker', rank: 1, traffic: 55000 },
            { keyword: 'SEO analysis', rank: 2, traffic: 28000 },
            { keyword: 'site audit', rank: 1, traffic: 22000 },
          ],
          topPages: [
            { url: '/site-explorer/', traffic: 100000, keywords: 1800 },
            { url: '/pricing/', traffic: 75000, keywords: 920 },
            { url: '/blog/', traffic: 60000, keywords: 2800 },
          ],
          socialFollowers: {
            facebook: 80000,
            twitter: 180000,
            linkedin: 60000,
            instagram: 45000,
          },
          estimatedRevenue: '$200M+',
          adSpend: 'High',
          lastAnalyzed: new Date(),
        },
      ];
      this.competitors.set(mockCompetitors);
      this.saveData();
    }
  }

  getCompetitors(): Competitor[] {
    return this.competitors();
  }

  getAnalysis(): CompetitorAnalysis {
    const competitors = this.competitors();
    const contentGaps: CompetitorAnalysis['contentGaps'] = [];

    competitors.forEach((comp) => {
      comp.topKeywords.forEach((kw) => {
        if (kw.rank <= 10) {
          contentGaps.push({
            keyword: kw.keyword,
            competitor: comp.name,
            difficulty: Math.floor(Math.random() * 40) + 30,
          });
        }
      });
    });

    return {
      totalCompetitors: competitors.length,
      avgTraffic: Math.floor(
        competitors.reduce((sum, c) => sum + c.traffic, 0) / competitors.length,
      ),
      avgDA: Math.round(
        competitors.reduce((sum, c) => sum + c.domainAuthority, 0) / competitors.length,
      ),
      sharedKeywords: Math.floor(
        (competitors.reduce((sum, c) => sum + c.keywords, 0) / competitors.length) * 0.3,
      ),
      contentGaps: contentGaps.slice(0, 10),
    };
  }

  addCompetitor(domain: string): Competitor {
    const newCompetitor: Competitor = {
      id: 'comp_' + Date.now(),
      domain,
      name: domain.replace('.com', '').replace('www.', ''),
      traffic: Math.floor(Math.random() * 1000000) + 100000,
      trafficChange: Math.random() * 20 - 10,
      keywords: Math.floor(Math.random() * 50000) + 10000,
      domainAuthority: Math.floor(Math.random() * 30) + 50,
      backlinks: Math.floor(Math.random() * 500000) + 50000,
      topKeywords: [],
      topPages: [],
      socialFollowers: {
        facebook: Math.floor(Math.random() * 100000),
        twitter: Math.floor(Math.random() * 100000),
        linkedin: Math.floor(Math.random() * 50000),
        instagram: Math.floor(Math.random() * 50000),
      },
      estimatedRevenue: 'Unknown',
      adSpend: 'Unknown',
      lastAnalyzed: new Date(),
    };
    this.competitors.update((competitors) => [...competitors, newCompetitor]);
    this.saveData();
    return newCompetitor;
  }

  analyzeCompetitor(id: string): void {
    this.competitors.update((competitors) =>
      competitors.map((c) =>
        c.id === id
          ? {
              ...c,
              traffic: Math.floor(c.traffic * (1 + (Math.random() * 0.2 - 0.1))),
              trafficChange: c.trafficChange + (Math.random() * 4 - 2),
              lastAnalyzed: new Date(),
            }
          : c,
      ),
    );
    this.saveData();
  }

  deleteCompetitor(id: string): void {
    this.competitors.update((competitors) => competitors.filter((c) => c.id !== id));
    this.saveData();
  }

  getTrafficComparison(): { yours: number; avg: number; leaders: number } {
    const competitors = this.competitors();
    const avg =
      competitors.length > 0
        ? competitors.reduce((sum, c) => sum + c.traffic, 0) / competitors.length
        : 0;
    const leaders = competitors.length > 0 ? Math.max(...competitors.map((c) => c.traffic)) : 0;

    return {
      yours: 250000,
      avg,
      leaders,
    };
  }
}
