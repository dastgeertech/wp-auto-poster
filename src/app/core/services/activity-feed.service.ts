import { Injectable, signal } from '@angular/core';

export interface Activity {
  id: string;
  type: 'post' | 'ai' | 'social' | 'seo' | 'system' | 'error';
  action: string;
  details?: string;
  timestamp: Date;
  icon?: string;
  color?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  color: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityFeedService {
  private activities = signal<Activity[]>([]);
  private maxActivities = 100;

  constructor() {
    this.loadActivities();
    this.addSystemActivity('Application started');
  }

  private loadActivities(): void {
    try {
      const saved = localStorage.getItem('activities');
      if (saved) {
        const parsed = JSON.parse(saved).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
        this.activities.set(parsed);
      }
    } catch (e) {
      this.activities.set([]);
    }
  }

  private saveActivities(): void {
    try {
      const limited = this.activities().slice(0, this.maxActivities);
      localStorage.setItem('activities', JSON.stringify(limited));
    } catch (e) {}
  }

  private generateId(): string {
    return 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getActivities(): Activity[] {
    return this.activities();
  }

  getRecentActivities(count: number = 20): Activity[] {
    return this.activities().slice(0, count);
  }

  getActivitiesByType(type: Activity['type']): Activity[] {
    return this.activities().filter((a) => a.type === type);
  }

  addActivity(
    type: Activity['type'],
    action: string,
    details?: string,
    options?: { icon?: string; color?: string },
  ): Activity {
    const activity: Activity = {
      id: this.generateId(),
      type,
      action,
      details,
      timestamp: new Date(),
      icon: options?.icon || this.getDefaultIcon(type),
      color: options?.color || this.getDefaultColor(type),
    };

    this.activities.update((activities) => [activity, ...activities].slice(0, this.maxActivities));
    this.saveActivities();

    return activity;
  }

  addPostActivity(action: string, details?: string): Activity {
    return this.addActivity('post', action, details, { icon: 'article', color: '#e94560' });
  }

  addAIActivity(action: string, details?: string): Activity {
    return this.addActivity('ai', action, details, { icon: 'psychology', color: '#9c27b0' });
  }

  addSocialActivity(action: string, details?: string): Activity {
    return this.addActivity('social', action, details, { icon: 'share', color: '#2196f3' });
  }

  addSEOActivity(action: string, details?: string): Activity {
    return this.addActivity('seo', action, details, { icon: 'trending_up', color: '#00d9a5' });
  }

  addSystemActivity(action: string, details?: string): Activity {
    return this.addActivity('system', action, details, { icon: 'settings', color: '#666' });
  }

  addErrorActivity(action: string, details?: string): Activity {
    return this.addActivity('error', action, details, { icon: 'error', color: '#ff6b6b' });
  }

  clearActivities(): void {
    this.activities.set([]);
    this.saveActivities();
  }

  private getDefaultIcon(type: Activity['type']): string {
    const icons: Record<Activity['type'], string> = {
      post: 'article',
      ai: 'psychology',
      social: 'share',
      seo: 'trending_up',
      system: 'settings',
      error: 'error',
    };
    return icons[type];
  }

  private getDefaultColor(type: Activity['type']): string {
    const colors: Record<Activity['type'], string> = {
      post: '#e94560',
      ai: '#9c27b0',
      social: '#2196f3',
      seo: '#00d9a5',
      system: '#666',
      error: '#ff6b6b',
    };
    return colors[type];
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  getQuickActions(): QuickAction[] {
    return [
      {
        id: 'new-post',
        label: 'New Post',
        icon: 'add',
        route: '/create',
        color: '#e94560',
        description: 'Create a new article',
      },
      {
        id: 'ai-generate',
        label: 'AI Generate',
        icon: 'auto_awesome',
        route: '/ai-auto-poster',
        color: '#9c27b0',
        description: 'Generate content with AI',
      },
      {
        id: 'schedule',
        label: 'Schedule',
        icon: 'schedule',
        route: '/content-calendar',
        color: '#ffc107',
        description: 'Plan your content',
      },
      {
        id: 'bulk-import',
        label: 'Bulk Import',
        icon: 'library_add',
        route: '/ai-auto-poster',
        color: '#2196f3',
        description: 'Import keywords',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'analytics',
        route: '/analytics',
        color: '#00d9a5',
        description: 'View performance',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        route: '/settings',
        color: '#666',
        description: 'Configure app',
      },
    ];
  }

  getActivityStats(): { type: Activity['type']; count: number; color: string }[] {
    const counts: Record<string, number> = {};
    const colors: Record<Activity['type'], string> = {
      post: '#e94560',
      ai: '#9c27b0',
      social: '#2196f3',
      seo: '#00d9a5',
      system: '#666',
      error: '#ff6b6b',
    };

    this.activities().forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });

    return Object.entries(counts).map(([type, count]) => ({
      type: type as Activity['type'],
      count,
      color: colors[type as Activity['type']] || '#666',
    }));
  }
}
