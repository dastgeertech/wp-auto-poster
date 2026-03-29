import { Injectable, signal } from '@angular/core';

export type Platform =
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'pinterest';
export type PostStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

export interface SocialCampaign {
  id: string;
  name: string;
  description?: string;
  platform: Platform;
  platforms?: Platform[];
  status: PostStatus;
  type: 'post' | 'story' | 'reel' | 'video' | 'carousel' | 'poll' | 'ad';
  content: string;
  mediaUrls?: string[];
  scheduledAt?: Date;
  publishedAt?: Date;
  startDate?: Date;
  endDate?: Date;
  postCount?: number;
  targetAudience?: {
    ageMin?: number;
    ageMax?: number;
    locations?: string[];
    interests?: string[];
  };
  budget?: {
    amount: number;
    currency: string;
    spent: number;
  };
  stats?: {
    impressions: number;
    reach: number;
    clicks: number;
    engagements: number;
    shares: number;
    comments: number;
    likes: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccount {
  id: string;
  platform: SocialCampaign['platform'];
  username: string;
  displayName: string;
  avatar?: string;
  followers: number;
  connected: boolean;
  accessToken?: string;
  permissions: string[];
}

export interface ScheduledPost {
  id: string;
  campaignId: string;
  content: string;
  platform: SocialCampaign['platform'];
  scheduledAt: Date;
  status: 'pending' | 'published' | 'failed';
  mediaUrls?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SocialCampaignService {
  private campaigns = signal<SocialCampaign[]>([]);
  private accounts = signal<SocialAccount[]>([]);
  private scheduledPosts = signal<ScheduledPost[]>([]);

  readonly platforms = [
    { id: 'twitter', name: 'Twitter/X', icon: 'X', color: '#000000' },
    { id: 'facebook', name: 'Facebook', icon: 'f', color: '#1877F2' },
    { id: 'instagram', name: 'Instagram', icon: 'IG', color: '#E4405F' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: '#0A66C2' },
    { id: 'youtube', name: 'YouTube', icon: 'YT', color: '#FF0000' },
    { id: 'tiktok', name: 'TikTok', icon: '♪', color: '#000000' },
    { id: 'pinterest', name: 'Pinterest', icon: 'P', color: '#E60023' },
  ];

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData(): void {
    try {
      const savedCampaigns = localStorage.getItem('social_campaigns');
      const savedAccounts = localStorage.getItem('social_accounts_new');
      const savedScheduled = localStorage.getItem('social_scheduled');

      if (savedCampaigns) {
        this.campaigns.set(
          JSON.parse(savedCampaigns).map((c: any) => ({
            ...c,
            scheduledAt: c.scheduledAt ? new Date(c.scheduledAt) : undefined,
            publishedAt: c.publishedAt ? new Date(c.publishedAt) : undefined,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          })),
        );
      }

      if (savedAccounts) {
        this.accounts.set(JSON.parse(savedAccounts));
      }

      if (savedScheduled) {
        this.scheduledPosts.set(
          JSON.parse(savedScheduled).map((p: any) => ({
            ...p,
            scheduledAt: new Date(p.scheduledAt),
          })),
        );
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('social_campaigns', JSON.stringify(this.campaigns()));
    localStorage.setItem('social_accounts_new', JSON.stringify(this.accounts()));
    localStorage.setItem('social_scheduled', JSON.stringify(this.scheduledPosts()));
  }

  private initializeMockData(): void {
    if (this.accounts().length === 0) {
      this.accounts.set([
        {
          id: '1',
          platform: 'twitter',
          username: '@yourbrand',
          displayName: 'Your Brand',
          followers: 5000,
          connected: false,
          permissions: ['post', 'read'],
        },
        {
          id: '2',
          platform: 'facebook',
          username: 'YourBrand',
          displayName: 'Your Brand Page',
          followers: 12000,
          connected: false,
          permissions: ['post', 'manage'],
        },
        {
          id: '3',
          platform: 'instagram',
          username: '@yourbrand',
          displayName: 'Your Brand',
          followers: 8500,
          connected: false,
          permissions: ['post', 'story'],
        },
        {
          id: '4',
          platform: 'linkedin',
          username: 'Your Company',
          displayName: 'Your Company',
          followers: 3200,
          connected: false,
          permissions: ['post', 'message'],
        },
        {
          id: '5',
          platform: 'youtube',
          username: 'YourChannel',
          displayName: 'Your Channel',
          followers: 15000,
          connected: false,
          permissions: ['upload', 'manage'],
        },
        {
          id: '6',
          platform: 'tiktok',
          username: '@yourbrand',
          displayName: 'Your Brand',
          followers: 25000,
          connected: false,
          permissions: ['post'],
        },
        {
          id: '7',
          platform: 'pinterest',
          username: 'yourbrand',
          displayName: 'Your Brand',
          followers: 3000,
          connected: false,
          permissions: ['post', 'board'],
        },
      ]);
      this.saveData();
    }
  }

  getAccounts(): SocialAccount[] {
    return this.accounts();
  }

  getConnectedAccounts(): SocialAccount[] {
    return this.accounts().filter((a) => a.connected);
  }

  connectAccount(id: string): void {
    this.accounts.update((accounts) =>
      accounts.map((a) => (a.id === id ? { ...a, connected: true } : a)),
    );
    this.saveData();
  }

  disconnectAccount(id: string): void {
    this.accounts.update((accounts) =>
      accounts.map((a) => (a.id === id ? { ...a, connected: false } : a)),
    );
    this.saveData();
  }

  getCampaigns(filters?: {
    platform?: string;
    status?: SocialCampaign['status'];
  }): SocialCampaign[] {
    let result = this.campaigns();

    if (filters?.platform) {
      result = result.filter((c) => c.platform === filters.platform);
    }
    if (filters?.status) {
      result = result.filter((c) => c.status === filters.status);
    }

    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getCampaign(id: string): SocialCampaign | undefined {
    return this.campaigns().find((c) => c.id === id);
  }

  createCampaign(campaign: Omit<SocialCampaign, 'id' | 'createdAt' | 'updatedAt'>): SocialCampaign {
    const newCampaign: SocialCampaign = {
      ...campaign,
      id: 'camp_' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.campaigns.update((campaigns) => [...campaigns, newCampaign]);
    this.saveData();
    return newCampaign;
  }

  updateCampaign(id: string, updates: Partial<SocialCampaign>): void {
    this.campaigns.update((campaigns) =>
      campaigns.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c)),
    );
    this.saveData();
  }

  deleteCampaign(id: string): void {
    this.campaigns.update((campaigns) => campaigns.filter((c) => c.id !== id));
    this.saveData();
  }

  publishCampaign(id: string): void {
    this.updateCampaign(id, {
      status: 'active',
      publishedAt: new Date(),
    });
  }

  pauseCampaign(id: string): void {
    this.updateCampaign(id, { status: 'paused' });
  }

  resumeCampaign(id: string): void {
    this.updateCampaign(id, { status: 'active' });
  }

  completeCampaign(id: string): void {
    this.updateCampaign(id, { status: 'completed' });
  }

  getScheduledPosts(): ScheduledPost[] {
    return this.scheduledPosts().sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  schedulePost(post: Omit<ScheduledPost, 'id' | 'status'>): ScheduledPost {
    const newPost: ScheduledPost = {
      ...post,
      id: 'post_' + Date.now(),
      status: 'pending',
    };
    this.scheduledPosts.update((posts) => [...posts, newPost]);
    this.saveData();
    return newPost;
  }

  cancelScheduledPost(id: string): void {
    this.scheduledPosts.update((posts) => posts.filter((p) => p.id !== id));
    this.saveData();
  }

  getCampaignStats(): {
    total: number;
    active: number;
    scheduled: number;
    byPlatform: Record<string, number>;
    totalImpressions: number;
    totalEngagements: number;
  } {
    const campaigns = this.campaigns();
    const byPlatform: Record<string, number> = {};
    let totalImpressions = 0;
    let totalEngagements = 0;

    campaigns.forEach((c) => {
      byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;
      if (c.stats) {
        totalImpressions += c.stats.impressions;
        totalEngagements += c.stats.engagements;
      }
    });

    return {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === 'active').length,
      scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
      byPlatform,
      totalImpressions,
      totalEngagements,
    };
  }

  generateMockStats(campaignId: string): void {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) return;

    this.updateCampaign(campaignId, {
      stats: {
        impressions: Math.floor(1000 + Math.random() * 10000),
        reach: Math.floor(500 + Math.random() * 5000),
        clicks: Math.floor(50 + Math.random() * 500),
        engagements: Math.floor(100 + Math.random() * 1000),
        shares: Math.floor(10 + Math.random() * 100),
        comments: Math.floor(5 + Math.random() * 50),
        likes: Math.floor(100 + Math.random() * 1000),
      },
    });
  }

  getPlatformInfo(platform: string): { name: string; color: string } | undefined {
    return this.platforms.find((p) => p.id === platform);
  }

  getPlatformStats(): Array<{
    platform: Platform;
    followers: number;
    posts: number;
    engagement: number;
    connected: boolean;
  }> {
    const stats: Record<
      Platform,
      { followers: number; posts: number; engagement: number; connected: boolean }
    > = {
      twitter: { followers: 5000, posts: 145, engagement: 4.2, connected: false },
      facebook: { followers: 12000, posts: 89, engagement: 3.8, connected: false },
      instagram: { followers: 8500, posts: 234, engagement: 5.1, connected: false },
      linkedin: { followers: 3200, posts: 56, engagement: 6.2, connected: false },
      youtube: { followers: 15000, posts: 42, engagement: 7.5, connected: false },
      tiktok: { followers: 25000, posts: 189, engagement: 8.9, connected: false },
      pinterest: { followers: 3000, posts: 67, engagement: 3.4, connected: false },
    };

    const connected = this.getConnectedAccounts();
    connected.forEach((acc) => {
      if (stats[acc.platform as Platform]) {
        stats[acc.platform as Platform].connected = true;
      }
    });

    return Object.entries(stats).map(([platform, data]) => ({
      platform: platform as Platform,
      ...data,
    }));
  }

  getPostQueue(): Array<{
    id: string;
    title: string;
    content: string;
    platform: Platform;
    scheduledDate: Date;
  }> {
    const queue: Array<{
      id: string;
      title: string;
      content: string;
      platform: Platform;
      scheduledDate: Date;
    }> = [];
    const now = new Date();

    this.scheduledPosts().forEach((post) => {
      queue.push({
        id: post.id,
        title: post.content.slice(0, 50) + '...',
        content: post.content,
        platform: post.platform,
        scheduledDate: post.scheduledAt,
      });
    });

    if (queue.length === 0) {
      queue.push(
        {
          id: '1',
          title: 'Product Launch Announcement',
          content: 'Exciting news! Our new product is finally here...',
          platform: 'twitter',
          scheduledDate: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        },
        {
          id: '2',
          title: 'Behind the Scenes',
          content: 'Take a look at how we create our amazing products...',
          platform: 'instagram',
          scheduledDate: new Date(now.getTime() + 5 * 60 * 60 * 1000),
        },
        {
          id: '3',
          title: 'Industry Insights',
          content: 'Our latest analysis shows interesting trends in...',
          platform: 'linkedin',
          scheduledDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      );
    }

    return queue;
  }

  togglePlatformConnection(platform: Platform): void {
    const account = this.accounts().find((a) => a.platform === platform);
    if (account) {
      if (account.connected) {
        this.disconnectAccount(account.id);
      } else {
        this.connectAccount(account.id);
      }
    }
  }

  duplicateCampaign(id: string): void {
    const campaign = this.getCampaign(id);
    if (campaign) {
      this.createCampaign({
        ...campaign,
        name: campaign.name + ' (Copy)',
        status: 'draft',
        scheduledAt: undefined,
        publishedAt: undefined,
      });
    }
  }

  updateCampaignStatus(id: string, status: PostStatus): void {
    this.updateCampaign(id, { status });
  }

  removeFromQueue(id: string): void {
    this.cancelScheduledPost(id);
  }
}
