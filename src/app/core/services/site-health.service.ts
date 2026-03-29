import { Injectable, signal } from '@angular/core';

export interface SiteHealthIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'performance' | 'accessibility' | 'best-practices' | 'seo' | 'security';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  affectedUrls: string[];
  recommendation: string;
  status: 'open' | 'fixed' | 'ignored';
  detectedAt: Date;
  fixedAt?: Date;
}

export interface SiteHealthReport {
  overallScore: number;
  performance: { score: number; fcp: number; lcp: number; cls: number; ttfb: number };
  accessibility: { score: number; issues: number };
  bestPractices: { score: number; issues: number };
  seo: { score: number; issues: number };
  security: { score: number; issues: number };
}

@Injectable({
  providedIn: 'root',
})
export class SiteHealthService {
  private issues = signal<SiteHealthIssue[]>([]);

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('site_health_issues');
      if (saved) {
        this.issues.set(
          JSON.parse(saved).map((i: any) => ({
            ...i,
            detectedAt: new Date(i.detectedAt),
            fixedAt: i.fixedAt ? new Date(i.fixedAt) : undefined,
          })),
        );
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('site_health_issues', JSON.stringify(this.issues()));
  }

  private initializeMockData(): void {
    if (this.issues().length === 0) {
      const mockIssues: SiteHealthIssue[] = [
        {
          id: '1',
          type: 'critical',
          category: 'performance',
          title: 'Large Contentful Paint (LCP) is slow',
          description:
            'Your LCP is taking longer than 2.5s, which is above the recommended threshold.',
          impact: 'high',
          affectedUrls: ['/', '/blog/', '/products/'],
          recommendation: 'Optimize images, use CDN, minify CSS/JS, implement lazy loading.',
          status: 'open',
          detectedAt: new Date(),
        },
        {
          id: '2',
          type: 'warning',
          category: 'performance',
          title: 'Render-blocking resources',
          description: 'Several CSS and JS files are blocking the initial render.',
          impact: 'medium',
          affectedUrls: ['/', '/blog/'],
          recommendation:
            'Inline critical CSS, defer non-critical JS, use async for third-party scripts.',
          status: 'open',
          detectedAt: new Date(),
        },
        {
          id: '3',
          type: 'warning',
          category: 'performance',
          title: 'Unused JavaScript',
          description: 'Your pages include unused JavaScript that slows down loading.',
          impact: 'medium',
          affectedUrls: ['/', '/blog/', '/contact/'],
          recommendation: 'Remove unused code, split bundles, tree-shake dependencies.',
          status: 'open',
          detectedAt: new Date(),
        },
        {
          id: '4',
          type: 'info',
          category: 'seo',
          title: 'Missing meta descriptions',
          description: 'Some pages are missing meta descriptions which affect click-through rates.',
          impact: 'medium',
          affectedUrls: ['/blog/post-1', '/blog/post-5', '/category/tech/'],
          recommendation:
            'Add unique, compelling meta descriptions (150-160 characters) to all pages.',
          status: 'open',
          detectedAt: new Date(),
        },
        {
          id: '5',
          type: 'warning',
          category: 'seo',
          title: 'Duplicate meta descriptions',
          description: 'Multiple pages have the same meta description, reducing SEO effectiveness.',
          impact: 'low',
          affectedUrls: ['/products/', '/category/products/'],
          recommendation: 'Create unique meta descriptions for each page.',
          status: 'open',
          detectedAt: new Date(),
        },
        {
          id: '6',
          type: 'critical',
          category: 'security',
          title: 'Missing HTTPS',
          description: 'Some resources are being loaded over HTTP instead of HTTPS.',
          impact: 'high',
          affectedUrls: ['/blog/post-3'],
          recommendation: 'Update all resource URLs to use HTTPS or remove mixed content.',
          status: 'fixed',
          detectedAt: new Date('2024-06-01'),
          fixedAt: new Date('2024-06-05'),
        },
        {
          id: '7',
          type: 'info',
          category: 'accessibility',
          title: 'Missing alt text on images',
          description: 'Several images are missing alt attributes which affects accessibility.',
          impact: 'medium',
          affectedUrls: ['/blog/post-2', '/about/'],
          recommendation: 'Add descriptive alt text to all images.',
          status: 'open',
          detectedAt: new Date(),
        },
        {
          id: '8',
          type: 'warning',
          category: 'best-practices',
          title: 'Old JavaScript libraries',
          description: 'Some third-party libraries are outdated and may have vulnerabilities.',
          impact: 'medium',
          affectedUrls: ['/'],
          recommendation: 'Update jQuery to latest version, remove unused dependencies.',
          status: 'open',
          detectedAt: new Date(),
        },
        {
          id: '9',
          type: 'info',
          category: 'seo',
          title: 'Missing structured data',
          description: 'Your pages would benefit from structured data markup for rich snippets.',
          impact: 'low',
          affectedUrls: ['/blog/', '/products/'],
          recommendation: 'Add JSON-LD schema markup for articles, products, and organization.',
          status: 'open',
          detectedAt: new Date(),
        },
        {
          id: '10',
          type: 'warning',
          category: 'performance',
          title: 'Image optimization needed',
          description: 'Some images are not optimized and are slowing down page load.',
          impact: 'medium',
          affectedUrls: ['/blog/post-1', '/about/', '/portfolio/'],
          recommendation: 'Compress images, use WebP format, implement responsive images.',
          status: 'open',
          detectedAt: new Date(),
        },
        {
          id: '11',
          type: 'critical',
          category: 'security',
          title: 'Exposed .git directory',
          description: 'Your .git folder is publicly accessible, which is a security risk.',
          impact: 'high',
          affectedUrls: ['/.git/'],
          recommendation: 'Block access to .git folder in your server configuration.',
          status: 'fixed',
          detectedAt: new Date('2024-05-15'),
          fixedAt: new Date('2024-05-16'),
        },
        {
          id: '12',
          type: 'info',
          category: 'seo',
          title: 'XML sitemap needs update',
          description: 'Your sitemap may not include all important pages.',
          impact: 'low',
          affectedUrls: ['/sitemap.xml'],
          recommendation: 'Ensure all canonical pages are included in the sitemap.',
          status: 'open',
          detectedAt: new Date(),
        },
      ];
      this.issues.set(mockIssues);
      this.saveData();
    }
  }

