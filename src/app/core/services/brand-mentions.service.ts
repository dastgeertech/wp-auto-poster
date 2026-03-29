import { Injectable, signal } from '@angular/core';

export interface BrandMention {
  id: string;
  source: string;
  url: string;
  brandName: string;
  context: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  linked: boolean;
  discoveredAt: Date;
  pageAuthority: number;
  traffic: number;
}

export interface MentionStats {
  totalMentions: number;
  linkedMentions: number;
  unlinkedMentions: number;
  positiveSentiment: number;
  negativeSentiment: number;
  topSources: { source: string; count: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class BrandMentionsService {
  private mentions = signal<BrandMention[]>([]);

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('brand_mentions');
      if (saved) {
        this.mentions.set(
          JSON.parse(saved).map((m: any) => ({
            ...m,
            discoveredAt: new Date(m.discoveredAt),
          })),
        );
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('brand_mentions', JSON.stringify(this.mentions()));
  }

  private initializeMockData(): void {
    if (this.mentions().length === 0) {
      const mockMentions: BrandMention[] = [
        {
          id: '1',
          source: 'Twitter',
          url: 'https://twitter.com/user1/status/123',
          brandName: 'YourBrand',
          context: 'Just started using @YourBrand for SEO - amazing results!',
          sentiment: 'positive',
          linked: true,
          discoveredAt: new Date(),
          pageAuthority: 75,
          traffic: 5000,
        },
        {
          id: '2',
          source: 'Reddit',
          url: 'https://reddit.com/r/marketing/comments/abc',
          brandName: 'YourBrand',
          context: 'Anyone tried YourBrand? Thinking about switching from Moz.',
          sentiment: 'neutral',
          linked: false,
          discoveredAt: new Date(),
          pageAuthority: 82,
          traffic: 15000,
        },
        {
          id: '3',
          source: 'Blog',
          url: 'https://marketingblog.com/seo-tools',
          brandName: 'YourBrand',
          context:
            'We compared top SEO tools including YourBrand and found it to be the most comprehensive.',
          sentiment: 'positive',
          linked: true,
          discoveredAt: new Date(),
          pageAuthority: 68,
          traffic: 8000,
        },
        {
          id: '4',
          source: 'News',
          url: 'https://technews.com/yourbrand-launch',
          brandName: 'YourBrand',
          context: 'YourBrand announces new AI-powered features for content optimization.',
          sentiment: 'positive',
          linked: false,
          discoveredAt: new Date(),
          pageAuthority: 88,
          traffic: 45000,
        },
        {
          id: '5',
          source: 'Forum',
          url: 'https://forum.example.com/seo-discussion',
          brandName: 'YourBrand',
          context: 'Not impressed with YourBrand pricing. Too expensive for small business.',
          sentiment: 'negative',
          linked: false,
          discoveredAt: new Date(),
          pageAuthority: 45,
          traffic: 2000,
        },
        {
          id: '6',
          source: 'YouTube',
          url: 'https://youtube.com/watch?v=abc',
          brandName: 'YourBrand',
          context: 'YourBrand tutorial - how to rank #1 on Google in 2024',
          sentiment: 'positive',
          linked: true,
          discoveredAt: new Date(),
          pageAuthority: 85,
          traffic: 25000,
        },
        {
          id: '7',
          source: 'LinkedIn',
          url: 'https://linkedin.com/posts/xyz',
          brandName: 'YourBrand',
          context: 'Proud to partner with YourBrand for our digital marketing needs!',
          sentiment: 'positive',
          linked: true,
          discoveredAt: new Date(),
          pageAuthority: 72,
          traffic: 5000,
        },
        {
          id: '8',
          source: 'Twitter',
          url: 'https://twitter.com/user2/status/456',
          brandName: 'YourBrand',
          context: 'Why does YourBrand keep having uptime issues? Third time this month.',
          sentiment: 'negative',
          linked: false,
          discoveredAt: new Date(),
          pageAuthority: 60,
          traffic: 3000,
        },
        {
          id: '9',
          source: 'Blog',
          url: 'https://seoblog.com/best-tools-2024',
          brandName: 'YourBrand',
          context: 'Best SEO tools of 2024: YourBrand, Ahrefs, SEMrush compared.',
          sentiment: 'positive',
          linked: true,
          discoveredAt: new Date(),
          pageAuthority: 70,
          traffic: 12000,
        },
        {
          id: '10',
          source: 'Facebook',
          url: 'https://facebook.com/group/seo',
          brandName: 'YourBrand',
          context: 'Does anyone have experience with YourBrand? Looking for reviews.',
          sentiment: 'neutral',
          linked: false,
          discoveredAt: new Date(),
          pageAuthority: 55,
          traffic: 1500,
        },
      ];
      this.mentions.set(mockMentions);
      this.saveData();
    }
  }

  getMentions(): BrandMention[] {
    return this.mentions();
  }

  getStats(): MentionStats {
    const mentions = this.mentions();
    const sourceCounts: Record<string, number> = {};

    mentions.forEach((m) => {
      sourceCounts[m.source] = (sourceCounts[m.source] || 0) + 1;
    });

    return {
      totalMentions: mentions.length,
      linkedMentions: mentions.filter((m) => m.linked).length,
      unlinkedMentions: mentions.filter((m) => !m.linked).length,
      positiveSentiment: mentions.filter((m) => m.sentiment === 'positive').length,
      negativeSentiment: mentions.filter((m) => m.sentiment === 'negative').length,
      topSources: Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([source, count]) => ({ source, count })),
    };
  }

  getUnlinkedMentions(): BrandMention[] {
    return this.mentions().filter((m) => !m.linked);
  }

  markAsLinked(id: string): void {
    this.mentions.update((mentions) =>
      mentions.map((m) => (m.id === id ? { ...m, linked: true } : m)),
    );
    this.saveData();
  }

  dismissMention(id: string): void {
    this.mentions.update((mentions) => mentions.filter((m) => m.id !== id));
    this.saveData();
  }

  addMention(mention: Omit<BrandMention, 'id' | 'discoveredAt'>): BrandMention {
    const newMention: BrandMention = {
      ...mention,
      id: 'mention_' + Date.now(),
      discoveredAt: new Date(),
    };
    this.mentions.update((mentions) => [...mentions, newMention]);
    this.saveData();
    return newMention;
  }
}
