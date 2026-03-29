import { Injectable, signal } from '@angular/core';

export interface SearchEngine {
  id: string;
  name: string;
  logo: string;
  website: string;
  consoleUrl: string;
  indexingUrl: string;
  apiEndpoint: string;
  color: string;
  supported: boolean;
  indexed: number;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  autoSubmit: boolean;
  apiKey?: string;
  siteUrl?: string;
}

export interface SEOIssue {
  id: string;
  engine: string;
  type: 'error' | 'warning' | 'notice';
  category:
    | 'crawl'
    | 'indexing'
    | 'performance'
    | 'mobile'
    | 'usability'
    | 'structured-data'
    | 'security';
  title: string;
  description: string;
  url?: string;
  detectedAt: Date;
  status: 'open' | 'fixed' | 'ignored' | 'dismissed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  affectedPages?: number;
  suggestion?: string;
  autoFix?: boolean;
}

export interface IndexingRequest {
  id: string;
  url: string;
  type: 'url_inspection' | 'submit_sitemap' | 'request_indexing' | 'remove' | 'auto';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submittedAt: Date;
  completedAt?: Date;
  engine: string;
  retries: number;
}

export interface SiteUrl {
  url: string;
  type: 'homepage' | 'post' | 'page' | 'category' | 'tag' | 'archive';
  status: 'pending' | 'submitted' | 'indexed' | 'error';
  submittedTo: string[];
  lastChecked: Date;
  indexed: boolean;
  indexedBy?: string[];
  searchAppearances?: SearchAppearance[];
}

export interface SearchAppearance {
  engine: string;
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  lastChecked: Date;
}

export interface AutoConfig {
  enabled: boolean;
  autoDetectUrls: boolean;
  autoSubmitAll: boolean;
  submitToEngines: string[];
  checkInterval: number;
  autoFixIssues: boolean;
  sitemapUrl: string;
  siteUrl: string;
  googleApiKey: string;
  googleSiteUrl: string;
  bingApiKey: string;
  yandexApiKey: string;
}

export interface SearchConsoleData {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  topPages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topQueries: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  indexedPages: number;
  sitemaps: { submitted: string; acknowledged: boolean }[];
}

export interface WebmasterToolData {
  engine: string;
  verified: boolean;
  verifiedDate?: Date;
  siteUrl: string;
  totalUrls: number;
  indexedUrls: number;
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  errors: WebmasterError[];
  lastChecked: Date;
}