  getIssues(): SiteHealthIssue[] {
    return this.issues();
  }

  getIssuesByCategory(category: SiteHealthIssue['category']): SiteHealthIssue[] {
    return this.issues().filter((i) => i.category === category);
  }

  getOpenIssues(): SiteHealthIssue[] {
    return this.issues().filter((i) => i.status === 'open');
  }

  getReport(): SiteHealthReport {
    const issues = this.issues();
    const open = issues.filter((i) => i.status === 'open');

    const perfIssues = open.filter((i) => i.category === 'performance').length;
    const accessIssues = open.filter((i) => i.category === 'accessibility').length;
    const bpIssues = open.filter((i) => i.category === 'best-practices').length;
    const seoIssues = open.filter((i) => i.category === 'seo').length;
    const secIssues = open.filter((i) => i.category === 'security').length;

    const performance = Math.max(0, 100 - perfIssues * 15);
    const accessibility = Math.max(0, 100 - accessIssues * 20);
    const bestPractices = Math.max(0, 100 - bpIssues * 25);
    const seo = Math.max(0, 100 - seoIssues * 10);
    const security = Math.max(0, 100 - secIssues * 25);

    const overallScore = Math.round(
      (performance + accessibility + bestPractices + seo + security) / 5,
    );

    return {
      overallScore,
      performance: {
        score: performance,
        fcp: 1.8 + Math.random() * 0.5,
        lcp: 2.5 + Math.random() * 1.0,
        cls: Math.random() * 0.1,
        ttfb: 200 + Math.random() * 100,
      },
      accessibility: { score: accessibility, issues: accessIssues },
      bestPractices: { score: bestPractices, issues: bpIssues },
      seo: { score: seo, issues: seoIssues },
      security: { score: security, issues: secIssues },
    };
  }

  fixIssue(id: string): void {
    this.issues.update((issues) =>
      issues.map((i) =>
        i.id === id ? { ...i, status: 'fixed' as const, fixedAt: new Date() } : i,
      ),
    );
    this.saveData();
  }

  ignoreIssue(id: string): void {
    this.issues.update((issues) =>
      issues.map((i) => (i.id === id ? { ...i, status: 'ignored' as const } : i)),
    );
    this.saveData();
  }

  reopenIssue(id: string): void {
    this.issues.update((issues) =>
      issues.map((i) => (i.id === id ? { ...i, status: 'open' as const, fixedAt: undefined } : i)),
    );
    this.saveData();
  }

  runHealthCheck(): SiteHealthReport {
    this.issues.update((issues) =>
      issues.map((i) => {
        if (i.status === 'fixed') {
          return { ...i, status: 'open' as const, fixedAt: undefined };
        }
        return i;
      }),
    );
    this.saveData();
    return this.getReport();
  }

  getRecommendations(): string[] {
    return [
      'Implement lazy loading for images below the fold',
      'Add a service worker for offline caching',
      'Enable Brotli or gzip compression',
      'Preconnect to critical third-party domains',
      'Add structured data for your main content types',
      'Set up proper caching headers',
      'Implement Core Web Vitals optimization',
    ];
  }
}
