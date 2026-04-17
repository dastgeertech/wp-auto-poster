import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError, forkJoin } from 'rxjs';
import { map, catchError, tap, retry, timeout, concatMap } from 'rxjs/operators';
import {
  WordPressPost,
  WordPressCategory,
  WordPressTag,
  WordPressMedia,
  AppSettings,
} from '../models';

export interface PublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
}

export interface WordPressSiteInfo {
  name: string;
  description: string;
  url: string;
  homeUrl: string;
  plugins: string[];
}

@Injectable({
  providedIn: 'root',
})
export class WordPressService {
  private settingsSubject = new BehaviorSubject<AppSettings | null>(null);
  settings$ = this.settingsSubject.asObservable();

  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  isConnected$ = this.isConnectedSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<WordPressCategory[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  private tagsSubject = new BehaviorSubject<WordPressTag[]>([]);
  tags$ = this.tagsSubject.asObservable();

  private siteInfoSubject = new BehaviorSubject<WordPressSiteInfo | null>(null);
  siteInfo$ = this.siteInfoSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSettings();
  }

  private loadSettings(): void {
    const stored = localStorage.getItem('wp_settings');
    if (stored) {
      const settings = JSON.parse(stored);
      this.settingsSubject.next(settings);
      if (
        settings.wordpress?.apiUrl &&
        settings.wordpress?.username &&
        settings.wordpress?.appPassword
      ) {
        this.isConnectedSubject.next(true);
        this.fetchCategories();
        this.fetchTags();
        this.fetchSiteInfo();
      }
    }
  }

  saveSettings(settings: AppSettings): void {
    localStorage.setItem('wp_settings', JSON.stringify(settings));
    this.settingsSubject.next(settings);

    // Save social share settings to WordPress
    if (settings.wordpress?.apiUrl && settings.wordpress?.appPassword) {
      this.saveSocialShareSettings(settings);
    }
  }

  private saveSocialShareSettings(settings: AppSettings): void {
    const socialSettings = settings.social;
    if (!socialSettings) return;

    const credentials = btoa(`${settings.wordpress.username}:${settings.wordpress.appPassword}`);
    const headers = new HttpHeaders({
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    });

    const apiUrl = settings.wordpress.apiUrl;

    // Save all social share options to WordPress
    const options = [
      { name: 'dastgeer_auto_share_enabled', value: socialSettings.autoShareEnabled ? '1' : '0' },
      { name: 'dastgeer_share_facebook', value: socialSettings.shareFacebook ? '1' : '0' },
      { name: 'dastgeer_share_twitter', value: socialSettings.shareTwitter ? '1' : '0' },
      { name: 'dastgeer_share_linkedin', value: socialSettings.shareLinkedIn ? '1' : '0' },
      {
        name: 'dastgeer_share_message_template',
        value: socialSettings.shareMessageTemplate || '{title} {url}',
      },
      { name: 'dastgeer_facebook_app_id', value: socialSettings.facebookAppId || '' },
      { name: 'dastgeer_facebook_app_secret', value: socialSettings.facebookAppSecret || '' },
      { name: 'dastgeer_facebook_access_token', value: socialSettings.facebookAccessToken || '' },
      { name: 'dastgeer_facebook_page_id', value: socialSettings.facebookPageId || '' },
      { name: 'dastgeer_twitter_bearer_token', value: socialSettings.twitterBearerToken || '' },
      { name: 'dastgeer_twitter_api_key', value: socialSettings.twitterApiKey || '' },
      { name: 'dastgeer_twitter_api_secret', value: socialSettings.twitterApiSecret || '' },
      { name: 'dastgeer_twitter_access_token', value: socialSettings.twitterAccessToken || '' },
      { name: 'dastgeer_twitter_access_secret', value: socialSettings.twitterAccessSecret || '' },
      { name: 'dastgeer_linkedin_client_id', value: socialSettings.linkedinClientId || '' },
      { name: 'dastgeer_linkedin_client_secret', value: socialSettings.linkedinClientSecret || '' },
      { name: 'dastgeer_linkedin_access_token', value: socialSettings.linkedinAccessToken || '' },
      { name: 'dastgeer_twitter_url', value: settings.website?.social?.twitter || '' },
      { name: 'dastgeer_facebook_url', value: settings.website?.social?.facebook || '' },
      { name: 'dastgeer_linkedin_url', value: settings.website?.social?.linkedin || '' },
      { name: 'dastgeer_instagram_url', value: settings.website?.social?.instagram || '' },
      { name: 'dastgeer_youtube_url', value: settings.website?.social?.youtube || '' },
      { name: 'dastgeer_organization_logo', value: settings.website?.logoUrl || '' },
      { name: 'dastgeer_google_api_key', value: settings.images?.googleApiKey || '' },
      { name: 'dastgeer_google_cx', value: settings.images?.googleCx || '' },
      { name: 'dastgeer_pexels_api_key', value: settings.images?.pexelsApiKey || '' },
      { name: 'dastgeer_unsplash_access_key', value: settings.images?.unsplashApiKey || '' },
    ];

    // Send settings to WordPress via REST API
    options.forEach((opt) => {
      this.http
        .post(
          `${apiUrl}/wp-json/dastgeer/v1/settings`,
          { key: opt.name, value: opt.value },
          { headers },
        )
        .subscribe({
          next: () => console.log(`Saved: ${opt.name}`),
          error: (err) => console.error(`Failed to save ${opt.name}:`, err),
        });
    });
  }