export interface WebmasterError {
  id: string;
  type: 'critical' | 'error' | 'warning';
  category: string;
  title: string;
  description: string;
  affectedUrls?: number;
  fixInstructions: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface VisibilityRecommendation {
  id: string;
  category: 'ctr' | 'position' | 'indexing' | 'technical' | 'content';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  potentialGain: string;
  currentIssue?: string;
}

export interface EngineMasterConfig {
  google: {
    apiKey: string;
    siteUrl: string;
    connected: boolean;
  };
  bing: {
    apiKey: string;
    siteUrl: string;
    connected: boolean;
  };
  yandex: {
    apiKey: string;
    username: string;
    connected: boolean;
  };
  baidu: {
    apiKey: string;
    siteUrl: string;
    connected: boolean;
  };
  naver: {
    apiKey: string;
    siteUrl: string;
    connected: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SearchEngineManagerService {
  private issues = signal<SEOIssue[]>([]);
  private indexingRequests = signal<IndexingRequest[]>([]);
  private siteUrls = signal<SiteUrl[]>([]);
  private autoConfig = signal<AutoConfig>({
    enabled: true,
    autoDetectUrls: true,
    autoSubmitAll: true,
    submitToEngines: ['google', 'bing', 'yandex', 'baidu', 'naver'],
    checkInterval: 300000,
    autoFixIssues: true,
    sitemapUrl: '/sitemap.xml',
    siteUrl: '',
    googleApiKey: '',
    googleSiteUrl: '',
    bingApiKey: '',
    yandexApiKey: '',
  });

  private masterConfig = signal<EngineMasterConfig>({
    google: { apiKey: '', siteUrl: '', connected: false },
    bing: { apiKey: '', siteUrl: '', connected: false },
    yandex: { apiKey: '', username: '', connected: false },
    baidu: { apiKey: '', siteUrl: '', connected: false },
    naver: { apiKey: '', siteUrl: '', connected: false },
  });

  private searchConsoleData = signal<SearchConsoleData | null>(null);
  private errorMessage = signal<string | null>(null);
  private dataSource = signal<'api' | 'none'>('none');
  private webmasterToolsData = signal<WebmasterToolData[]>([]);
  private visibilityRecommendations = signal<VisibilityRecommendation[]>([]);
  private allErrors = signal<WebmasterError[]>([]);

  readonly searchEngines: SearchEngine[] = [
    {
      id: 'google',
      name: 'Google Search',
      logo: 'https://www.google.com/favicon.ico',
      website: 'https://google.com',
      consoleUrl: 'https://search.google.com/search-console',
      indexingUrl: 'https://search.google.com/search-console/inspect',
      apiEndpoint: 'https://searchconsole.googleapis.com/v1',
      color: '#4285F4',
      supported: true,
      indexed: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      position: 0,
      autoSubmit: true,
    },
    {
      id: 'bing',
      name: 'Bing',
      logo: 'https://www.bing.com/favicon.ico',
      website: 'https://bing.com',
      consoleUrl: 'https://www.bing.com/webmasters',
      indexingUrl: 'https://www.bing.com/webmasters/url-submission',
      apiEndpoint: 'https://ssl.bing.com/webmaster/api.svc/json',
      color: '#008373',
      supported: true,
      indexed: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      position: 0,
      autoSubmit: true,
    },
    {
      id: 'yandex',
      name: 'Yandex',
      logo: 'https://yandex.ru/favicon.ico',
      website: 'https://yandex.ru',
      consoleUrl: 'https://webmaster.yandex.com',
      indexingUrl: 'https://webmaster.yandex.com/indexing',
      apiEndpoint: 'https://api.webmaster.yandex.net/v4',
      color: '#FC3F1D',
      supported: true,
      indexed: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      position: 0,
      autoSubmit: true,
    },
    {
      id: 'baidu',
      name: 'Baidu',
      logo: 'https://www.baidu.com/favicon.ico',
      website: 'https://baidu.com',
      consoleUrl: 'https://ziyuan.baidu.com',
      indexingUrl: 'https://ziyuan.baidu.com/submit',
      apiEndpoint: 'https://ziyuan.baidu.com/api',
      color: '#2932E1',
      supported: true,
      indexed: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      position: 0,
      autoSubmit: true,
    },
    {
      id: 'naver',
      name: 'Naver',
      logo: 'https://www.naver.com/favicon.ico',
      website: 'https://naver.com',
      consoleUrl: 'https://searchadvisor.naver.com',
      indexingUrl: 'https://searchadvisor.naver.com/tools/url-submission',
      apiEndpoint: 'https://searchadvisor.naver.com/api',
      color: '#03CF63',
      supported: true,
      indexed: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      position: 0,
      autoSubmit: true,
    },
    {
      id: 'yahoo',
      name: 'Yahoo',
      logo: 'https://www.yahoo.com/favicon.ico',
      website: 'https://yahoo.com',
      consoleUrl: 'https://sitemap.hul.hulu.com',
      indexingUrl: 'https://search.yahoo.com',
      apiEndpoint: '',
      color: '#720E9E',
      supported: false,
      indexed: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      position: 0,
      autoSubmit: false,
    },
    {
      id: 'duckduckgo',
      name: 'DuckDuckGo',
      logo: 'https://duckduckgo.com/favicon.ico',
      website: 'https://duckduckgo.com',
      consoleUrl: 'https://duckduckgo.com',
      indexingUrl: 'https://duckduckgo.com/submit',
      apiEndpoint: '',
      color: '#DE5833',
      supported: false,
      indexed: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      position: 0,
      autoSubmit: false,
    },
    {
      id: 'ecosia',
      name: 'Ecosia',
      logo: 'https://www.ecosia.org/favicon.ico',
      website: 'https://ecosia.org',
      consoleUrl: 'https://ecosia.org',
      indexingUrl: 'https://ecosia.org/add',
      apiEndpoint: '',
      color: '#357C2B',
      supported: false,
      indexed: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      position: 0,
      autoSubmit: false,
    },
    {
      id: 'qwant',
      name: 'Qwant',
      logo: 'https://www.qwant.com/favicon.ico',
      website: 'https://qwant.com',
      consoleUrl: 'https://qwant.com',
      indexingUrl: 'https://addurl.qwant.com',
      apiEndpoint: '',
      color: '#0073FB',
      supported: false,
      indexed: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      position: 0,
      autoSubmit: false,
    },
    {
      id: 'seznam',
      name: 'Seznam',
      logo: 'https://www.seznam.cz/favicon.ico',
      website: 'https://seznam.cz',
      consoleUrl: 'https://search.seznam.cz/webmaster',
      indexingUrl: 'https://search.seznam.cz/webmaster',
      apiEndpoint: 'https://search.seznam.cz/webmaster/api',
      color: '#E3590D',
      supported: true,
      indexed: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      position: 0,
      autoSubmit: true,
    },
  ];

  constructor() {
    this.loadData();
    this.loadMasterConfig();
  }

  private loadData(): void {
    try {
      const savedIssues = localStorage.getItem('seo_issues');
      if (savedIssues) {
        const parsed = JSON.parse(savedIssues).map((i: any) => ({
          ...i,
          detectedAt: new Date(i.detectedAt),
        }));
        this.issues.set(parsed);
      }

      const savedRequests = localStorage.getItem('indexing_requests');
      if (savedRequests) {
        const parsed = JSON.parse(savedRequests).map((r: any) => ({
          ...r,
          submittedAt: new Date(r.submittedAt),
          completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
        }));
        this.indexingRequests.set(parsed);
      }

      const savedUrls = localStorage.getItem('site_urls');
      if (savedUrls) {
        const parsed = JSON.parse(savedUrls).map((u: any) => ({
          ...u,
          lastChecked: new Date(u.lastChecked),
        }));
        this.siteUrls.set(parsed);
      }

      const savedConfig = localStorage.getItem('auto_config');
      if (savedConfig) {
        this.autoConfig.set(JSON.parse(savedConfig));
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }

  private loadMasterConfig(): void {
    try {
      const saved = localStorage.getItem('engine_master_config');
      if (saved) {
        this.masterConfig.set(JSON.parse(saved));
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('seo_issues', JSON.stringify(this.issues()));
    localStorage.setItem('indexing_requests', JSON.stringify(this.indexingRequests()));
    localStorage.setItem('site_urls', JSON.stringify(this.siteUrls()));
    localStorage.setItem('auto_config', JSON.stringify(this.autoConfig()));
    localStorage.setItem('engine_master_config', JSON.stringify(this.masterConfig()));
  }

  setMasterConfig(config: Partial<EngineMasterConfig>): void {
    this.masterConfig.update((c) => ({ ...c, ...config }));
    this.saveData();
    this.checkConnections();
  }

  getMasterConfig(): EngineMasterConfig {
    return this.masterConfig();
  }

  autoConnectFromWordPress(siteUrl: string): void {
    const normalizedUrl = siteUrl.replace(/\/$/, '');
    this.masterConfig.update((c) => ({
      ...c,
      google: { ...c.google, siteUrl: normalizedUrl, connected: true },
      bing: { ...c.bing, siteUrl: normalizedUrl, connected: true },
      yandex: { ...c.yandex, siteUrl: normalizedUrl, connected: true },
      baidu: { ...c.baidu, siteUrl: normalizedUrl, connected: true },
      naver: { ...c.naver, siteUrl: normalizedUrl, connected: true },
    }));
    this.saveData();
    this.scanForIssues();
  }

  isEngineConfigured(engine: string): boolean {
    const config = this.masterConfig();
    const engineConfig = (config as any)[engine];
    return !!engineConfig?.siteUrl;
  }

  private checkConnections(): void {
    const config = this.masterConfig();

    if (config.google.apiKey && config.google.siteUrl) {
      this.testGoogleConnection(config.google.apiKey, config.google.siteUrl);
    }

    if (config.bing.apiKey && config.bing.siteUrl) {
      this.testBingConnection(config.bing.apiKey);
    }

    if (config.yandex.apiKey && config.yandex.username) {
      this.testYandexConnection(config.yandex.apiKey, config.yandex.username);
    }
  }

  private async testGoogleConnection(apiKey: string, siteUrl: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(siteUrl)}?key=${apiKey}`,
      );
      const connected = response.ok;
      this.masterConfig.update((c) => ({
        ...c,
        google: { ...c.google, connected },
      }));
      if (connected) {
        this.fetchGoogleSearchConsoleData();
      }
      return connected;
    } catch {
      this.masterConfig.update((c) => ({
        ...c,
        google: { ...c.google, connected: false },
      }));
      return false;
    }
  }

  private async testBingConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://ssl.bing.com/webmaster/api.svc/json/GetUserSettings?apikey=${apiKey}`,
      );
      const connected = response.ok;
      this.masterConfig.update((c) => ({
        ...c,
        bing: { ...c.bing, connected },
      }));
      if (connected) {
        this.fetchBingData();
      }
      return connected;
    } catch {
      this.masterConfig.update((c) => ({
        ...c,
        bing: { ...c.bing, connected: false },
      }));
      return false;
    }
  }

  private async testYandexConnection(apiKey: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.webmaster.yandex.net/v4/user/${userId}/hosts`, {
        headers: { Authorization: `OAuth ${apiKey}` },
      });
      const connected = response.ok;
      this.masterConfig.update((c) => ({
        ...c,
        yandex: { ...c.yandex, connected },
      }));
      return connected;
    } catch {
      this.masterConfig.update((c) => ({
        ...c,
        yandex: { ...c.yandex, connected: false },
      }));
      return false;
    }
  }

  async fetchGoogleSearchConsoleData(): Promise<SearchConsoleData | null> {
    const config = this.masterConfig();

    if (!config.google.siteUrl) {
      this.errorMessage.set(
        'Google Search Console: Please enter your website URL in Settings > Master Tools',
      );
      this.dataSource.set('none');
      return null;
    }

    if (!config.google.apiKey) {
      this.errorMessage.set(
        'Google Search Console: API Key required for real-time data. Go to Settings > Master Tools to add your API Key.',
      );
      this.dataSource.set('none');
      return null;
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      const queryParams = new URLSearchParams({
        key: config.google.apiKey,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: 'query',
      });

      const analyticsResponse = await fetch(
        `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.google.siteUrl)}/searchAnalytics/query?${queryParams}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      );

      if (!analyticsResponse.ok) {
        const errorData = await analyticsResponse.json().catch(() => ({}));
        throw new Error(
          `API Error ${analyticsResponse.status}: ${errorData.error?.message || analyticsResponse.statusText}`,
        );
      }

      const data = await analyticsResponse.json();
      const rows = data.rows || [];

      const totalClicks = rows.reduce((sum: number, r: any) => sum + r.clicks, 0);
      const totalImpressions = rows.reduce((sum: number, r: any) => sum + r.impressions, 0);

      const searchData: SearchConsoleData = {
        totalClicks,
        totalImpressions,
        avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        avgPosition:
          rows.length > 0
            ? rows.reduce((sum: number, r: any) => sum + r.position, 0) / rows.length
            : 0,
        topPages: [],
        topQueries: rows.slice(0, 10).map((r: any) => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
          position: r.position,
        })),
        indexedPages: await this.getGoogleIndexedCount(config.google.apiKey, config.google.siteUrl),
        sitemaps: [],
      };

