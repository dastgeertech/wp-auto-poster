export interface WordPressPostTitle {
  rendered: string;
  raw?: string;
}

export interface WordPressPostContent {
  rendered: string;
  raw?: string;
}

export interface WordPressPost {
  id?: number;
  title: string | WordPressPostTitle;
  content: string | WordPressPostContent;
  status: 'draft' | 'publish' | 'future' | 'pending';
  categories: number[];
  tags: number[];
  featured_media?: number;
  meta?: {
    _rank_math_focus_keyword?: string;
    _rank_math_title?: string;
    _rank_math_description?: string;
    _rank_math_seo_score?: string;
    _rank_math_robots?: string;
    _rank_math_canonical_url?: string;
    _yoast_wpseo_focuskw?: string;
    _yoast_wpseo_metadesc?: string;
    _yoast_wpseo_title?: string;
    _aioseo_description?: string;
    _aioseo_title?: string;
  };
  date?: string;
  slug?: string;
  excerpt?: string;
}

export interface SeoAnalysis {
  score: number;
  focusKeyword: string;
  titleHasKeyword: boolean;
  firstParagraphHasKeyword: boolean;
  keywordDensity: number;
  metaDescriptionLength: number;
  hasMetaDescription: boolean;
  contentLength: number;
  headingCount: number;
  hasImages: boolean;
  imageAltText: boolean;
  internalLinks: number;
  externalLinks: number;
  readabilityScore: number;
  suggestions: string[];
  urlHasKeyword: boolean;
}

export interface ScheduledPost {
  id: string;
  post: WordPressPost;
  scheduledTime: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  createdAt: Date;
  publishedAt?: Date;
  error?: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressMedia {
  id: number;
  source_url: string;
  alt_text: string;
  title: string;
}

export interface AppSettings {
  wordpress: {
    apiUrl: string;
    username: string;
    appPassword: string;
    siteName: string;
    siteDescription: string;
    siteLogo: string;
  };
  ai: {
    openaiApiKey: string;
    groqApiKey?: string;
    geminiApiKey?: string;
    anthropicApiKey?: string;
    defaultTone: 'professional' | 'casual' | 'educational' | 'persuasive';
    defaultWordCount: number;
  };
  images: {
    provider: 'google' | 'custom';
    googleApiKey: string;
    googleCx: string;
    unsplashApiKey: string;
    pexelsApiKey: string;
    pixabayApiKey: string;
    bingApiKey?: string;
  };
  scheduling: {
    defaultPostTime: string;
    timezone: string;
    enableAutoPost: boolean;
  };
  seo: {
    targetScore: number;
    defaultCategory: number;
    defaultTags: number[];
  };
  website: {
    siteUrl: string;
    siteName: string;
    tagline: string;
    description: string;
    author: string;
    publisher: string;
    logoUrl: string;
    faviconUrl: string;
    social: {
      twitter: string;
      facebook: string;
      instagram: string;
      linkedin: string;
      youtube: string;
    };
  };
  google: {
    searchConsoleVerified: boolean;
    analyticsId: string;
    adsenseId: string;
    newsPublicationName: string;
  };
}

export interface PostStats {
  totalPosts: number;
  todayPosts: number;
  scheduledPosts: number;
  averageSeoScore: number;
}

export interface ContentOptions {
  keyword: string;
  tone: 'professional' | 'casual' | 'educational' | 'persuasive';
  wordCount: number;
  template: 'article' | 'listicle' | 'howto' | 'review' | 'news';
  includeImages: boolean;
}

export interface GeneratedContent {
  title: string;
  content: string;
  metaDescription: string;
  focusKeyword: string;
  suggestedTags: string[];
  featuredImage: StockImage | null;
  contentImages: StockImage[];
  images: string[];
  specs: {
    processor?: string;
    display?: string;
    camera?: string;
    battery?: string;
    ram?: string;
    storage?: string;
    price?: string;
    releaseDate?: string;
  }[];
  schemaMarkup?: {
    newsArticle: string;
    breadcrumb: string;
    webPage: string;
  };
}

export interface StockImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  altText: string;
  photographer: string;
  photographerUrl: string;
  source: 'google' | 'custom';
}

export * from './tech-auto-poster.models';
