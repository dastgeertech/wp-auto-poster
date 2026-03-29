import { Injectable, signal } from '@angular/core';

export interface AnalyticsData {
  totalPosts: number;
  totalViews: number;
  avgSeoScore: number;
  postsThisWeek: number;
  postsThisMonth: number;
  topKeywords: { keyword: string; count: number; avgScore: number }[];
  seoDistribution: { range: string; count: number; percent: number }[];
  publishingTrend: { date: string; count: number }[];
  languageBreakdown: { language: string; count: number; percent: number }[];
  platformBreakdown: { platform: string; count: number; percent: number }[];
  topPerformingPosts: {
    id: string;
    title: string;
    views: number;
    seoScore: number;
    date: Date;
  }[];
  hourlyActivity: { hour: number; count: number }[];
}

export interface PostAnalytics {
  id: string;
  title: string;
  keyword: string;
  views: number;
  seoScore: number;
  wordCount: number;
  language: string;
  publishedAt: Date;
  socialShares: number;
  readTime: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private postAnalytics: PostAnalytics[] = [];
  private isInitialized = false;

  constructor() {
    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    try {
      const saved = localStorage.getItem('post_analytics');
      if (saved) {
        this.postAnalytics = JSON.parse(saved).map((p: any) => ({
          ...p,
          publishedAt: new Date(p.publishedAt),
        }));
      }
      this.isInitialized = true;
    } catch (e) {
      this.postAnalytics = [];
      this.isInitialized = true;
    }
  }

  private saveAnalytics(): void {
    localStorage.setItem('post_analytics', JSON.stringify(this.postAnalytics));
  }

  trackPost(post: Partial<PostAnalytics>): void {
    const newPost: PostAnalytics = {
      id: post.id || 'post_' + Date.now(),
      title: post.title || 'Untitled',
      keyword: post.keyword || '',
      views: post.views || 0,
      seoScore: post.seoScore || 0,
      wordCount: post.wordCount || 0,
      language: post.language || 'en',
      publishedAt: post.publishedAt || new Date(),
      socialShares: post.socialShares || 0,
      readTime: post.readTime || Math.floor((post.wordCount || 0) / 200),
    };

    this.postAnalytics.unshift(newPost);
    this.saveAnalytics();
  }

  updatePostViews(postId: string, views: number): void {
    const post = this.postAnalytics.find((p) => p.id === postId);
    if (post) {
      post.views = views;
      this.saveAnalytics();
    }
  }

  getAnalytics(): AnalyticsData {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const postsThisWeek = this.postAnalytics.filter((p) => p.publishedAt >= weekAgo);
    const postsThisMonth = this.postAnalytics.filter((p) => p.publishedAt >= monthAgo);

    const totalViews = this.postAnalytics.reduce((sum, p) => sum + p.views, 0);
    const avgSeoScore =
      this.postAnalytics.length > 0
        ? Math.round(
            this.postAnalytics.reduce((sum, p) => sum + p.seoScore, 0) / this.postAnalytics.length,
          )
        : 0;

    const keywordCounts = new Map<string, { count: number; totalScore: number }>();
    this.postAnalytics.forEach((p) => {
      const existing = keywordCounts.get(p.keyword) || { count: 0, totalScore: 0 };
      keywordCounts.set(p.keyword, {
        count: existing.count + 1,
        totalScore: existing.totalScore + p.seoScore,
      });
    });

    const topKeywords = Array.from(keywordCounts.entries())
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const seoDistribution = this.calculateSeoDistribution();

    const publishingTrend = this.calculatePublishingTrend();

    const languageCounts = new Map<string, number>();
    this.postAnalytics.forEach((p) => {
      languageCounts.set(p.language, (languageCounts.get(p.language) || 0) + 1);
    });

    const languageBreakdown = Array.from(languageCounts.entries())
      .map(([language, count]) => ({
        language,
        count,
        percent: Math.round((count / this.postAnalytics.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const topPerformingPosts = [...this.postAnalytics]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        views: p.views,
        seoScore: p.seoScore,
        date: p.publishedAt,
      }));

    const hourlyActivity = this.calculateHourlyActivity();

    const platformBreakdown = [
      { platform: 'WordPress', count: this.postAnalytics.length, percent: 100 },
    ];

    return {
      totalPosts: this.postAnalytics.length,
      totalViews,
      avgSeoScore,
      postsThisWeek: postsThisWeek.length,
      postsThisMonth: postsThisMonth.length,
      topKeywords,
      seoDistribution,
      publishingTrend,
      languageBreakdown,
      platformBreakdown,
      topPerformingPosts,
      hourlyActivity,
    };
  }

  private calculateSeoDistribution(): { range: string; count: number; percent: number }[] {
    const ranges = [
      { label: '90-100', min: 90, max: 100 },
      { label: '80-89', min: 80, max: 89 },
      { label: '70-79', min: 70, max: 79 },
      { label: '60-69', min: 60, max: 69 },
      { label: '50-59', min: 50, max: 59 },
      { label: '0-49', min: 0, max: 49 },
    ];

    return ranges.map((range) => {
      const count = this.postAnalytics.filter(
        (p) => p.seoScore >= range.min && p.seoScore <= range.max,
      ).length;
      return {
        range: range.label,
        count,
        percent:
          this.postAnalytics.length > 0 ? Math.round((count / this.postAnalytics.length) * 100) : 0,
      };
    });
  }

  private calculatePublishingTrend(): { date: string; count: number }[] {
    const trend: Map<string, number> = new Map();
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      trend.set(dateStr, 0);
    }

    this.postAnalytics.forEach((p) => {
      const dateStr = p.publishedAt.toISOString().split('T')[0];
      if (trend.has(dateStr)) {
        trend.set(dateStr, (trend.get(dateStr) || 0) + 1);
      }
    });

    return Array.from(trend.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  private calculateHourlyActivity(): { hour: number; count: number }[] {
    const activity: { hour: number; count: number }[] = [];

    for (let hour = 0; hour < 24; hour++) {
      activity.push({ hour, count: 0 });
    }

    return activity;
  }

  getPostAnalytics(postId: string): PostAnalytics | undefined {
    return this.postAnalytics.find((p) => p.id === postId);
  }

  clearAnalytics(): void {
    this.postAnalytics = [];
    this.saveAnalytics();
  }

  generateMockData(count: number = 50): void {
    const keywords = [
      'AI Tools',
      'Tech Reviews',
      'Gadgets',
      'Software',
      'Gaming',
      'Smartphones',
      'Laptops',
      'Cloud Computing',
      'Cybersecurity',
      'Web Development',
      'Mobile Apps',
      'Data Science',
      'Machine Learning',
      'Blockchain',
      'IoT',
    ];

    const languages = ['en', 'es', 'fr', 'de', 'pt'];
    const titles = [
      'The Ultimate Guide to',
      'Top 10',
      'How to',
      'Best',
      'Review of',
      'Complete Guide to',
      'Understanding',
      'Getting Started with',
      'Advanced Tips for',
    ];

    for (let i = 0; i < count; i++) {
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const title = titles[Math.floor(Math.random() * titles.length)] + ' ' + keyword;
      const daysAgo = Math.floor(Math.random() * 30);
      const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      this.trackPost({
        title,
        keyword,
        views: Math.floor(Math.random() * 5000),
        seoScore: 60 + Math.floor(Math.random() * 40),
        wordCount: 1000 + Math.floor(Math.random() * 2000),
        language: languages[Math.floor(Math.random() * languages.length)],
        publishedAt,
        socialShares: Math.floor(Math.random() * 100),
      });
    }
  }
}
