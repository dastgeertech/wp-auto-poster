import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface SocialAccount {
  id: string;
  platform: 'twitter' | 'linkedin' | 'facebook';
  username: string;
  connected: boolean;
  accessToken?: string;
}

export interface SocialPost {
  platform: 'twitter' | 'linkedin' | 'facebook';
  content: string;
  url?: string;
  imageUrl?: string;
}

export interface SocialPostResult {
  platform: string;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SocialAutoPostService {
  private accounts: SocialAccount[] = [
    { id: '1', platform: 'twitter', username: '@yourbrand', connected: false },
    { id: '2', platform: 'linkedin', username: 'Your Brand', connected: false },
    { id: '3', platform: 'facebook', username: 'YourBrand', connected: false },
  ];

  constructor() {
    this.loadAccounts();
  }

  private loadAccounts(): void {
    try {
      const saved = localStorage.getItem('social_accounts');
      if (saved) {
        this.accounts = JSON.parse(saved);
      }
    } catch (e) {}
  }

  private saveAccounts(): void {
    localStorage.setItem('social_accounts', JSON.stringify(this.accounts));
  }

  getAccounts(): SocialAccount[] {
    return this.accounts;
  }

  getConnectedAccounts(): SocialAccount[] {
    return this.accounts.filter((a) => a.connected);
  }

  connectAccount(platform: 'twitter' | 'linkedin' | 'facebook'): void {
    const account = this.accounts.find((a) => a.platform === platform);
    if (account) {
      account.connected = true;
      account.accessToken = 'mock_token_' + Date.now();
      this.saveAccounts();
    }
  }

  disconnectAccount(platform: 'twitter' | 'linkedin' | 'facebook'): void {
    const account = this.accounts.find((a) => a.platform === platform);
    if (account) {
      account.connected = false;
      account.accessToken = undefined;
      this.saveAccounts();
    }
  }

  autoPost(post: SocialPost): Observable<SocialPostResult[]> {
    const results: SocialPostResult[] = [];
    const connectedAccounts = this.getConnectedAccounts();

    for (const account of connectedAccounts) {
      if (post.platform === account.platform) {
        results.push(this.simulatePost(account.platform, post.content, post.url));
      }
    }

    return of(results);
  }

  private simulatePost(
    platform: 'twitter' | 'linkedin' | 'facebook',
    content: string,
    url?: string,
  ): SocialPostResult {
    let fullContent = content;
    if (url) {
      if (platform === 'twitter' && content.length < 240) {
        fullContent = content + ' ' + url;
      } else {
        fullContent = content + '\n\nRead more: ' + url;
      }
    }

    const postId = 'post_' + Date.now() + '_' + platform;
    const baseUrl = this.getPlatformBaseUrl(platform);

    return {
      platform,
      success: true,
      postId,
      postUrl: `${baseUrl}/${postId}`,
    };
  }

  private getPlatformBaseUrl(platform: string): string {
    switch (platform) {
      case 'twitter':
        return 'https://twitter.com/i/web/status';
      case 'linkedin':
        return 'https://linkedin.com/posts';
      case 'facebook':
        return 'https://facebook.com';
      default:
        return '';
    }
  }

  generateShareContent(
    title: string,
    keyword: string,
    platform: 'twitter' | 'linkedin' | 'facebook',
  ): string {
    switch (platform) {
      case 'twitter':
        return `New article: ${title}\n\n#${keyword.replace(/\s+/g, '')} #Tech #Blog`;
      case 'linkedin':
        return `I just published a new article: "${title}"\n\nThis covers the latest insights on ${keyword}. Would love to hear your thoughts!\n\n#${keyword.replace(/\s+/g, '')} #Technology #ThoughtLeadership`;
      case 'facebook':
        return `Check out my latest article: "${title}"!\n\nDiving deep into ${keyword} and sharing everything I've learned. Link in comments.`;
      default:
        return `New article: ${title}`;
    }
  }
}
