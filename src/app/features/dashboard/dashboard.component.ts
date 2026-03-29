import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WordPressService } from '../../core/services/wordpress.service';
import { SchedulerService } from '../../core/services/scheduler.service';
import { PostStats, WordPressPost, WordPressPostTitle, ScheduledPost } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <div class="dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <mat-icon>article</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().totalPosts }}</span>
            <span class="stat-label">Total Posts</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon today">
            <mat-icon>today</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().todayPosts }}</span>
            <span class="stat-label">Today's Posts</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon scheduled">
            <mat-icon>schedule</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().scheduledPosts }}</span>
            <span class="stat-label">Scheduled</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon seo">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().averageSeoScore }}%</span>
            <span class="stat-label">Avg SEO Score</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card recent-posts">
          <div class="card-header">
            <h3>Recent Posts</h3>
            <button mat-button routerLink="/posts">View All</button>
          </div>
          <div class="posts-list">
            @for (post of recentPosts(); track post.id) {
              <div class="post-item">
                <div class="post-info">
                  <span class="post-title">{{ getPostTitle(post.title) }}</span>
                  <span class="post-date">{{ formatDate(post.date) }}</span>
                </div>
                <span class="post-status" [class]="post.status">{{ post.status }}</span>
              </div>
            } @empty {
              <div class="empty-state">
                <mat-icon>inbox</mat-icon>
                <span>No posts yet</span>
              </div>
            }
          </div>
        </div>

        <div class="card scheduled-posts">
          <div class="card-header">
            <h3>Upcoming Scheduled</h3>
            <button mat-button routerLink="/scheduler">View Calendar</button>
          </div>
          <div class="schedule-list">
            @for (scheduled of upcomingScheduled(); track scheduled.id) {
              <div class="schedule-item">
                <div class="schedule-time">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ formatScheduleDate(scheduled.scheduledTime) }}</span>
                </div>
                <span class="schedule-title">{{ scheduled.post.title }}</span>
              </div>
            } @empty {
              <div class="empty-state">
                <mat-icon>event_busy</mat-icon>
                <span>No scheduled posts</span>
              </div>
            }
          </div>
        </div>

        <div class="card quick-actions">
          <div class="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="actions-grid">
            <button class="action-btn" routerLink="/create">
              <mat-icon>add_circle</mat-icon>
              <span>New Post</span>
            </button>
            <button class="action-btn" routerLink="/create" [queryParams]="{ai: true}">
              <mat-icon>auto_awesome</mat-icon>
              <span>AI Generate</span>
            </button>
            <button class="action-btn" routerLink="/scheduler">
              <mat-icon>event</mat-icon>
              <span>Schedule</span>
            </button>
            <button class="action-btn" routerLink="/settings">
              <mat-icon>settings</mat-icon>
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div class="card connection-status-card">
          <div class="card-header">
            <h3>Connection Status</h3>
          </div>
          <div class="connection-details">
            <div class="connection-item">
              <mat-icon class="connected">cloud_done</mat-icon>
              <div class="connection-info">
                <span class="connection-label">WordPress</span>
                <span class="connection-value">{{ wpConnected() ? 'Connected' : 'Not Connected' }}</span>
              </div>
            </div>
            <div class="connection-item">
              <mat-icon [class.connected]="aiConfigured()">psychology</mat-icon>
              <div class="connection-info">
                <span class="connection-label">AI Service</span>
                <span class="connection-value">{{ aiConfigured() ? 'Configured' : 'Not Configured' }}</span>
              </div>
            </div>
            <div class="connection-item">
              <mat-icon [class.connected]="imagesConfigured()">image</mat-icon>
              <div class="connection-info">
                <span class="connection-label">Image API</span>
                <span class="connection-value">{{ imagesConfigured() ? 'Configured' : 'Not Configured' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid rgba(233, 69, 96, 0.1);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(233, 69, 96, 0.15);
      }
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }

      &.total {
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
      }

      &.today {
        background: linear-gradient(135deg, #00d9a5 0%, #00b894 100%);
      }

      &.scheduled {
        background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
      }

      &.seo {
        background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
      }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
    }

    .stat-label {
      font-size: 13px;
      color: #a0a0b8;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .card {
      background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
      border-radius: 16px;
      border: 1px solid rgba(233, 69, 96, 0.1);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);

      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        margin: 0;
      }

      button {
        color: #e94560;
      }
    }

    .posts-list, .schedule-list {
      padding: 8px;
    }

    .post-item, .schedule-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-radius: 10px;
      transition: background 0.2s ease;

      &:hover {
        background: rgba(233, 69, 96, 0.05);
      }
    }

    .post-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .post-title {
      font-size: 14px;
      color: #ffffff;
      font-weight: 500;
      max-width: 280px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .post-date {
      font-size: 12px;
      color: #a0a0b8;
    }

    .post-status {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
      text-transform: uppercase;

      &.publish {
        background: rgba(0, 217, 165, 0.15);
        color: #00d9a5;
      }

      &.draft {
        background: rgba(160, 160, 184, 0.15);
        color: #a0a0b8;
      }

      &.future {
        background: rgba(255, 193, 7, 0.15);
        color: #ffc107;
      }
    }

    .schedule-time {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ffc107;
      font-size: 13px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .schedule-title {
      font-size: 14px;
      color: #ffffff;
      font-weight: 500;
    }

    .empty-state {
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #a0a0b8;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        opacity: 0.5;
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 16px;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      background: rgba(233, 69, 96, 0.05);
      border: 1px solid rgba(233, 69, 96, 0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #ffffff;

      &:hover {
        background: rgba(233, 69, 96, 0.15);
        border-color: rgba(233, 69, 96, 0.3);
        transform: translateY(-2px);
      }

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #e94560;
      }

      span {
        font-size: 13px;
        font-weight: 500;
      }
    }

    .connection-details {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .connection-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 10px;

      mat-icon {
        color: #a0a0b8;

        &.connected {
          color: #00d9a5;
        }
      }
    }

    .connection-info {
      display: flex;
      flex-direction: column;
    }

    .connection-label {
      font-size: 12px;
      color: #a0a0b8;
    }

    .connection-value {
      font-size: 14px;
      color: #ffffff;
      font-weight: 500;
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal<PostStats>({
    totalPosts: 0,
    todayPosts: 0,
    scheduledPosts: 0,
    averageSeoScore: 0
  });

  recentPosts = signal<WordPressPost[]>([]);
  upcomingScheduled = signal<ScheduledPost[]>([]);
  wpConnected = signal(false);
  aiConfigured = signal(false);
  imagesConfigured = signal(false);

  constructor(
    private wordpressService: WordPressService,
    private schedulerService: SchedulerService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Load WordPress connection status
    this.wordpressService.isConnected$.subscribe(connected => {
      this.wpConnected.set(connected);
    });

    // Load settings for API status
    const settings = this.wordpressService.getSettings();
    if (settings) {
      this.aiConfigured.set(!!settings.ai?.openaiApiKey);
      this.imagesConfigured.set(!!settings.images?.unsplashApiKey || !!settings.images?.pexelsApiKey);
    }

    // Load posts
    this.wordpressService.getPosts({ per_page: 5 }).subscribe(posts => {
      this.recentPosts.set(posts);
      this.updateStats(posts);
    });

    // Load scheduled posts
    this.schedulerService.scheduledPosts$.subscribe(scheduled => {
      const pending = scheduled
        .filter(s => s.status === 'pending')
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
        .slice(0, 5);
      this.upcomingScheduled.set(pending);
      this.stats.update(s => ({ ...s, scheduledPosts: pending.length }));
    });
  }

  private updateStats(posts: WordPressPost[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPosts = posts.filter(p => {
      const postDate = new Date(p.date || '');
      postDate.setHours(0, 0, 0, 0);
      return postDate.getTime() === today.getTime();
    });

    this.stats.set({
      totalPosts: posts.length,
      todayPosts: todayPosts.length,
      scheduledPosts: this.schedulerService.getStats().pending,
      averageSeoScore: 85
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPostTitle(title: string | WordPressPostTitle | undefined): string {
    if (!title) return 'Untitled';
    if (typeof title === 'string') return title;
    return title.rendered || 'Untitled';
  }

  formatScheduleDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
