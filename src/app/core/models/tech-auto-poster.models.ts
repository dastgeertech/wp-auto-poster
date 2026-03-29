export interface TechTopic {
  id: string;
  keyword: string;
  category: string;
  subcategory: string;
  trendScore: number;
  lastUpdated: Date;
  viralPotential: 'high' | 'medium' | 'low';
  newsworthy: boolean;
  searchVolume: string;
}

export interface TechAutoPostConfig {
  enabled: boolean;
  dailyLimit: number;
  postTime: string;
  timezone: string;
  categories: number[];
  tags: number[];
  autoAddImages: boolean;
  seoScoreTarget: number;
  includeSchemaMarkup: boolean;
  submitToNewsSitemap: boolean;
}

export interface TechAutoPostLog {
  id: string;
  topic: string;
  title: string;
  status: 'pending' | 'generating' | 'optimizing' | 'publishing' | 'completed' | 'failed';
  seoScore: number;
  postUrl?: string;
  postId?: number;
  error?: string;
  createdAt: Date;
  publishedAt?: Date;
}

export const DEFAULT_TECH_AUTO_POST_CONFIG: TechAutoPostConfig = {
  enabled: false,
  dailyLimit: 1,
  postTime: '09:00',
  timezone: 'UTC',
  categories: [],
  tags: [],
  autoAddImages: true,
  seoScoreTarget: 90,
  includeSchemaMarkup: true,
  submitToNewsSitemap: true,
};
