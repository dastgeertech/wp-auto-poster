import { Injectable } from '@angular/core';
import {
  TechTopic,
  TechAutoPostConfig,
  TechAutoPostLog,
  DEFAULT_TECH_AUTO_POST_CONFIG,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class TechTopicService {
  private config: TechAutoPostConfig = { ...DEFAULT_TECH_AUTO_POST_CONFIG };
  private postLogs: TechAutoPostLog[] = [];
  private permanentlyUsedTopics: Set<string> = new Set();
  private currentTopicIndex = 0;
  private topicsLastRefreshed: Date | null = null;

  constructor() {
    this.loadConfig();
    this.loadLogs();
    this.loadPermanentlyUsedTopics();
    this.refreshTopicsIfNeeded();
  }

  private loadPermanentlyUsedTopics(): void {
    const stored = localStorage.getItem('permanently_used_topics');
    if (stored) {
      try {
        const topics = JSON.parse(stored);
        this.permanentlyUsedTopics = new Set(topics);
      } catch (e) {
        this.permanentlyUsedTopics = new Set();
      }
    }
  }

  private savePermanentlyUsedTopics(): void {
    localStorage.setItem(
      'permanently_used_topics',
      JSON.stringify([...this.permanentlyUsedTopics]),
    );
  }

  private isTopicPermanentlyUsed(keyword: string): boolean {
    return this.permanentlyUsedTopics.has(keyword);
  }

  private markTopicAsPermanentlyUsed(keyword: string): void {
    this.permanentlyUsedTopics.add(keyword);
    this.savePermanentlyUsedTopics();
  }

  resetPermanentlyUsedTopics(): void {
    this.permanentlyUsedTopics.clear();
    this.savePermanentlyUsedTopics();
  }

  getPermanentlyUsedTopicsCount(): number {
    return this.permanentlyUsedTopics.size;
  }

  private loadConfig(): void {
    const stored = localStorage.getItem('tech_auto_post_config');
    if (stored) {
      this.config = { ...DEFAULT_TECH_AUTO_POST_CONFIG, ...JSON.parse(stored) };
    }
  }

  private loadLogs(): void {
    const stored = localStorage.getItem('tech_auto_post_logs');
    if (stored) {
      this.postLogs = JSON.parse(stored).map((log: any) => ({
        ...log,
        createdAt: new Date(log.createdAt),
        publishedAt: log.publishedAt ? new Date(log.publishedAt) : undefined,
      }));
    }
  }

  saveConfig(config: Partial<TechAutoPostConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('tech_auto_post_config', JSON.stringify(this.config));
  }

  getConfig(): TechAutoPostConfig {
    return { ...this.config };
  }

  getTopics(): TechTopic[] {
    this.refreshTopicsIfNeeded();
    return this.getTrendingTopics();
  }

  refreshTopicsIfNeeded(): void {
    if (!this.topicsLastRefreshed) {
      this.topicsLastRefreshed = new Date();
      this.saveTopics();
      return;
    }

    const hoursSinceRefresh =
      (new Date().getTime() - this.topicsLastRefreshed.getTime()) / (1000 * 60 * 60);

    if (hoursSinceRefresh >= 6) {
      this.shuffleTopics();
      this.topicsLastRefreshed = new Date();
      this.saveTopics();
    }
  }

  private saveTopics(): void {
    const topicData = {
      lastRefreshed: this.topicsLastRefreshed?.toISOString(),
      topicOrder: Array.from({ length: 50 }, (_, i) => (i + this.currentTopicIndex) % 50),
    };
    localStorage.setItem('tech_topics_state', JSON.stringify(topicData));
  }

  private shuffleTopics(): void {
    const randomOffset = Math.floor(Math.random() * 10) + 5;
    this.currentTopicIndex = (this.currentTopicIndex + randomOffset) % 50;
  }

  getNextTopic(): TechTopic | null {
    const topics = this.getTopics();
    const today = new Date().toDateString();

    // Filter out topics used today AND topics permanently used
    const usedToday = this.postLogs
      .filter((log) => new Date(log.createdAt).toDateString() === today)
      .map((log) => log.topic);

    const availableTopics = topics.filter(
      (t) => !usedToday.includes(t.keyword) && !this.isTopicPermanentlyUsed(t.keyword),
    );

    // If all topics are used, return null (no topics available)
    if (availableTopics.length === 0) {
      console.log('All topics exhausted - no topics available for posting');
      return null;
    }

    const topic = availableTopics[this.currentTopicIndex % availableTopics.length];
    this.currentTopicIndex = (this.currentTopicIndex + 1) % availableTopics.length;
    return topic;
  }

  getAvailableTopicsCount(): number {
    const topics = this.getTopics();
    const today = new Date().toDateString();
    const usedToday = this.postLogs
      .filter((log) => new Date(log.createdAt).toDateString() === today)
      .map((log) => log.topic);

    return topics.filter(
      (t) => !usedToday.includes(t.keyword) && !this.isTopicPermanentlyUsed(t.keyword),
    ).length;
  }

  getTotalTopicsCount(): number {
    return this.getTopics().length;
  }

  addLog(log: TechAutoPostLog): void {
    this.postLogs.unshift(log);
    if (this.postLogs.length > 100) {
      this.postLogs = this.postLogs.slice(0, 100);
    }
    this.saveLogs();
  }

  updateLog(id: string, updates: Partial<TechAutoPostLog>): void {
    const index = this.postLogs.findIndex((log) => log.id === id);
    if (index !== -1) {
      this.postLogs[index] = { ...this.postLogs[index], ...updates };
      this.saveLogs();

      // When post is completed, mark topic as permanently used
      if (updates.status === 'completed' && updates.topic) {
        this.markTopicAsPermanentlyUsed(updates.topic);
      }
    }
  }

  getLogs(): TechAutoPostLog[] {
    return [...this.postLogs];
  }

  getTodayLogs(): TechAutoPostLog[] {
    const today = new Date().toDateString();
    return this.postLogs.filter((log) => new Date(log.createdAt).toDateString() === today);
  }

  getTodayPostCount(): number {
    return this.getTodayLogs().filter((log) => log.status === 'completed').length;
  }

  canPostToday(): boolean {
    return this.getTodayPostCount() < this.config.dailyLimit;
  }

  private saveLogs(): void {
    localStorage.setItem('tech_auto_post_logs', JSON.stringify(this.postLogs));
  }

  getLastRefreshed(): Date | null {
    return this.topicsLastRefreshed;
  }

  forceRefreshTopics(): void {
    this.shuffleTopics();
    this.topicsLastRefreshed = new Date();
    this.saveTopics();
  }

  private getTrendingTopics(): TechTopic[] {
    const now = new Date();

    return [
      ...this.getTrendingNowTopics(now),
      ...this.getCoreTechTopics(now),
      ...this.getCategoryTopics(now),
      ...this.getEvergreenTopics(now),
    ];
  }

  private getTrendingNowTopics(now: Date): TechTopic[] {
    return [
      {
        id: 'grok-4-2026-' + now.getTime(),
        keyword: 'Grok 4 Released: xAI Most Powerful AI Model Beats GPT-5 and Gemini 3',
        category: 'Artificial Intelligence',
        subcategory: 'xAI Grok',
        trendScore: 100,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
      {
        id: 'ai-agents-2026-' + now.getTime(),
        keyword: 'AI Agents 2026: How Autonomous AI is Transforming Every Industry',
        category: 'Artificial Intelligence',
        subcategory: 'AI Agents',
        trendScore: 98,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
      {
        id: 'openai-o4-ultra-' + now.getTime(),
        keyword: 'OpenAI o4 Ultra: The New Frontier in Artificial General Intelligence 2026',
        category: 'Artificial Intelligence',
        subcategory: 'OpenAI',
        trendScore: 98,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
      {
        id: 'apple-intelligence-2026-' + now.getTime(),
        keyword: 'Apple Intelligence 3.0: Revolutionary AI Features Coming to iOS 19',
        category: 'Artificial Intelligence',
        subcategory: 'Apple',
        trendScore: 97,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
      {
        id: 'nvidia-rtx-5090-super-' + now.getTime(),
        keyword: 'NVIDIA RTX 5090 Super Review: The Definitive GPU of 2026',
        category: 'Hardware',
        subcategory: 'NVIDIA',
        trendScore: 96,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
      {
        id: 'samsung-galaxy-s26-ultra-' + now.getTime(),
        keyword: 'Samsung Galaxy S26 Ultra Review: Flagship Android Experience 2026',
        category: 'Mobile',
        subcategory: 'Samsung',
        trendScore: 95,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
      {
        id: 'ios-19-release-' + now.getTime(),
        keyword: 'iOS 19 Official: 25 Game-Changing Features Apple Announced',
        category: 'Mobile OS',
        subcategory: 'iOS',
        trendScore: 94,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
      {
        id: 'google-android-16-official-' + now.getTime(),
        keyword: 'Android 16 Stable Release: Everything New in Google Latest OS',
        category: 'Mobile OS',
        subcategory: 'Android',
        trendScore: 93,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'tesla-robotaxi-2026-' + now.getTime(),
        keyword: 'Tesla Robotaxi Launch 2026: Real User Experience and Reviews',
        category: 'Automotive Tech',
        subcategory: 'Tesla',
        trendScore: 92,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'apple-vision-pro-3-' + now.getTime(),
        keyword: 'Apple Vision Pro 3 vs Meta Quest 5: The Ultimate AR Headset Comparison',
        category: 'Consumer Tech',
        subcategory: 'Apple',
        trendScore: 91,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
    ];
  }

  private getCoreTechTopics(now: Date): TechTopic[] {
    return [
      {
        id: 'gemini-3-ultra-' + now.getTime(),
        keyword: 'Google Gemini 3.0 Ultra: The Most Advanced Multimodal AI Available 2026',
        category: 'Artificial Intelligence',
        subcategory: 'Google Gemini',
        trendScore: 98,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
      {
        id: 'claude-5-sonnet-' + now.getTime(),
        keyword: 'Claude 5 Sonnet March 2026: Anthropic Next Generation AI Model Review',
        category: 'Artificial Intelligence',
        subcategory: 'Anthropic',
        trendScore: 96,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'humanoid-robots-2026-' + now.getTime(),
        keyword: 'Humanoid Robots 2026: Tesla Optimus Boston Dynamics Atlas Unitree Progress',
        category: 'Robotics',
        subcategory: 'Humanoid',
        trendScore: 95,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'quantum-computing-2026-' + now.getTime(),
        keyword: 'Quantum Computing 2026: IBM Google Microsoft Willow Chip Breakthrough',
        category: 'Emerging Tech',
        subcategory: 'Quantum Computing',
        trendScore: 94,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'meta-quest-5-' + now.getTime(),
        keyword: 'Meta Quest 5 Release 2026: Price Specs Features and Comparison',
        category: 'VR & AR',
        subcategory: 'Meta',
        trendScore: 91,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'foldable-phones-2026-' + now.getTime(),
        keyword: 'Best Foldable Phones March 2026: Samsung Z Fold 7 vs Google Pixel 10 Pro Fold',
        category: 'Mobile',
        subcategory: 'Foldables',
        trendScore: 90,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'robotaxi-2026-' + now.getTime(),
        keyword: 'Robotaxi Services 2026: Waymo One Cruise Baidu Apollo Real World Results',
        category: 'Autonomous Vehicles',
        subcategory: 'Robotaxi',
        trendScore: 92,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'health-wearables-2026-' + now.getTime(),
        keyword: 'Health Wearables March 2026: Apple Watch Ultra 3 Galaxy Ring 2 Blood Sugar',
        category: 'Health Tech',
        subcategory: 'Wearables',
        trendScore: 89,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'ev-batteries-2026-' + now.getTime(),
        keyword: 'Solid State EV Batteries 2026: Toyota Honda Hyundai Game Changing 800 Mile Range',
        category: 'EV Tech',
        subcategory: 'Batteries',
        trendScore: 88,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'macbook-pro-m6-' + now.getTime(),
        keyword: 'MacBook Pro M6 Ultra 2026: Apple Silicon Performance Deep Dive Benchmark',
        category: 'Laptops',
        subcategory: 'Apple',
        trendScore: 91,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
    ];
  }

  private getCategoryTopics(now: Date): TechTopic[] {
    return [
      {
        id: 'cybersecurity-threats-2026-' + now.getTime(),
        keyword: 'Cybersecurity Threats 2026: AI-Powered Attacks and Defense Strategies',
        category: 'Security',
        subcategory: 'Cybersecurity',
        trendScore: 88,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'streaming-wars-2026-' + now.getTime(),
        keyword: 'Streaming Wars 2026: Netflix Disney Plus Max HBO Peacock Apple TV Plus',
        category: 'Entertainment',
        subcategory: 'Streaming',
        trendScore: 85,
        lastUpdated: now,
        viralPotential: 'medium',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'cloud-gaming-2026-' + now.getTime(),
        keyword: 'Cloud Gaming 2026: Xbox GeForce Now PlayStation Portal Performance',
        category: 'Gaming',
        subcategory: 'Cloud Gaming',
        trendScore: 83,
        lastUpdated: now,
        viralPotential: 'medium',
        newsworthy: true,
        searchVolume: 'Medium',
      },
      {
        id: 'wifi-8-guide-' + now.getTime(),
        keyword: 'WiFi 8 Routers 2026: Next Generation Wireless Connectivity',
        category: 'Networking',
        subcategory: 'WiFi',
        trendScore: 82,
        lastUpdated: now,
        viralPotential: 'medium',
        newsworthy: true,
        searchVolume: 'Medium',
      },
      {
        id: 'tech-jobs-2026-' + now.getTime(),
        keyword: 'Tech Jobs 2026: AI Engineer Highest Paying Roles Skills in Demand',
        category: 'Tech Careers',
        subcategory: 'Jobs',
        trendScore: 87,
        lastUpdated: now,
        viralPotential: 'medium',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'programming-2026-' + now.getTime(),
        keyword: 'Best Programming Languages 2026: Python Rust JavaScript Developer Guide',
        category: 'Development',
        subcategory: 'Programming',
        trendScore: 88,
        lastUpdated: now,
        viralPotential: 'medium',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'ai-privacy-2026-' + now.getTime(),
        keyword: 'AI Privacy 2026: How Tech Companies Use Your Data Legal Framework',
        category: 'AI Ethics',
        subcategory: 'Privacy',
        trendScore: 86,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'satellite-internet-2026-' + now.getTime(),
        keyword: 'Starlink vs Amazon Kuiper vs OneWeb 2026: Satellite Internet Comparison',
        category: 'Space Tech',
        subcategory: 'Satellite Internet',
        trendScore: 84,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'smart-home-2026-' + now.getTime(),
        keyword: 'Matter Smart Home 2026: Complete Setup Guide Best Devices Integration',
        category: 'Smart Home',
        subcategory: 'Matter Protocol',
        trendScore: 82,
        lastUpdated: now,
        viralPotential: 'medium',
        newsworthy: true,
        searchVolume: 'Medium',
      },
      {
        id: '5g-6g-2026-' + now.getTime(),
        keyword: '5G Advanced 6G 2026: Real World Speeds Coverage Expectations',
        category: 'Connectivity',
        subcategory: '5G',
        trendScore: 83,
        lastUpdated: now,
        viralPotential: 'medium',
        newsworthy: true,
        searchVolume: 'Medium',
      },
    ];
  }

  private getEvergreenTopics(now: Date): TechTopic[] {
    return [
      {
        id: 'ai-tools-guide-2026-' + now.getTime(),
        keyword: 'Best AI Tools 2026: Complete Guide to Boost Productivity 10x',
        category: 'Artificial Intelligence',
        subcategory: 'AI Tools',
        trendScore: 90,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'Very High',
      },
      {
        id: 'build-pc-guide-2026-' + now.getTime(),
        keyword: 'How to Build a PC 2026: Complete Step by Step Guide Best Components',
        category: 'Hardware',
        subcategory: 'PC Building',
        trendScore: 86,
        lastUpdated: now,
        viralPotential: 'high',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'data-recovery-2026-' + now.getTime(),
        keyword: 'Data Recovery Guide 2026: How to Recover Lost Files Photos SSD',
        category: 'Security',
        subcategory: 'Data Recovery',
        trendScore: 80,
        lastUpdated: now,
        viralPotential: 'medium',
        newsworthy: false,
        searchVolume: 'Medium',
      },
      {
        id: 'gaming-setup-2026-' + now.getTime(),
        keyword: 'Best Gaming Setup 2026: Ultimate Guide Every Budget RGB Peripherals',
        category: 'Gaming',
        subcategory: 'Gaming Setup',
        trendScore: 84,
        lastUpdated: now,
        viralPotential: 'medium',
        newsworthy: true,
        searchVolume: 'High',
      },
      {
        id: 'home-office-2026-' + now.getTime(),
        keyword: 'Best Home Office Setup 2026: Complete Guide Remote Work Ergonomics',
        category: 'Productivity',
        subcategory: 'Home Office',
        trendScore: 82,
        lastUpdated: now,
        viralPotential: 'medium',
        newsworthy: true,
        searchVolume: 'Medium',
      },
    ];
  }
}