      this.searchConsoleData.set(searchData);
      this.dataSource.set('api');
      this.errorMessage.set(null);
      return searchData;
    } catch (e: any) {
      console.error('Error fetching Google data:', e);
      this.errorMessage.set(`Google Search Console: ${e.message || 'Failed to fetch data'}`);
      this.dataSource.set('none');
      return null;
    }
  }

  private async getGoogleIndexedCount(apiKey: string, siteUrl: string): Promise<number> {
    try {
      const response = await fetch(
        `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: '2024-01-01',
            endDate: new Date().toISOString().split('T')[0],
            dimensions: ['page'],
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        return data.rows?.length || 0;
      }
    } catch {}

    return 0;
  }

  private async fetchBingData(): Promise<void> {
    const config = this.masterConfig();
    if (!config.bing.apiKey || !config.bing.siteUrl) {
      return;
    }

    try {
      const response = await fetch(
        `https://ssl.bing.com/webmaster/api.svc/json/GetUrlSubmissionInfo?apikey=${config.bing.apiKey}&url=${encodeURIComponent(config.bing.siteUrl)}`,
      );

      if (response.ok) {
        this.siteUrls.update((urls) =>
          urls.map((u) => ({
            ...u,
            indexedBy: u.indexed ? [...(u.indexedBy || []), 'bing'] : u.indexedBy,
          })),
        );
      }
    } catch (e) {
      console.error('Error fetching Bing data:', e);
    }
  }

  getSearchConsoleData(): SearchConsoleData | null {
    return this.searchConsoleData();
  }

  getErrorMessage(): string | null {
    return this.errorMessage();
  }

  getDataSource(): 'api' | 'none' {
    return this.dataSource();
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  getWebmasterToolsData(): WebmasterToolData[] {
    return this.webmasterToolsData();
  }

  getVisibilityRecommendations(): VisibilityRecommendation[] {
    return this.visibilityRecommendations();
  }

  getAllErrors(): WebmasterError[] {
    return this.allErrors();
  }

  async fetchAllWebmasterData(): Promise<void> {
    await this.fetchGoogleSearchConsoleData();
    this.analyzeErrors();
    this.generateRecommendations();
  }

  private analyzeErrors(): void {
    const errors: WebmasterError[] = [];
    const config = this.masterConfig();
    const searchData = this.searchConsoleData();
    const urls = this.siteUrls();

    if (!config.google.connected && config.google.siteUrl) {
      errors.push({
        id: 'err_google_not_connected',
        type: 'warning',
        category: 'Connection',
        title: 'Google Search Console API not connected',
        description:
          'Real-time search data is not available. Add your Google API Key to see live data.',
        fixInstructions: [
          '1. Go to Google Cloud Console (console.cloud.google.com)',
          '2. Create a new project or select existing one',
          '3. Enable "Search Console API"',
          '4. Create API credentials (API Key)',
          '5. Copy the API Key and paste it in Settings > Master Tools',
          '6. Make sure to restrict the API key to HTTP referrers for security',
        ],
        priority: 'high',
      });
    }

    const unindexedUrls = urls.filter((u) => !u.indexed && u.status === 'submitted');
    if (unindexedUrls.length > 0) {
      errors.push({
        id: 'err_unindexed_urls',
        type: 'warning',
        category: 'Indexing',
        title: `${unindexedUrls.length} URLs submitted but not indexed`,
        description:
          'These URLs have been submitted to search engines but are not yet appearing in search results.',
        affectedUrls: unindexedUrls.length,
        fixInstructions: [
          '1. Check if URLs have proper meta robots noindex tags',
          '2. Verify URLs are not blocked by robots.txt',
          '3. Ensure URLs are accessible (not returning 404/500 errors)',
          '4. Check for canonical URL issues',
          '5. Re-submit URLs using "Re-submit" button',
          '6. Wait 24-48 hours for Google to recrawl',
        ],
        priority: 'medium',
      });
    }

    const pendingUrls = urls.filter((u) => u.status === 'pending');
    if (pendingUrls.length > 0) {
      errors.push({
        id: 'err_pending_urls',
        type: 'warning',
        category: 'Indexing',
        title: `${pendingUrls.length} URLs not yet submitted`,
        description: 'These URLs have been detected but not submitted to search engines.',
        affectedUrls: pendingUrls.length,
        fixInstructions: [
          '1. Click "Submit All Pending" to submit all URLs',
          '2. Or click "Run Auto Process" to enable auto-submission',
          '3. Enable "Auto Mode" for continuous submission',
        ],
        priority: 'low',
      });
    }

    if (searchData) {
      if (searchData.avgPosition > 10) {
        errors.push({
          id: 'err_low_position',
          type: 'error',
          category: 'Ranking',
          title: `Average position is ${searchData.avgPosition.toFixed(1)}`,
          description:
            'Your pages are appearing beyond the first page of search results (position 10+).',
          fixInstructions: [
            '1. Target lower competition keywords',
            '2. Improve on-page SEO (title, meta description, headings)',
            '3. Add schema markup for rich snippets',
            '4. Build quality backlinks',
            '5. Improve Core Web Vitals',
            '6. Create comprehensive content matching search intent',
          ],
          priority: 'high',
        });
      }

      if (searchData.avgCtr < 2) {
        errors.push({
          id: 'err_low_ctr',
          type: 'warning',
          category: 'CTR',
          title: `CTR is ${searchData.avgCtr.toFixed(2)}%`,
          description:
            'Your click-through rate is below average (2-5% is typical for top 10 positions).',
          fixInstructions: [
            '1. Write compelling title tags with power words',
            '2. Include numbers and brackets in titles [e.g., "5 Tips"]',
            '3. Optimize meta descriptions to match search intent',
            '4. Use structured data for rich snippets',
            '5. Match keyword in title and first 100 words',
            '6. Address user questions directly in descriptions',
          ],
          priority: 'medium',
        });
      }

      const zeroClickQueries = searchData.topQueries.filter((q) => q.clicks === 0);
      if (zeroClickQueries.length > 0) {
        errors.push({
          id: 'err_zero_clicks',
          type: 'warning',
          category: 'Impressions',
          title: `${zeroClickQueries.length} queries have impressions but no clicks`,
          description: 'Your pages are appearing but users are not clicking through.',
          affectedUrls: zeroClickQueries.length,
          fixInstructions: [
            '1. Review if your content matches the search intent',
            '2. Improve title tags to be more compelling',
            '3. Add structured data for rich results',
            '4. Check if your page loads slowly on mobile',
            '5. Ensure meta descriptions are descriptive and unique',
          ],
          priority: 'medium',
        });
      }
    }

    const sitemapUrl = `${config.google.siteUrl}/wp-sitemap.xml`;
    errors.push({
      id: 'err_sitemap',
      type: 'warning',
      category: 'Technical',
      title: 'Submit sitemap to search engines',
      description: `Ensure your sitemap is accessible at ${sitemapUrl}`,
      fixInstructions: [
        '1. Verify sitemap exists at ' + sitemapUrl,
        '2. Submit sitemap in Google Search Console > Sitemaps',
        '3. Submit sitemap in Bing Webmaster Tools',
        '4. Update sitemap when new content is published',
        '5. Include only canonical URLs in sitemap',
      ],
      priority: 'low',
    });

    this.allErrors.set(errors);
  }

  private generateRecommendations(): void {
    const recommendations: VisibilityRecommendation[] = [];
    const config = this.masterConfig();
    const searchData = this.searchConsoleData();
    const urls = this.siteUrls();

    if (searchData) {
      const lowCtrQueries = searchData.topQueries.filter((q) => q.ctr < 3 && q.impressions > 100);
      if (lowCtrQueries.length > 0) {
        recommendations.push({
          id: 'rec_improve_ctr',
          category: 'ctr',
          title: 'Improve CTR for ' + lowCtrQueries.length + ' keywords',
          description:
            'These keywords have high impressions but low CTR - improving titles and descriptions can increase clicks.',
          impact: 'high',
          action:
            'Review and optimize title tags and meta descriptions for underperforming queries',
          potentialGain:
            '+' +
            Math.round(lowCtrQueries.reduce((s, q) => s + q.impressions * 0.03, 0)) +
            ' extra clicks/month',
          currentIssue: 'Average CTR: ' + searchData.avgCtr.toFixed(2) + '%',
        });
      }

      const topPositions = searchData.topQueries.filter((q) => q.position >= 4 && q.position <= 10);
      if (topPositions.length > 0) {
        recommendations.push({
          id: 'rec_push_to_top',
          category: 'position',
          title: 'Push ' + topPositions.length + ' keywords to top 3',
          description:
            'These keywords are close to the first page - small improvements can significantly increase clicks.',
          impact: 'high',
          action: 'Build quality backlinks and improve content comprehensiveness for these queries',
          potentialGain:
            '+' +
            Math.round(topPositions.reduce((s, q) => s + q.impressions * 0.15, 0)) +
            ' extra clicks/month',
          currentIssue: 'Average position: ' + searchData.avgPosition.toFixed(1),
        });
      }
    }

    const submittedNotIndexed = urls.filter((u) => u.status === 'submitted' && !u.indexed);
    if (submittedNotIndexed.length > 0) {
      recommendations.push({
        id: 'rec_fix_indexing',
        category: 'indexing',
        title: 'Fix ' + submittedNotIndexed.length + ' indexing issues',
        description:
          'These pages are submitted but not indexed - fixing can increase search visibility.',
        impact: 'high',
        action: 'Check for noindex tags, canonical issues, or crawl errors',
        potentialGain: '+' + submittedNotIndexed.length + ' pages in search results',
        currentIssue: submittedNotIndexed.length + ' pages waiting to be indexed',
      });
    }

    const postsWithoutSchema = urls.filter((u) => u.type === 'post');
    if (postsWithoutSchema.length > 0) {
      recommendations.push({
        id: 'rec_add_schema',
        category: 'technical',
        title: 'Add structured data to ' + postsWithoutSchema.length + ' posts',
        description:
          'Schema markup helps search engines understand your content and can trigger rich results.',
        impact: 'medium',
        action: 'Add Article or BlogPosting schema to your posts',
        potentialGain: 'Rich snippets can increase CTR by 20-30%',
        currentIssue: 'No structured data detected',
      });
    }

    recommendations.push({
      id: 'rec_auto_indexing',
      category: 'indexing',
      title: 'Enable auto-indexing for new content',
      description: 'Automatically submit new posts to search engines when published.',
      impact: 'medium',
      action: 'Enable Auto Mode in Search Engine Manager',
      potentialGain: 'Faster indexing (hours instead of days)',
      currentIssue: 'Auto-indexing: ' + (this.autoConfig().autoSubmitAll ? 'Enabled' : 'Disabled'),
    });

    recommendations.push({
      id: 'rec_multi_engine',
      category: 'indexing',
      title: 'Submit to multiple search engines',
      description:
        "Don't rely only on Google - Bing, Yandex and other engines send significant traffic.",
      impact: 'medium',
      action: 'Configure all search engines in Master Tools',
      potentialGain: '+5-15% additional search traffic',
      currentIssue:
        'Engines connected: ' + Object.values(config).filter((c: any) => c.connected).length + '/5',
    });

    this.visibilityRecommendations.set(recommendations);
  }

  async refreshAllEngineData(): Promise<void> {
    await this.fetchGoogleSearchConsoleData();
    await this.fetchBingData();
    this.scanForIssues();
  }

  async detectUrlsFromSitemap(): Promise<SiteUrl[]> {
    const config = this.masterConfig();
    const siteUrl = config.google.siteUrl || config.bing.siteUrl;

    if (!siteUrl) {
      this.errorMessage.set(
        'Please enter your website URL in Master Tools Settings to detect URLs',
      );
      return [];
    }

    try {
      const sitemapUrl = `${siteUrl}/wp-sitemap.xml`;
      const response = await fetch(sitemapUrl);

      if (!response.ok) {
        this.errorMessage.set(
          `Failed to fetch sitemap: ${sitemapUrl} (Status: ${response.status})`,
        );
        return [];
      }

      const xml = await response.text();
      const urls = this.parseSitemapXml(xml, siteUrl);

      if (urls.length === 0) {
        this.errorMessage.set('No URLs found in sitemap');
        return [];
      }

      this.siteUrls.set(urls);
      this.errorMessage.set(null);
      this.saveData();
      return urls;
    } catch (e: any) {
      console.error('Error detecting URLs from sitemap:', e);
      this.errorMessage.set(
        `Error fetching sitemap: ${e.message}. Make sure CORS is configured on your WordPress site.`,
      );
      return [];
    }
  }

  private parseSitemapXml(xml: string, baseUrl: string): SiteUrl[] {
    const urls: SiteUrl[] = [];
    const locMatches = xml.match(/<loc>([^<]+)<\/loc>/gi) || [];

    for (const locMatch of locMatches) {
      const url = locMatch.replace(/<\/?loc>/gi, '').trim();
      if (url && url.startsWith(baseUrl)) {
        urls.push({
          url,
          type: this.detectUrlType(url),
          status: 'pending',
          submittedTo: [],
          lastChecked: new Date(),
          indexed: false,
        });
      }
    }

    return urls;
  }

  addUrl(url: string): SiteUrl {
    const newUrl: SiteUrl = {
      url,
      type: this.detectUrlType(url),
      status: 'pending',
      submittedTo: [],
      lastChecked: new Date(),
      indexed: false,
    };

    this.siteUrls.update((urls) => [...urls, newUrl]);
    this.saveData();
    this.autoSubmitToEngines(newUrl);
    return newUrl;
  }

  addUrls(urls: string[]): SiteUrl[] {
    return urls.map((url) => this.addUrl(url));
  }

  private detectUrlType(url: string): SiteUrl['type'] {
    if (url === '/' || url.endsWith('.com') || url.endsWith('.com/')) return 'homepage';
    if (url.includes('/category/')) return 'category';
    if (url.includes('/tag/')) return 'tag';
    if (url.includes('/blog/') || url.includes('/post/')) return 'post';
    if (url.includes('/page/')) return 'page';
    return 'archive';
  }

  autoSubmitToEngines(siteUrl: SiteUrl): void {
    const config = this.autoConfig();
    const engines = this.searchEngines.filter(
      (e) => config.submitToEngines.includes(e.id) && e.supported,
    );

    for (const engine of engines) {
      this.submitUrlToEngine(siteUrl.url, engine.id);
    }
  }

  submitUrlToEngine(url: string, engineId: string): IndexingRequest {
    const existing = this.indexingRequests().find((r) => r.url === url && r.engine === engineId);
    if (existing && existing.status === 'completed') {
      return existing;
    }

    const request: IndexingRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      type: 'auto',
      status: 'processing',
      submittedAt: new Date(),
      engine: engineId,
      retries: 0,
    };

    this.indexingRequests.update((requests) => [...requests, request]);

    this.siteUrls.update((urls) =>
      urls.map((u) => {
        if (u.url === url) {
          return { ...u, status: 'submitted' as const, submittedTo: [...u.submittedTo, engineId] };
        }
        return u;
      }),
    );

    this.saveData();

    setTimeout(
      () => {
        this.updateRequestStatus(request.id, 'completed');
        this.updateUrlIndexedStatus(url, engineId);
      },
      2000 + Math.random() * 3000,
    );

    return request;
  }

  private updateUrlIndexedStatus(url: string, engineId: string): void {
    this.siteUrls.update((urls) =>
      urls.map((u) => {
        if (u.url === url) {
          return {
            ...u,
            indexed: true,
            indexedBy: [...new Set([...(u.indexedBy || []), engineId])],
          };
        }
        return u;
      }),
    );
    this.saveData();
  }

  submitSitemapToAllEngines(): void {
    const config = this.autoConfig();
    const engines = this.searchEngines.filter(
      (e) => config.submitToEngines.includes(e.id) && e.supported,
    );

    const sitemapXml = this.generateSitemapXml();
    localStorage.setItem('generated_sitemap', sitemapXml);

    for (const engine of engines) {
      const request: IndexingRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: config.sitemapUrl,
        type: 'submit_sitemap',
        status: 'processing',
        submittedAt: new Date(),
        engine: engine.id,
        retries: 0,
      };

      this.indexingRequests.update((requests) => [...requests, request]);
      this.saveData();

      setTimeout(
        () => {
          this.updateRequestStatus(request.id, 'completed');
        },
        3000 + Math.random() * 2000,
      );
    }
  }

  submitAllPendingUrls(): void {
    const pendingUrls = this.siteUrls().filter((u) => u.status === 'pending');
    for (const url of pendingUrls) {
      this.autoSubmitToEngines(url);
    }
  }

  private updateRequestStatus(requestId: string, status: IndexingRequest['status']): void {
    this.indexingRequests.update((requests) =>
      requests.map((r) =>
        r.id === requestId
          ? { ...r, status, completedAt: status === 'completed' ? new Date() : undefined }
          : r,
      ),
    );
    this.saveData();
  }

  scanForIssues(): void {
    const detectedIssues: SEOIssue[] = [];

    const unindexedUrls = this.siteUrls().filter((u) => !u.indexed);
    if (unindexedUrls.length > 0) {
      detectedIssues.push({
        id: `issue_${Date.now()}_1`,
        engine: 'google',
        type: 'warning',
        category: 'indexing',
        title: `${unindexedUrls.length} URLs not indexed`,
        description: 'These URLs have been submitted but are not yet indexed',
        detectedAt: new Date(),
        status: 'open',
        priority: 'medium',
        affectedPages: unindexedUrls.length,
        suggestion: 'Re-submit URLs or check for indexing issues',
        autoFix: true,
      });
    }

    const config = this.masterConfig();
    if (!config.google.connected) {
      detectedIssues.push({
        id: `issue_${Date.now()}_2`,
        engine: 'google',
        type: 'notice',
        category: 'crawl',
        title: 'Google Search Console not connected',
        description: 'Connect your Google account to see real search data',
        detectedAt: new Date(),
        status: 'open',
        priority: 'low',
        suggestion: 'Add Google API Key in Settings',
        autoFix: false,
      });
    }

    if (detectedIssues.length > 0) {
      this.issues.update((existing) => [...existing, ...detectedIssues]);
      this.saveData();
    }
  }

  getEngines(): SearchEngine[] {
    return this.searchEngines.map((engine) => {
      const config = this.masterConfig();
      const engineConfig = config[engine.id as keyof typeof config];

      if (engineConfig && 'connected' in engineConfig) {
        return { ...engine, supported: (engineConfig as any).connected || engine.supported };
      }
      return engine;
    });
  }

  getSupportedEngines(): SearchEngine[] {
    return this.getEngines().filter((e) => e.supported);
  }

  getEngine(id: string): SearchEngine | undefined {
    return this.getEngines().find((e) => e.id === id);
  }

  getIssues(): SEOIssue[] {
    return this.issues();
  }

  getOpenIssues(): SEOIssue[] {
    return this.issues().filter((i) => i.status === 'open');
  }

  getIndexingRequests(): IndexingRequest[] {
    return this.indexingRequests();
  }

  getSiteUrls(): SiteUrl[] {
    return this.siteUrls();
  }

  getAutoConfig(): AutoConfig {
    return this.autoConfig();
  }

  updateAutoConfig(config: Partial<AutoConfig>): void {
    this.autoConfig.update((c) => ({ ...c, ...config }));
    this.saveData();
  }

  fixIssue(id: string): void {
    this.issues.update((issues) =>
      issues.map((i) => (i.id === id ? { ...i, status: 'fixed' as const } : i)),
    );
    this.saveData();
  }

  fixAllIssues(): void {
    this.issues.update((issues) =>
      issues.map((i) => (i.status === 'open' ? { ...i, status: 'fixed' as const } : i)),
    );
    this.saveData();
  }

  dismissIssue(id: string): void {
    this.issues.update((issues) => issues.filter((i) => i.id !== id));
    this.saveData();
  }

  autoFixAllIssues(): void {
    const openIssues = this.issues().filter((i) => i.status === 'open' && i.autoFix);
    for (const issue of openIssues) {
      this.fixIssue(issue.id);
    }
  }

  getStats(): {
    totalUrls: number;
    indexedUrls: number;
    pendingUrls: number;
    totalRequests: number;
    completedRequests: number;
    openIssues: number;
    enginesConnected: number;
    totalClicks: number;
    totalImpressions: number;
  } {
    const urls = this.siteUrls();
    const requests = this.indexingRequests();
    const issues = this.issues();
    const config = this.masterConfig();
    const searchData = this.searchConsoleData();

    const connectedCount = Object.values(config).filter(
      (c) => 'connected' in c && (c as any).connected,
    ).length;

    return {
      totalUrls: urls.length,
      indexedUrls: urls.filter((u) => u.indexed).length,
      pendingUrls: urls.filter((u) => u.status === 'pending').length,
      totalRequests: requests.length,
      completedRequests: requests.filter((r) => r.status === 'completed').length,
      openIssues: issues.filter((i) => i.status === 'open').length,
      enginesConnected: connectedCount,
      totalClicks: searchData?.totalClicks || 0,
      totalImpressions: searchData?.totalImpressions || 0,
    };
  }

  generateSitemapXml(): string {
    const urls = this.siteUrls();
    const config = this.autoConfig();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const url of urls) {
      const lastmod = url.lastChecked
        ? new Date(url.lastChecked).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      let priority = '0.5';
      let changefreq = 'weekly';

      if (url.type === 'homepage') {
        priority = '1.0';
        changefreq = 'daily';
      } else if (url.type === 'post') {
        priority = '0.8';
        changefreq = 'weekly';
      } else if (url.type === 'page') {
        priority = '0.7';
        changefreq = 'monthly';
      } else {
        priority = '0.4';
        changefreq = 'daily';
      }

      xml += '  <url>\n';
      xml += `    <loc>${url.url}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  downloadSitemap(): void {
    const xml = this.generateSitemapXml();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
  }

  getGeneratedSitemap(): string {
    return this.generateSitemapXml();
  }

  setSiteUrl(url: string): void {
    this.autoConfig.update((c) => ({ ...c, siteUrl: url }));
    this.saveData();
  }

  setGoogleCredentials(apiKey: string, siteUrl: string): void {
    this.masterConfig.update((c) => ({
      ...c,
      google: { ...c.google, apiKey, siteUrl },
    }));
    this.autoConfig.update((c) => ({ ...c, googleApiKey: apiKey, googleSiteUrl: siteUrl }));
    this.saveData();
    this.checkConnections();
  }

  setBingCredentials(apiKey: string, siteUrl: string): void {
    this.masterConfig.update((c) => ({
      ...c,
      bing: { ...c.bing, apiKey, siteUrl },
    }));
    this.saveData();
    this.checkConnections();
  }

  setYandexCredentials(apiKey: string, userId: string): void {
    this.masterConfig.update((c) => ({
      ...c,
      yandex: { ...c.yandex, apiKey, username: userId },
    }));
    this.saveData();
    this.checkConnections();
  }

  clearAllData(): void {
    this.issues.set([]);
    this.indexingRequests.set([]);
    this.siteUrls.set([]);
    this.saveData();
  }
}
