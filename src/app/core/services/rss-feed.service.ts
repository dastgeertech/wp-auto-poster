import { Injectable } from '@angular/core';

export interface RssFeed {
  id: string;
  url: string;
  title: string;
  description?: string;
  lastFetched?: Date;
  articleCount: number;
}

export interface RssArticle {
  id: string;
  feedId: string;
  title: string;
  link: string;
  description?: string;
  content?: string;
  author?: string;
  pubDate: Date;
  imageUrl?: string;
  categories: string[];
}

@Injectable({
  providedIn: 'root',
})
export class RssFeedService {
  private feeds: RssFeed[] = [];
  private articles: Map<string, RssArticle[]> = new Map();

  private readonly defaultFeeds: { name: string; url: string }[] = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
    { name: 'Engadget', url: 'https://www.engadget.com/rss.xml' },
  ];

  constructor() {
    this.loadFeeds();
  }

  private loadFeeds(): void {
    try {
      const saved = localStorage.getItem('rss_feeds');
      if (saved) {
        this.feeds = JSON.parse(saved);
      } else {
        this.initializeDefaultFeeds();
      }
    } catch (e) {
      this.initializeDefaultFeeds();
    }
  }

  private initializeDefaultFeeds(): void {
    this.defaultFeeds.forEach((feed) => {
      this.addFeed(feed.url, feed.name);
    });
  }

  private saveFeeds(): void {
    localStorage.setItem('rss_feeds', JSON.stringify(this.feeds));
  }

  getFeeds(): RssFeed[] {
    return this.feeds;
  }

  getFeed(id: string): RssFeed | undefined {
    return this.feeds.find((f) => f.id === id);
  }

  addFeed(url: string, title?: string): RssFeed {
    const existing = this.feeds.find((f) => f.url === url);
    if (existing) return existing;

    const feed: RssFeed = {
      id: 'feed_' + Date.now(),
      url,
      title: title || this.extractDomain(url),
      articleCount: 0,
    };

    this.feeds.push(feed);
    this.saveFeeds();
    return feed;
  }

  removeFeed(id: string): void {
    this.feeds = this.feeds.filter((f) => f.id !== id);
    this.articles.delete(id);
    this.saveFeeds();
  }

  updateFeed(id: string, updates: Partial<RssFeed>): void {
    const index = this.feeds.findIndex((f) => f.id === id);
    if (index >= 0) {
      this.feeds[index] = { ...this.feeds[index], ...updates };
      this.saveFeeds();
    }
  }

  async fetchFeed(feedId: string): Promise<RssArticle[]> {
    const feed = this.getFeed(feedId);
    if (!feed) return [];

    try {
      const articles = this.parseRss(feed);
      this.articles.set(feedId, articles);

      feed.lastFetched = new Date();
      feed.articleCount = articles.length;
      this.saveFeeds();

      return articles;
    } catch (e) {
      console.error('Failed to fetch feed:', e);
      return this.articles.get(feedId) || [];
    }
  }

  async fetchAllFeeds(): Promise<void> {
    const promises = this.feeds.map((feed) => this.fetchFeed(feed.id));
    await Promise.all(promises);
  }

  getArticles(feedId?: string): RssArticle[] {
    if (feedId) {
      return this.articles.get(feedId) || [];
    }

    const all: RssArticle[] = [];
    this.articles.forEach((articles) => {
      all.push(...articles);
    });

    return all.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  }

  private parseRss(feed: RssFeed): RssArticle[] {
    const mockArticles: RssArticle[] = [];
    const topics = this.extractTopics(feed.title);

    for (let i = 0; i < 10; i++) {
      const title = this.generateTitle(topics);
      const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

      mockArticles.push({
        id: `article_${feed.id}_${i}`,
        feedId: feed.id,
        title,
        link: `https://${this.extractDomain(feed.url)}/article/${i}`,
        description: this.generateDescription(title),
        author: this.randomAuthor(),
        pubDate: date,
        categories: topics.slice(0, 2),
      });
    }

    return mockArticles;
  }

  private extractDomain(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname.replace('www.', '');
    } catch {
      return 'feed';
    }
  }

  private extractTopics(title: string): string[] {
    const techTerms = [
      'AI',
      'Machine Learning',
      'Blockchain',
      'Cloud',
      'Security',
      'Mobile',
      'Web',
      'Software',
      'Hardware',
      'Gadgets',
    ];
    return techTerms.slice(0, 3 + Math.floor(Math.random() * 3));
  }

  private generateTitle(topics: string[]): string {
    const templates = [
      `Top ${topics[0]} Trends for 2026`,
      `How ${topics[0]} is Changing the Industry`,
      `${topics[0]} vs ${topics[1]}: What's Better?`,
      `The Ultimate Guide to ${topics[0]}`,
      `${topics[0]} Best Practices for Developers`,
      `Why ${topics[0]} Matters in 2026`,
      `10 ${topics[0]} Tools You Need`,
      `Understanding ${topics[0]} in Simple Terms`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateDescription(title: string): string {
    return `Discover the latest insights about ${title.toLowerCase()}. This comprehensive article covers everything you need to know, with expert analysis and practical tips.`;
  }

  private randomAuthor(): string {
    const authors = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Emily Davis', 'Alex Wilson'];
    return authors[Math.floor(Math.random() * authors.length)];
  }

  searchArticles(query: string): RssArticle[] {
    const lower = query.toLowerCase();
    return this.getArticles().filter(
      (article) =>
        article.title.toLowerCase().includes(lower) ||
        article.description?.toLowerCase().includes(lower) ||
        article.categories.some((c) => c.toLowerCase().includes(lower)),
    );
  }

  getArticlesByCategory(category: string): RssArticle[] {
    return this.getArticles().filter((article) =>
      article.categories.some((c) => c.toLowerCase() === category.toLowerCase()),
    );
  }

  getRecentArticles(count: number = 10): RssArticle[] {
    return this.getArticles().slice(0, count);
  }

  getCategories(): string[] {
    const cats = new Set<string>();
    this.articles.forEach((articles) => {
      articles.forEach((a) => a.categories.forEach((c) => cats.add(c)));
    });
    return Array.from(cats);
  }

  refreshFeed(feedId: string): Promise<RssArticle[]> {
    return this.fetchFeed(feedId);
  }

  clearCache(): void {
    this.articles.clear();
    this.feeds.forEach((f) => {
      f.articleCount = 0;
      f.lastFetched = undefined;
    });
    this.saveFeeds();
  }
}
