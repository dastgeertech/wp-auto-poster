import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = signal<Notification[]>([]);
  notifications$ = this.notificationsSubject.asReadonly();

  private readonly MAX_NOTIFICATIONS = 10;
  private readonly DEFAULT_DURATION = 5000;

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        const notifications = JSON.parse(saved);
        this.notificationsSubject.set(notifications);
      }
    } catch (e) {}
  }

  private saveNotifications(): void {
    try {
      const notifications = this.notificationsSubject();
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (e) {}
  }

  private generateId(): string {
    return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.notificationsSubject.update((notifications) => {
      const updated = [newNotification, ...notifications].slice(0, this.MAX_NOTIFICATIONS);
      this.saveNotifications();
      return updated;
    });

    if (notification.duration !== 0) {
      setTimeout(() => {
        this.dismiss(newNotification.id);
      }, notification.duration || this.DEFAULT_DURATION);
    }

    return newNotification;
  }

  success(title: string, message?: string, options?: Partial<Notification>): Notification {
    return this.addNotification({ type: 'success', title, message, ...options });
  }

  error(title: string, message?: string, options?: Partial<Notification>): Notification {
    return this.addNotification({
      type: 'error',
      title,
      message,
      duration: options?.duration ?? 8000,
      ...options,
    });
  }

  warning(title: string, message?: string, options?: Partial<Notification>): Notification {
    return this.addNotification({ type: 'warning', title, message, ...options });
  }

  info(title: string, message?: string, options?: Partial<Notification>): Notification {
    return this.addNotification({ type: 'info', title, message, ...options });
  }

  dismiss(id: string): void {
    this.notificationsSubject.update((notifications) => notifications.filter((n) => n.id !== id));
    this.saveNotifications();
  }

  dismissAll(): void {
    this.notificationsSubject.set([]);
    this.saveNotifications();
  }

  getNotification(id: string): Notification | undefined {
    return this.notificationsSubject().find((n) => n.id === id);
  }

  clearHistory(): void {
    this.notificationsSubject.set([]);
    localStorage.removeItem('notifications');
  }

  getRecentNotifications(count: number = 10): Notification[] {
    return this.notificationsSubject().slice(0, count);
  }

  getNotificationsByType(type: Notification['type']): Notification[] {
    return this.notificationsSubject().filter((n) => n.type === type);
  }

  getNotificationCount(): number {
    return this.notificationsSubject().length;
  }

  showPublishSuccess(postTitle: string): Notification {
    return this.success('Post Published', `"${postTitle}" has been published successfully!`, {
      action: {
        label: 'View Post',
        callback: () => {
          window.open('/', '_blank');
        },
      },
    });
  }

  showPublishError(postTitle: string, error: string): Notification {
    return this.error('Publish Failed', `Failed to publish "${postTitle}": ${error}`);
  }

  showGenerationComplete(keyword: string, seoScore: number): Notification {
    return this.success(
      'Content Generated',
      `Article for "${keyword}" is ready with SEO score: ${seoScore}%`,
    );
  }

  showBulkComplete(count: number): Notification {
    return this.success('Bulk Generation Complete', `${count} articles generated successfully!`);
  }

  showSocialPostSuccess(platform: string): Notification {
    return this.success('Social Post', `Posted to ${platform} successfully!`);
  }

  showApiKeySaved(provider: string): Notification {
    return this.success('API Key Saved', `${provider} API key has been saved.`);
  }

  showQuotaWarning(provider: string): Notification {
    return this.warning(
      'Quota Warning',
      `${provider} API quota is running low. Consider switching providers.`,
      { duration: 10000 },
    );
  }
}
