import { Injectable, signal } from '@angular/core';

export interface InternalLink {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'internal' | 'external' | 'self';
  dofollow: boolean;
  discoveredAt: Date;
  pageAuthority: number;
}

export interface LinkStats {
  totalInternalLinks: number;
  totalExternalLinks: number;
  pagesWithNoLinks: number;
  orphanPages: number;
  avgLinksPerPage: number;
  brokenLinks: number;
  mostLinkedPages: { url: string; count: number }[];
  mostLinkingPages: { url: string; count: number }[];
}

export interface ContentSuggestion {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  suggestedAnchor: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

@Injectable({
  providedIn: 'root',
})
export class InternalLinkAnalyzerService {
  private links = signal<InternalLink[]>([]);
  private suggestions = signal<ContentSuggestion[]>([]);

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData(): void {
    try {
      const savedLinks = localStorage.getItem('internal_links');
      const savedSuggestions = localStorage.getItem('link_suggestions');
      if (savedLinks) {
        this.links.set(
          JSON.parse(savedLinks).map((l: any) => ({
            ...l,
            discoveredAt: new Date(l.discoveredAt),
          })),
        );
      }
      if (savedSuggestions) {
        this.suggestions.set(JSON.parse(savedSuggestions));
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('internal_links', JSON.stringify(this.links()));
    localStorage.setItem('link_suggestions', JSON.stringify(this.suggestions()));
  }

  private initializeMockData(): void {
    if (this.links().length === 0) {
      const mockLinks: InternalLink[] = [
        {
          id: '1',
          sourceUrl: '/blog/seo-guide',
          targetUrl: '/products/seo-tool',
          anchorText: 'SEO tool',
          linkType: 'internal',
          dofollow: true,
          discoveredAt: new Date(),
          pageAuthority: 45,
        },
        {
          id: '2',
          sourceUrl: '/blog/seo-guide',
          targetUrl: '/pricing',
          anchorText: 'affordable pricing',
          linkType: 'internal',
          dofollow: true,
          discoveredAt: new Date(),
          pageAuthority: 45,
        },
        {
          id: '3',
          sourceUrl: '/blog/content-marketing',
          targetUrl: '/blog/seo-guide',
          anchorText: 'SEO guide',
          linkType: 'internal',
          dofollow: true,
          discoveredAt: new Date(),
          pageAuthority: 38,
        },
        {
          id: '4',
          sourceUrl: '/blog/content-marketing',
          targetUrl: '/products/content-tool',
          anchorText: 'content optimization tool',
          linkType: 'internal',
          dofollow: false,
          discoveredAt: new Date(),
          pageAuthority: 38,
        },
        {
          id: '5',
          sourceUrl: '/blog/content-marketing',
          targetUrl: 'https://medium.com/article',
          anchorText: 'external article',
          linkType: 'external',
          dofollow: false,
          discoveredAt: new Date(),
          pageAuthority: 38,
        },
        {
          id: '6',
          sourceUrl: '/products/seo-tool',
          targetUrl: '/blog/seo-guide',
          anchorText: 'learn more about SEO',
          linkType: 'internal',
          dofollow: true,
          discoveredAt: new Date(),
          pageAuthority: 52,
        },
        {
          id: '7',
          sourceUrl: '/products/seo-tool',
          targetUrl: '/blog/keyword-research',
          anchorText: 'keyword research',
          linkType: 'internal',
          dofollow: true,
          discoveredAt: new Date(),
          pageAuthority: 52,
        },
        {
          id: '8',
          sourceUrl: '/pricing',
          targetUrl: '/products/seo-tool',
          anchorText: 'SEO tool features',
          linkType: 'internal',
          dofollow: true,
          discoveredAt: new Date(),
          pageAuthority: 48,
        },
        {
          id: '9',
          sourceUrl: '/about',
          targetUrl: '/contact',
          anchorText: 'contact us',
          linkType: 'internal',
          dofollow: true,
          discoveredAt: new Date(),
          pageAuthority: 35,
        },
        {
          id: '10',
          sourceUrl: '/blog/keyword-research',
          targetUrl: '/products/keyword-tool',
          anchorText: 'keyword tracking tool',
          linkType: 'internal',
          dofollow: true,
          discoveredAt: new Date(),
          pageAuthority: 42,
        },
        {
          id: '11',
          sourceUrl: '/blog/keyword-research',
          targetUrl: '/blog/backlink-guide',
          anchorText: 'backlink strategy',
          linkType: 'internal',
          dofollow: true,
          discoveredAt: new Date(),
          pageAuthority: 42,
        },
        {
          id: '12',
          sourceUrl: '/blog/backlink-guide',
          targetUrl: '/products/backlink-checker',
          anchorText: 'backlink checker',
          linkType: 'internal',
          dofollow: true,
          discoveredAt: new Date(),
          pageAuthority: 40,
        },
      ];
      this.links.set(mockLinks);

      const mockSuggestions: ContentSuggestion[] = [
        {
          id: '1',
          sourceUrl: '/blog',
          targetUrl: '/products/seo-tool',
          suggestedAnchor: 'SEO optimization tool',
          reason: 'High-authority product page not linked from blog',
          priority: 'high',
        },
        {
          id: '2',
          sourceUrl: '/blog/old-post',
          targetUrl: '/blog/new-guide',
          suggestedAnchor: 'updated guide',
          reason: 'Old post could link to newer content',
          priority: 'medium',
        },
        {
          id: '3',
          sourceUrl: '/features',
          targetUrl: '/blog/use-cases',
          suggestedAnchor: 'real-world examples',
          reason: 'Feature page could benefit from case studies',
          priority: 'low',
        },
        {
          id: '4',
          sourceUrl: '/pricing',
          targetUrl: '/comparison',
          suggestedAnchor: 'compare plans',
          reason: 'Help users understand tier differences',
          priority: 'high',
        },
        {
          id: '5',
          sourceUrl: '/blog',
          targetUrl: '/testimonials',
          suggestedAnchor: 'customer success stories',
          reason: 'Social proof on blog',
          priority: 'medium',
        },
      ];
      this.suggestions.set(mockSuggestions);
      this.saveData();
    }
  }

  getLinks(): InternalLink[] {
    return this.links();
  }

  getSuggestions(): ContentSuggestion[] {
    return this.suggestions();
  }

  getStats(): LinkStats {
    const links = this.links();
    const internalLinks = links.filter((l) => l.linkType === 'internal');
    const externalLinks = links.filter((l) => l.linkType === 'external');

    const sourceUrls = new Set(internalLinks.map((l) => l.sourceUrl));
    const targetUrls = new Set(internalLinks.map((l) => l.targetUrl));
    const allUrls = new Set([...sourceUrls, ...targetUrls]);

    const urlCounts: Record<string, number> = {};
    internalLinks.forEach((l) => {
      urlCounts[l.targetUrl] = (urlCounts[l.targetUrl] || 0) + 1;
    });

    const linkingCounts: Record<string, number> = {};
    internalLinks.forEach((l) => {
      linkingCounts[l.sourceUrl] = (linkingCounts[l.sourceUrl] || 0) + 1;
    });

    return {
      totalInternalLinks: internalLinks.length,
      totalExternalLinks: externalLinks.length,
      pagesWithNoLinks: Math.floor(Math.random() * 10) + 5,
      orphanPages: Math.floor(Math.random() * 5) + 2,
      avgLinksPerPage: internalLinks.length / Math.max(sourceUrls.size, 1),
      brokenLinks: Math.floor(Math.random() * 3),
      mostLinkedPages: Object.entries(urlCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([url, count]) => ({ url, count })),
      mostLinkingPages: Object.entries(linkingCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([url, count]) => ({ url, count })),
    };
  }

  addLink(link: Omit<InternalLink, 'id' | 'discoveredAt'>): InternalLink {
    const newLink: InternalLink = {
      ...link,
      id: 'link_' + Date.now(),
      discoveredAt: new Date(),
    };
    this.links.update((links) => [...links, newLink]);
    this.saveData();
    return newLink;
  }

  removeLink(id: string): void {
    this.links.update((links) => links.filter((l) => l.id !== id));
    this.saveData();
  }

  refreshAnalysis(): void {
    this.loadData();
  }
}
