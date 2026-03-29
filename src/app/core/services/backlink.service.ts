import { Injectable, signal } from '@angular/core';

export interface Backlink {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  domain: string;
  pageAuthority: number;
  domainAuthority: number;
  type: 'dofollow' | 'nofollow' | 'sponsored' | 'ugc';
  status: 'active' | 'lost' | 'broken' | 'new';
  firstSeen: Date;
  lastChecked: Date;
  spamScore: number;
  traffic: number;
  relatedKeywords: string[];
}

export interface BacklinkStats {
  totalBacklinks: number;
  dofollow: number;
  nofollow: number;
  newThisWeek: number;
  lostThisWeek: number;
  avgDomainAuthority: number;
  topDomains: { domain: string; count: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class BacklinkService {
  private backlinks = signal<Backlink[]>([]);

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('backlinks');
      if (saved) {
        this.backlinks.set(
          JSON.parse(saved).map((b: any) => ({
            ...b,
            firstSeen: new Date(b.firstSeen),
            lastChecked: new Date(b.lastChecked),
          })),
        );
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('backlinks', JSON.stringify(this.backlinks()));
  }

  private initializeMockData(): void {
    if (this.backlinks().length === 0) {
      const mockBacklinks: Backlink[] = [
        {
          id: '1',
          sourceUrl: 'https://blog.hubspot.com/marketing/seo-tips',
          targetUrl: 'https://yoursite.com/seo-guide',
          anchorText: 'complete SEO guide',
          domain: 'hubspot.com',
          pageAuthority: 92,
          domainAuthority: 95,
          type: 'dofollow',
          status: 'active',
          firstSeen: new Date('2024-01-15'),
          lastChecked: new Date(),
          spamScore: 2,
          traffic: 45000,
          relatedKeywords: ['SEO guide', ' SEO tips'],
        },
        {
          id: '2',
          sourceUrl: 'https://www Moz.com/blog/seo-strategies-2024',
          targetUrl: 'https://yoursite.com/marketing-tips',
          anchorText: 'digital marketing strategies',
          domain: 'moz.com',
          pageAuthority: 89,
          domainAuthority: 91,
          type: 'dofollow',
          status: 'active',
          firstSeen: new Date('2024-02-10'),
          lastChecked: new Date(),
          spamScore: 1,
          traffic: 32000,
          relatedKeywords: ['marketing strategies', 'digital marketing'],
        },
        {
          id: '3',
          sourceUrl: 'https://techcrunch.com/startups/growth-hacking',
          targetUrl: 'https://yoursite.com/startup-guide',
          anchorText: 'startup growth guide',
          domain: 'techcrunch.com',
          pageAuthority: 95,
          domainAuthority: 94,
          type: 'dofollow',
          status: 'active',
          firstSeen: new Date('2024-03-05'),
          lastChecked: new Date(),
          spamScore: 0,
          traffic: 120000,
          relatedKeywords: ['startup guide', 'growth hacking'],
        },
        {
          id: '4',
          sourceUrl: 'https://www.forbes.com/entrepreneurs/business-tips',
          targetUrl: 'https://yoursite.com/business-growth',
          anchorText: 'business growth strategies',
          domain: 'forbes.com',
          pageAuthority: 94,
          domainAuthority: 96,
          type: 'dofollow',
          status: 'new',
          firstSeen: new Date('2024-06-20'),
          lastChecked: new Date(),
          spamScore: 0,
          traffic: 89000,
          relatedKeywords: ['business growth', 'entrepreneur tips'],
        },
        {
          id: '5',
          sourceUrl: 'https://medium.com/entrepreneurship/success',
          targetUrl: 'https://yoursite.com/success-tips',
          anchorText: 'success tips',
          domain: 'medium.com',
          pageAuthority: 85,
          domainAuthority: 93,
          type: 'nofollow',
          status: 'active',
          firstSeen: new Date('2024-04-12'),
          lastChecked: new Date(),
          spamScore: 3,
          traffic: 15000,
          relatedKeywords: ['success tips', 'entrepreneurship'],
        },
        {
          id: '6',
          sourceUrl: 'https://reddit.com/r/entrepreneur/posts/startup',
          targetUrl: 'https://yoursite.com/startup-advice',
          anchorText: 'startup advice',
          domain: 'reddit.com',
          pageAuthority: 88,
          domainAuthority: 92,
          type: 'ugc',
          status: 'active',
          firstSeen: new Date('2024-05-08'),
          lastChecked: new Date(),
          spamScore: 5,
          traffic: 28000,
          relatedKeywords: ['startup advice', 'small business'],
        },
        {
          id: '7',
          sourceUrl: 'https://www.quora.com/startup-success-tips',
          targetUrl: 'https://yoursite.com/startup-tips',
          anchorText: 'helpful resources',
          domain: 'quora.com',
          pageAuthority: 87,
          domainAuthority: 90,
          type: 'nofollow',
          status: 'lost',
          firstSeen: new Date('2024-01-20'),
          lastChecked: new Date(),
          spamScore: 2,
          traffic: 0,
          relatedKeywords: ['startup tips', 'business help'],
        },
        {
          id: '8',
          sourceUrl: 'https://www SEMrush.com/blog/seo-tools',
          targetUrl: 'https://yoursite.com/seo-tools',
          anchorText: 'SEO tools comparison',
          domain: 'semrush.com',
          pageAuthority: 90,
          domainAuthority: 89,
          type: 'dofollow',
          status: 'active',
          firstSeen: new Date('2024-03-15'),
          lastChecked: new Date(),
          spamScore: 1,
          traffic: 42000,
          relatedKeywords: ['SEO tools', 'digital marketing'],
        },
      ];
      this.backlinks.set(mockBacklinks);
      this.saveData();
    }
  }

  getBacklinks(): Backlink[] {
    return this.backlinks();
  }

  getBacklinksByStatus(status: Backlink['status']): Backlink[] {
    return this.backlinks().filter((b) => b.status === status);
  }

  getStats(): BacklinkStats {
    const links = this.backlinks();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const domainCounts: Record<string, number> = {};
    let totalDA = 0;

    links.forEach((link) => {
      domainCounts[link.domain] = (domainCounts[link.domain] || 0) + 1;
      totalDA += link.domainAuthority;
    });

    return {
      totalBacklinks: links.length,
      dofollow: links.filter((l) => l.type === 'dofollow').length,
      nofollow: links.filter((l) => l.type === 'nofollow').length,
      newThisWeek: links.filter((l) => l.firstSeen >= oneWeekAgo && l.status === 'new').length,
      lostThisWeek: links.filter((l) => l.status === 'lost').length,
      avgDomainAuthority: links.length > 0 ? Math.round(totalDA / links.length) : 0,
      topDomains: Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([domain, count]) => ({ domain, count })),
    };
  }

  addBacklink(backlink: Omit<Backlink, 'id' | 'firstSeen' | 'lastChecked'>): Backlink {
    const newBacklink: Backlink = {
      ...backlink,
      id: 'bl_' + Date.now(),
      firstSeen: new Date(),
      lastChecked: new Date(),
    };
    this.backlinks.update((links) => [...links, newBacklink]);
    this.saveData();
    return newBacklink;
  }

  updateBacklinkStatus(id: string, status: Backlink['status']): void {
    this.backlinks.update((links) =>
      links.map((l) => (l.id === id ? { ...l, status, lastChecked: new Date() } : l)),
    );
    this.saveData();
  }

  deleteBacklink(id: string): void {
    this.backlinks.update((links) => links.filter((l) => l.id !== id));
    this.saveData();
  }

  checkBacklinks(): void {
    this.backlinks.update((links) =>
      links.map((l) => ({
        ...l,
        lastChecked: new Date(),
        status: Math.random() > 0.1 ? 'active' : 'lost',
      })),
    );
    this.saveData();
  }

  getBacklinkOpportunities(): { domain: string; da: number; reason: string }[] {
    return [
      { domain: 'wikipedia.org', da: 98, reason: 'High authority, allows external links' },
      { domain: 'github.com', da: 96, reason: 'Developer community, relevant for tech topics' },
      { domain: 'stackoverflow.com', da: 94, reason: 'Q&A platform, high engagement' },
      { domain: 'linkedin.com', da: 95, reason: 'Professional networking, B2B opportunities' },
      { domain: 'twitter.com', da: 93, reason: 'Social signals, brand mentions' },
    ];
  }
}