  getSettings(): AppSettings | null {
    return this.settingsSubject.getValue();
  }

  getAuthHeader(): HttpHeaders {
    const settings = this.getSettings();
    if (!settings?.wordpress) {
      throw new Error('WordPress settings not configured');
    }
    const credentials = btoa(`${settings.wordpress.username}:${settings.wordpress.appPassword}`);
    return new HttpHeaders({
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    });
  }

  testConnection(): Observable<boolean> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return of(false);
    }

    const headers = new HttpHeaders({
      Authorization:
        'Basic ' + btoa(`${settings.wordpress.username}:${settings.wordpress.appPassword}`),
      'Content-Type': 'application/json',
    });

    return this.http.get(`${settings.wordpress.apiUrl}/wp-json/wp/v2/users/me`, { headers }).pipe(
      timeout(10000),
      retry(1),
      map(() => {
        this.isConnectedSubject.next(true);
        this.fetchCategories();
        this.fetchTags();
        this.fetchSiteInfo();
        return true;
      }),
      catchError((err) => {
        console.error('WordPress connection error:', err);
        this.isConnectedSubject.next(false);
        return of(false);
      }),
    );
  }

  fetchSiteInfo(): void {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) return;

    this.http
      .get<any>(`${settings.wordpress.apiUrl}/wp-json/`, {
        headers: this.getAuthHeader(),
      })
      .subscribe({
        next: (info) => {
          this.siteInfoSubject.next({
            name: info.name,
            description: info.description,
            url: info.url,
            homeUrl: info.home,
            plugins: [],
          });
        },
        error: () => {},
      });
  }

  fetchCategories(): void {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) return;

    this.http
      .get<WordPressCategory[]>(
        `${settings.wordpress.apiUrl}/wp-json/wp/v2/categories?per_page=100`,
        {
          headers: this.getAuthHeader(),
        },
      )
      .subscribe({
        next: (cats) => this.categoriesSubject.next(cats),
        error: () => this.categoriesSubject.next([]),
      });
  }

  fetchTags(): void {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) return;

    this.http
      .get<WordPressTag[]>(`${settings.wordpress.apiUrl}/wp-json/wp/v2/tags?per_page=100`, {
        headers: this.getAuthHeader(),
      })
      .subscribe({
        next: (tags) => this.tagsSubject.next(tags),
        error: () => this.tagsSubject.next([]),
      });
  }

  fetchAllPosts(perPage: number = 100): Observable<any[]> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return of([]);
    }
    return this.http
      .get<
        any[]
      >(`${settings.wordpress.apiUrl}/wp-json/wp/v2/posts?per_page=${perPage}&status=publish`, { headers: this.getAuthHeader() })
      .pipe(catchError(() => of([])));
  }

  fetchAllPages(perPage: number = 100): Observable<any[]> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return of([]);
    }
    return this.http
      .get<
        any[]
      >(`${settings.wordpress.apiUrl}/wp-json/wp/v2/pages?per_page=${perPage}&status=publish`, { headers: this.getAuthHeader() })
      .pipe(catchError(() => of([])));
  }

  fetchAllCategories(perPage: number = 100): Observable<any[]> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return of([]);
    }
    return this.http
      .get<
        any[]
      >(`${settings.wordpress.apiUrl}/wp-json/wp/v2/categories?per_page=${perPage}`, { headers: this.getAuthHeader() })
      .pipe(catchError(() => of([])));
  }

  getSiteUrl(): string {
    const settings = this.getSettings();
    return settings?.wordpress?.apiUrl?.replace('/wp-json', '') || '';
  }

  fetchAllContent(): Observable<{ posts: any[]; pages: any[]; categories: any[]; tags: any[] }> {
    return new Observable((observer) => {
      const posts$ = this.fetchAllPosts(100);
      const pages$ = this.fetchAllPages(50);
      const categories$ = this.fetchAllCategories(50);

      let posts: any[] = [];
      let pages: any[] = [];
      let categories: any[] = [];
      let completed = 0;

      const checkComplete = () => {
        completed++;
        if (completed === 3) {
          if (posts.length === 0 && pages.length === 0 && categories.length === 0) {
            observer.error(
              new Error(
                'CORS_ERROR: Please add CORS headers to your WordPress site. See CORS-FIX-INSTRUCTIONS.txt',
              ),
            );
          } else {
            observer.next({ posts, pages, categories, tags: [] });
            observer.complete();
          }
        }
      };

      posts$.subscribe({
        next: (p) => {
          posts = p;
          checkComplete();
        },
        error: (err) => {
          console.warn('Posts fetch error:', err);
          checkComplete();
        },
      });

      pages$.subscribe({
        next: (p) => {
          pages = p;
          checkComplete();
        },
        error: () => checkComplete(),
      });

      categories$.subscribe({
        next: (c) => {
          categories = c;
          checkComplete();
        },
        error: () => checkComplete(),
      });
    });
  }

  createPost(post: WordPressPost): Observable<WordPressPost> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return throwError(
        () =>
          new Error('WordPress not configured. Please add your WordPress site URL in settings.'),
      );
    }

    if (!settings?.wordpress?.username || !settings?.wordpress?.appPassword) {
      return throwError(
        () =>
          new Error(
            'WordPress authentication not configured. Please add your username and application password in settings.',
          ),
      );
    }

    // Validate post content
    const titleStr = typeof post.title === 'string' ? post.title : post.title?.rendered || '';
    const contentStr =
      typeof post.content === 'string' ? post.content : post.content?.rendered || '';

    if (!titleStr || titleStr.trim().length === 0) {
      return throwError(() => new Error('Post title is required'));
    }

    if (!contentStr || contentStr.trim().length === 0) {
      return throwError(() => new Error('Post content is required'));
    }

    const postData: any = {
      title: titleStr.trim(),
      content: contentStr,
      status: post.status || 'draft',
      categories: post.categories && post.categories.length > 0 ? post.categories : [1],
      tags: post.tags && post.tags.length > 0 ? post.tags : [],
    };

    if (post.slug) {
      // Sanitize slug
      const sanitizedSlug = post.slug
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      postData.slug = sanitizedSlug || this.generateSlug(post.title);
    } else {
      postData.slug = this.generateSlug(post.title);
    }

    if (post.date) {
      // Validate date format
      const postDate = new Date(post.date);
      if (!isNaN(postDate.getTime())) {
        postData.date = post.date;
      }
    }

    if (post.featured_media) {
      postData.featured_media = post.featured_media;
    }

    if (post.meta) {
      const focusKeyword = post.meta._rank_math_focus_keyword || '';
      const seoTitle = post.meta._rank_math_title || `%title% - ${focusKeyword}`;
      const seoDesc = post.meta._rank_math_description || '';

      postData.meta = {
        _rank_math_focus_keyword: focusKeyword,
        _rank_math_title: seoTitle,
        _rank_math_description: seoDesc,
        _rank_math_seo_score: post.meta._rank_math_seo_score || '0',
        _rank_math_robots: post.meta._rank_math_robots || 'a:1:{i:0;s:3:"all";}',
        _rank_math_canonical_url: post.meta._rank_math_canonical_url || '',
        _rank_math_paragraphs: 'a:1:{i:0;s:17:"content_with_heading";}',
        _yoast_wpseo_focuskw: focusKeyword,
        _yoast_wpseo_metadesc: seoDesc,
        _yoast_wpseo_title: seoTitle,
        _aioseo_description: seoDesc,
        _aioseo_title: seoTitle,
      };
    }

    if (post.excerpt) {
      const excerptValue = post.excerpt as any;
      const excerptStr =
        typeof excerptValue === 'string' ? excerptValue : excerptValue?.rendered || '';
      postData.excerpt = { rendered: String(excerptStr).trim() };
    }

    return this.http
      .post<WordPressPost>(`${settings.wordpress.apiUrl}/wp-json/wp/v2/posts`, postData, {
        headers: this.getAuthHeader(),
      })
      .pipe(
        timeout(45000),
        catchError((err) => {
          console.error('Failed to create post:', err);
          let errorMessage = 'Failed to publish post';

          if (err.status === 401) {
            errorMessage =
              'WordPress authentication failed. Please check your username and application password.';
          } else if (err.status === 403) {
            errorMessage =
              'Access denied. Your application password may not have sufficient permissions.';
          } else if (err.status === 404) {
            errorMessage = 'WordPress REST API not found. Ensure pretty permalinks are enabled.';
          } else if (err.status === 429) {
            errorMessage = 'Too many requests. Please wait and try again.';
          } else if (err.message) {
            errorMessage = err.message;
          }

          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  publishArticle(
    title: string,
    content: string,
    options?: {
      keyword?: string;
      metaDescription?: string;
      categories?: number[];
      tags?: string[];
      status?: 'publish' | 'draft' | 'future';
      scheduledDate?: Date;
      featuredImageUrl?: string;
      seoScore?: number;
    },
  ): Observable<PublishResult> {
    return new Observable((observer) => {
      const settings = this.getSettings();
      if (!settings?.wordpress?.apiUrl) {
        observer.next({ success: false, error: 'WordPress not configured' });
        observer.complete();
        return;
      }

      let fullContent = content;

      if (options?.featuredImageUrl) {
        this.uploadImageFromUrl(options.featuredImageUrl, title).subscribe({
          next: (media) => {
            this.createPostWithImage(title, fullContent, media.id, options);
          },
          error: () => {
            this.createPostWithoutImage(title, fullContent, options);
          },
        });
      } else {
        this.createPostWithoutImage(title, fullContent, options);
      }
    });
  }

  private createPostWithImage(
    title: string,
    content: string,
    featuredMediaId: number,
    options?: any,
  ): void {
    this.createPost({
      title,
      content,
      status: options?.status || 'draft',
      slug: this.generateSlug(title),
      categories: options?.categories,
      tags: options?.tags,
      featured_media: featuredMediaId,
      meta: this.generateMeta(options?.keyword, options?.metaDescription, options?.seoScore),
      date: options?.scheduledDate?.toISOString(),
    }).subscribe({
      next: (post) => {
        console.log('Post created with image:', post);
      },
      error: (err) => {
        console.error('Failed to create post with image:', err);
      },
    });
  }

  private createPostWithoutImage(title: string, content: string, options?: any): void {
    this.createPost({
      title,
      content,
      status: options?.status || 'draft',
      slug: this.generateSlug(title),
      categories: options?.categories,
      tags: options?.tags,
      meta: this.generateMeta(options?.keyword, options?.metaDescription, options?.seoScore),
      date: options?.scheduledDate?.toISOString(),
    }).subscribe({
      next: (post) => {
        console.log('Post created:', post);
      },
      error: (err) => {
        console.error('Failed to create post:', err);
      },
    });
  }

  private generateSlug(title: string | { rendered: string; raw?: string }): string {
    const titleStr = typeof title === 'string' ? title : title.rendered;
    return titleStr
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  private generateMeta(keyword?: string, description?: string, seoScore?: number): any {
    const meta: any = {};

    if (keyword) {
      meta._rank_math_focus_keyword = keyword;
      meta._rank_math_title = `%title% - ${keyword} | Ultimate Guide`;
    }

    if (description) {
      meta._rank_math_description = description;
    }

    if (seoScore !== undefined) {
      meta._rank_math_seo_score = seoScore.toString();
    }

    meta._yoast_wpseo_focuskw = keyword || '';
    meta._yoast_wpseo_metadesc = description || '';

    return meta;
  }

  updatePost(id: number, post: Partial<WordPressPost>): Observable<WordPressPost> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return throwError(() => new Error('WordPress not configured'));
    }

    return this.http.put<WordPressPost>(
      `${settings.wordpress.apiUrl}/wp-json/wp/v2/posts/${id}`,
      post,
      { headers: this.getAuthHeader() },
    );
  }

  deletePost(id: number): Observable<void> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return throwError(() => new Error('WordPress not configured'));
    }

    return this.http.delete<void>(
      `${settings.wordpress.apiUrl}/wp-json/wp/v2/posts/${id}?force=true`,
      {
        headers: this.getAuthHeader(),
      },
    );
  }

  getPosts(params?: {
    status?: string;
    per_page?: number;
    page?: number;
    search?: string;
  }): Observable<WordPressPost[]> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return of([]);
    }

    let url = `${settings.wordpress.apiUrl}/wp-json/wp/v2/posts?per_page=${params?.per_page || 10}`;
    if (params?.status) {
      url += `&status=${params.status}`;
    }
    if (params?.page) {
      url += `&page=${params.page}`;
    }
    if (params?.search) {
      url += `&search=${encodeURIComponent(params.search)}`;
    }

    return this.http
      .get<WordPressPost[]>(url, {
        headers: this.getAuthHeader(),
      })
      .pipe(
        timeout(10000),
        catchError(() => of([])),
      );
  }

  getPost(id: number): Observable<WordPressPost> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return throwError(() => new Error('WordPress not configured'));
    }

    return this.http.get<WordPressPost>(`${settings.wordpress.apiUrl}/wp-json/wp/v2/posts/${id}`, {
      headers: this.getAuthHeader(),
    });
  }

  uploadMedia(file: File): Observable<WordPressMedia> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return throwError(() => new Error('WordPress not configured'));
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    return this.http
      .post<WordPressMedia>(`${settings.wordpress.apiUrl}/wp-json/wp/v2/media`, formData, {
        headers: new HttpHeaders({
          Authorization: `Basic ${btoa(`${settings.wordpress.username}:${settings.wordpress.appPassword}`)}`,
        }),
      })
      .pipe(
        timeout(30000),
        catchError((err) => {
          console.error('Media upload error:', err);
          return throwError(
            () => new Error(`Failed to upload image: ${err.message || 'Unknown error'}`),
          );
        }),
      );
  }

  uploadImageFromUrl(imageUrl: string, altText: string): Observable<WordPressMedia> {
    return new Observable((observer) => {
      console.log('Uploading image to WordPress:', imageUrl);

      const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(imageUrl);

      fetch(proxyUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch image: ${res.status}`);
          }
          return res.blob();
        })
        .then((blob) => {
          if (blob.size === 0) {
            throw new Error('Empty image response');
          }
          console.log('Image fetched successfully, size:', blob.size);
          const fileName = this.sanitizeFileName(altText) + '.jpg';
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          this.uploadMedia(file).subscribe({
            next: (media) => {
              console.log('Image uploaded successfully:', media.id);
              observer.next(media);
              observer.complete();
            },
            error: (err) => {
              console.error('Upload failed:', err);
              observer.error(err);
            },
          });
        })
        .catch((err) => {
          console.error('Failed to fetch image:', err);
          observer.error(err);
        });
    });
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50) + '-' + Date.now();
  }

  downloadPlugin(fileName: string): void {
    const link = document.createElement('a');
    link.href = fileName;
    link.download = fileName;
    link.click();
  }

  createCategory(name: string, description?: string): Observable<WordPressCategory> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return throwError(() => new Error('WordPress not configured'));
    }

    return this.http.post<WordPressCategory>(
      `${settings.wordpress.apiUrl}/wp-json/wp/v2/categories`,
      { name, description },
      { headers: this.getAuthHeader() },
    );
  }

  createTag(name: string): Observable<WordPressTag> {
    const settings = this.getSettings();
    if (!settings?.wordpress?.apiUrl) {
      return throwError(() => new Error('WordPress not configured'));
    }

    return this.http.post<WordPressTag>(
      `${settings.wordpress.apiUrl}/wp-json/wp/v2/tags`,
      { name },
      { headers: this.getAuthHeader() },
    );
  }

  getOrCreateTag(name: string): Observable<number> {
    return new Observable((observer) => {
      const existingTags = this.tagsSubject.getValue();
      const existing = existingTags.find((t) => t.name.toLowerCase() === name.toLowerCase());

      if (existing) {
        observer.next(existing.id);
        observer.complete();
        return;
      }

      this.createTag(name).subscribe({
        next: (tag) => {
          this.tagsSubject.next([...existingTags, tag]);
          observer.next(tag.id);
          observer.complete();
        },
        error: (err) => {
          console.error('Failed to create tag:', err);
          observer.error(err);
        },
      });
    });
  }

  getOrCreateCategory(name: string): Observable<number> {
    return new Observable((observer) => {
      const existingCategories = this.categoriesSubject.getValue();
      const existing = existingCategories.find((c) => c.name.toLowerCase() === name.toLowerCase());

      if (existing) {
        observer.next(existing.id);
        observer.complete();
        return;
      }

      this.createCategory(name).subscribe({
        next: (category) => {
          this.categoriesSubject.next([...existingCategories, category]);
          observer.next(category.id);
          observer.complete();
        },
        error: (err) => {
          console.error('Failed to create category:', err);
          observer.error(err);
        },
      });
    });
  }

  createTagsFromKeywords(keywords: string[]): Observable<number[]> {
    return new Observable((observer) => {
      const tagObservables = keywords.map((kw) => this.getOrCreateTag(kw));
      forkJoin(tagObservables).subscribe({
        next: (tagIds) => {
          observer.next(tagIds);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  private generateTagsFromKeyword(keyword: string): string[] {
    const tags: string[] = [keyword];

    const words = keyword.split(/\s+/);
    if (words.length > 1) {
      words.forEach((word) => {
        if (word.length > 3) tags.push(word);
      });
    }

    const commonSuffixes = ['guide', 'tips', '2026', 'best', 'how', 'what', 'why'];
    commonSuffixes.forEach((suffix) => {
      tags.push(`${keyword} ${suffix}`);
    });

    return [...new Set(tags)].slice(0, 8);
  }

  // Proxy methods for AI APIs (bypasses CORS)
  getProxyUrl(): string {
    const settings = this.getSettings();
    if (settings?.wordpress?.apiUrl) {
      return settings.wordpress.apiUrl.replace(/\/$/, '');
    }
    return '';
  }

  // Claude Proxy - SECURE (bypasses CORS and hides API key)
  proxyClaude(body: any, apiKey: string): Observable<any> {
    const baseUrl = this.getProxyUrl();
    if (!baseUrl) {
      return throwError(() => new Error('WordPress URL not configured'));
    }

    const url = `${baseUrl}/wp-json/wp-auto-poster/v1/proxy/claude`;
    return this.http.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Claude-Key': apiKey,
      },
    });
  }

  // Gemini Proxy
  proxyGemini(body: any, apiKey: string): Observable<any> {
    const baseUrl = this.getProxyUrl();
    if (!baseUrl) {
      return throwError(() => new Error('WordPress URL not configured'));
    }

    const url = `${baseUrl}/wp-json/wp-auto-poster/v1/proxy/gemini`;
    return this.http.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': apiKey,
      },
    });
  }

  // OpenAI Proxy
  proxyOpenAI(body: any, apiKey: string): Observable<any> {
    const baseUrl = this.getProxyUrl();
    if (!baseUrl) {
      return throwError(() => new Error('WordPress URL not configured'));
    }

    const url = `${baseUrl}/wp-json/wp-auto-poster/v1/proxy/openai`;
    return this.http.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-OpenAI-Key': apiKey,
      },
    });
  }

  // Groq Proxy
  proxyGroq(body: any, apiKey: string): Observable<any> {
    const baseUrl = this.getProxyUrl();
    if (!baseUrl) {
      return throwError(() => new Error('WordPress URL not configured'));
    }

    const url = `${baseUrl}/wp-json/wp-auto-poster/v1/proxy/groq`;
    return this.http.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Groq-Key': apiKey,
      },
    });
  }

  // Mistral Proxy
  proxyMistral(body: any, apiKey: string): Observable<any> {
    const baseUrl = this.getProxyUrl();
    if (!baseUrl) {
      return throwError(() => new Error('WordPress URL not configured'));
    }

    const url = `${baseUrl}/wp-json/wp-auto-poster/v1/proxy/mistral`;
    return this.http.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Mistral-Key': apiKey,
      },
    });
  }

  // Grok Proxy
  proxyGrok(body: any, apiKey: string): Observable<any> {
    const baseUrl = this.getProxyUrl();
    if (!baseUrl) {
      return throwError(() => new Error('WordPress URL not configured'));
    }

    const url = `${baseUrl}/wp-json/wp-auto-poster/v1/proxy/grok`;
    return this.http.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Grok-Key': apiKey,
      },
    });
  }

  saveApiKeys(keys: { geminiApiKey?: string; openaiApiKey?: string }): Observable<any> {
    const baseUrl = this.getProxyUrl();
    if (!baseUrl) {
      return throwError(() => new Error('WordPress URL not configured'));
    }

    const url = `${baseUrl}/wp-json/wp-auto-poster/v1/settings`;
    return this.http.post(url, keys, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
