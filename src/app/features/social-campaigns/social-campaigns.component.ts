import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import {
  SocialCampaignService,
  SocialCampaign,
  Platform,
  PostStatus,
} from '../../core/services/social-campaign.service';

interface PlatformStats {
  platform: Platform;
  followers: number;
  posts: number;
  engagement: number;
  connected: boolean;
}

@Component({
  selector: 'app-social-campaigns',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  template: `
    <div class="social-campaigns-container">
      <header class="page-header">
        <div class="header-content">
          <h1>
            <mat-icon>campaign</mat-icon>
            Social Campaigns
          </h1>
          <p>Manage multi-platform social media campaigns from one panel</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openCampaignDialog()">
            <mat-icon>add</mat-icon>
            New Campaign
          </button>
        </div>
      </header>

      <div class="platforms-overview">
        @for (stat of platformStats(); track stat.platform) {
          <div class="platform-card" [class.connected]="stat.connected">
            <div class="platform-header">
              <div class="platform-icon" [style.background]="getPlatformColor(stat.platform)">
                <mat-icon>{{ getPlatformIcon(stat.platform) }}</mat-icon>
              </div>
              <span class="platform-name">{{ getPlatformName(stat.platform) }}</span>
              @if (!stat.connected) {
                <span class="disconnected-badge">Not Connected</span>
              }
            </div>
            <div class="platform-stats">
              <div class="stat">
                <span class="stat-value">{{ formatNumber(stat.followers) }}</span>
                <span class="stat-label">Followers</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ stat.posts }}</span>
                <span class="stat-label">Posts</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ stat.engagement }}%</span>
                <span class="stat-label">Engagement</span>
              </div>
            </div>
            <button
              mat-stroked-button
              [color]="stat.connected ? 'warn' : 'primary'"
              (click)="toggleConnection(stat.platform)"
            >
              {{ stat.connected ? 'Disconnect' : 'Connect' }}
            </button>
          </div>
        }
      </div>

      <mat-tab-group class="campaign-tabs" animationDuration="300ms">
        <mat-tab label="All Campaigns">
          <div class="tab-content">
            <div class="campaign-filters">
              <mat-chip-listbox [(ngModel)]="selectedStatus" (change)="filterCampaigns()">
                <mat-chip-option value="all">All</mat-chip-option>
                <mat-chip-option value="active">Active</mat-chip-option>
                <mat-chip-option value="scheduled">Scheduled</mat-chip-option>
                <mat-chip-option value="paused">Paused</mat-chip-option>
                <mat-chip-option value="completed">Completed</mat-chip-option>
              </mat-chip-listbox>
              <mat-chip-listbox [(ngModel)]="selectedPlatform" (change)="filterCampaigns()">
                <mat-chip-option value="all">All Platforms</mat-chip-option>
                <mat-chip-option value="twitter">Twitter/X</mat-chip-option>
                <mat-chip-option value="facebook">Facebook</mat-chip-option>
                <mat-chip-option value="instagram">Instagram</mat-chip-option>
                <mat-chip-option value="linkedin">LinkedIn</mat-chip-option>
                <mat-chip-option value="youtube">YouTube</mat-chip-option>
                <mat-chip-option value="tiktok">TikTok</mat-chip-option>
                <mat-chip-option value="pinterest">Pinterest</mat-chip-option>
              </mat-chip-listbox>
            </div>

            <div class="campaigns-grid">
              @for (campaign of filteredCampaigns(); track campaign.id) {
                <mat-card class="campaign-card">
                  <mat-card-header>
                    <div class="campaign-platforms">
                      @for (p of campaign.platforms; track p) {
                        <span class="platform-badge" [style.background]="getPlatformColor(p)">
                          <mat-icon>{{ getPlatformIcon(p) }}</mat-icon>
                        </span>
                      }
                    </div>
                    <button mat-icon-button [matMenuTriggerFor]="menu" class="campaign-menu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="editCampaign(campaign)">
                        <mat-icon>edit</mat-icon>
                        <span>Edit</span>
                      </button>
                      <button mat-menu-item (click)="duplicateCampaign(campaign)">
                        <mat-icon>content_copy</mat-icon>
                        <span>Duplicate</span>
                      </button>
                      <button mat-menu-item (click)="pauseCampaign(campaign)">
                        <mat-icon>pause</mat-icon>
                        <span>{{ campaign.status === 'active' ? 'Pause' : 'Resume' }}</span>
                      </button>
                      <button mat-menu-item (click)="deleteCampaign(campaign)">
                        <mat-icon>delete</mat-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </mat-card-header>
                  <mat-card-content>
                    <h3 class="campaign-title">{{ campaign.name }}</h3>
                    <p class="campaign-description">{{ campaign.description }}</p>
                    <div class="campaign-meta">
                      <span class="meta-item">
                        <mat-icon>event</mat-icon>
                        {{ campaign.startDate | date: 'MMM d' }} -
                        {{ campaign.endDate | date: 'MMM d' }}
                      </span>
                      <span class="meta-item">
                        <mat-icon>schedule</mat-icon>
                        {{ campaign.postCount }} posts
                      </span>
                    </div>
                    <div class="campaign-progress">
                      <div class="progress-bar">
                        <div
                          class="progress-fill"
                          [style.width.%]="getCampaignProgress(campaign)"
                        ></div>
                      </div>
                      <span class="progress-text"
                        >{{ getCampaignProgress(campaign) }}% complete</span
                      >
                    </div>
                  </mat-card-content>
                  <mat-card-actions>
                    <span class="status-badge" [class]="campaign.status">{{
                      campaign.status
                    }}</span>
                    <button mat-button color="primary" (click)="viewCampaignDetails(campaign)">
                      View Details
                    </button>
                  </mat-card-actions>
                </mat-card>
              } @empty {
                <div class="empty-state">
                  <mat-icon>campaign</mat-icon>
                  <h3>No campaigns found</h3>
                  <p>Create your first social media campaign to get started</p>
                  <button mat-raised-button color="primary" (click)="openCampaignDialog()">
                    Create Campaign
                  </button>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Calendar">
          <div class="tab-content">
            <div class="calendar-view">
              <div class="calendar-header">
                <button mat-icon-button (click)="previousMonth()">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <h3>{{ currentMonthYear() }}</h3>
                <button mat-icon-button (click)="nextMonth()">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
              <div class="calendar-grid">
                <div class="calendar-day-header">Sun</div>
                <div class="calendar-day-header">Mon</div>
                <div class="calendar-day-header">Tue</div>
                <div class="calendar-day-header">Wed</div>
                <div class="calendar-day-header">Thu</div>
                <div class="calendar-day-header">Fri</div>
                <div class="calendar-day-header">Sat</div>
                @for (day of calendarDays(); track day.date) {
                  <div
                    class="calendar-day"
                    [class.other-month]="!day.isCurrentMonth"
                    [class.today]="day.isToday"
                  >
                    <span class="day-number">{{ day.dayNumber }}</span>
                    <div class="day-posts">
                      @for (post of day.posts.slice(0, 3); track post.id) {
                        <div
                          class="post-dot"
                          [matTooltip]="post.title"
                          [style.background]="getPlatformColor(post.platform)"
                        ></div>
                      }
                      @if (day.posts.length > 3) {
                        <span class="more-posts">+{{ day.posts.length - 3 }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Analytics">
          <div class="tab-content">
            <div class="analytics-grid">
              <mat-card class="analytics-card">
                <mat-card-header>
                  <mat-icon>people</mat-icon>
                  <h3>Total Reach</h3>
                </mat-card-header>
                <mat-card-content>
                  <span class="big-number">{{ formatNumber(totalReach()) }}</span>
                  <span class="trend positive">+12.5%</span>
                </mat-card-content>
              </mat-card>
              <mat-card class="analytics-card">
                <mat-card-header>
                  <mat-icon>thumb_up</mat-icon>
                  <h3>Total Engagement</h3>
                </mat-card-header>
                <mat-card-content>
                  <span class="big-number">{{ formatNumber(totalEngagement()) }}</span>
                  <span class="trend positive">+8.3%</span>
                </mat-card-content>
              </mat-card>
              <mat-card class="analytics-card">
                <mat-card-header>
                  <mat-icon>share</mat-icon>
                  <h3>Total Shares</h3>
                </mat-card-header>
                <mat-card-content>
                  <span class="big-number">{{ formatNumber(totalShares()) }}</span>
                  <span class="trend positive">+15.2%</span>
                </mat-card-content>
              </mat-card>
              <mat-card class="analytics-card">
                <mat-card-header>
                  <mat-icon>link</mat-icon>
                  <h3>Total Clicks</h3>
                </mat-card-header>
                <mat-card-content>
                  <span class="big-number">{{ formatNumber(totalClicks()) }}</span>
                  <span class="trend negative">-2.1%</span>
                </mat-card-content>
              </mat-card>
            </div>

            <mat-card class="platform-breakdown">
              <mat-card-header>
                <h3>Platform Performance</h3>
              </mat-card-header>
              <mat-card-content>
                <div class="platform-bars">
                  @for (stat of platformStats(); track stat.platform) {
                    <div class="platform-bar-item">
                      <div class="platform-info">
                        <mat-icon [style.color]="getPlatformColor(stat.platform)">{{
                          getPlatformIcon(stat.platform)
                        }}</mat-icon>
                        <span>{{ getPlatformName(stat.platform) }}</span>
                      </div>
                      <div class="bar-container">
                        <div
                          class="bar"
                          [style.width.%]="stat.engagement"
                          [style.background]="getPlatformColor(stat.platform)"
                        ></div>
                      </div>
                      <span class="bar-value">{{ stat.engagement }}%</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Queue">
          <div class="tab-content">
            <div class="queue-list">
              @for (item of postQueue(); track item.id) {
                <div class="queue-item">
                  <div class="queue-platform">
                    <mat-icon [style.color]="getPlatformColor(item.platform)">{{
                      getPlatformIcon(item.platform)
                    }}</mat-icon>
                  </div>
                  <div class="queue-content">
                    <h4>{{ item.title }}</h4>
                    <p>{{ item.content | slice: 0 : 100 }}...</p>
                  </div>
                  <div class="queue-meta">
                    <span class="scheduled-time">
                      <mat-icon>schedule</mat-icon>
                      {{ item.scheduledDate | date: 'MMM d, h:mm a' }}
                    </span>
                  </div>
                  <div class="queue-actions">
                    <button mat-icon-button matTooltip="Edit" (click)="editQueuedPost(item)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Delete" (click)="removeFromQueue(item)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">
                  <mat-icon>schedule</mat-icon>
                  <h3>Queue is empty</h3>
                  <p>Schedule posts to see them here</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .social-campaigns-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;

        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;

          mat-icon {
            color: #e94560;
          }
        }

        p {
          margin: 8px 0 0;
          color: #a0a0b8;
        }
      }

      .platforms-overview {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .platform-card {
        background: #1a1a2e;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        transition: all 0.2s ease;

        &:hover {
          border-color: rgba(233, 69, 96, 0.3);
          transform: translateY(-2px);
        }

        &.connected {
          border-color: rgba(76, 175, 80, 0.3);
        }
      }

      .platform-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        .platform-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            color: white;
          }
        }

        .platform-name {
          font-weight: 600;
          color: #ffffff;
        }

        .disconnected-badge {
          margin-left: auto;
          font-size: 10px;
          background: rgba(255, 152, 0, 0.2);
          color: #ff9800;
          padding: 2px 8px;
          border-radius: 10px;
        }
      }

      .platform-stats {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16px;

        .stat {
          text-align: center;

          .stat-value {
            display: block;
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
          }

          .stat-label {
            font-size: 11px;
            color: #a0a0b8;
          }
        }
      }

      .campaign-tabs {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 16px;
      }

      .campaign-filters {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }

      .campaigns-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
      }

      .campaign-card {
        background: #16213e;
        border: 1px solid rgba(255, 255, 255, 0.05);

        mat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 16px 0;

          .campaign-platforms {
            display: flex;
            gap: 6px;

            .platform-badge {
              width: 28px;
              height: 28px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;

              mat-icon {
                font-size: 16px;
                width: 16px;
                height: 16px;
                color: white;
              }
            }
          }

          .campaign-menu {
            color: #a0a0b8;
          }
        }

        mat-card-content {
          padding: 16px;

          .campaign-title {
            margin: 0 0 8px;
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
          }

          .campaign-description {
            margin: 0 0 16px;
            font-size: 13px;
            color: #a0a0b8;
            line-height: 1.5;
          }

          .campaign-meta {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;

            .meta-item {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
              color: #a0a0b8;

              mat-icon {
                font-size: 14px;
                width: 14px;
                height: 14px;
              }
            }
          }

          .campaign-progress {
            .progress-bar {
              height: 6px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 3px;
              overflow: hidden;
              margin-bottom: 8px;

              .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #e94560 0%, #ff6b6b 100%);
                border-radius: 3px;
                transition: width 0.3s ease;
              }
            }

            .progress-text {
              font-size: 11px;
              color: #a0a0b8;
            }
          }
        }

        mat-card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);

          .status-badge {
            font-size: 11px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 12px;
            text-transform: capitalize;

            &.active {
              background: rgba(76, 175, 80, 0.2);
              color: #4caf50;
            }

            &.scheduled {
              background: rgba(33, 150, 243, 0.2);
              color: #2196f3;
            }

            &.paused {
              background: rgba(255, 152, 0, 0.2);
              color: #ff9800;
            }

            &.completed {
              background: rgba(158, 158, 158, 0.2);
              color: #9e9e9e;
            }
          }
        }
      }

      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 48px;
        color: #a0a0b8;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          opacity: 0.3;
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px;
          color: #ffffff;
        }

        p {
          margin: 0 0 24px;
        }
      }

      .calendar-view {
        background: #16213e;
        border-radius: 12px;
        padding: 20px;

        .calendar-header {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;

          h3 {
            margin: 0;
            min-width: 180px;
            text-align: center;
          }
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;

          .calendar-day-header {
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: #a0a0b8;
            padding: 8px;
          }

          .calendar-day {
            aspect-ratio: 1;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 8px;
            min-height: 80px;

            &.other-month {
              opacity: 0.3;
            }

            &.today {
              background: rgba(233, 69, 96, 0.2);
              border: 1px solid #e94560;
            }

            .day-number {
              font-size: 12px;
              font-weight: 600;
              color: #ffffff;
            }

            .day-posts {
              display: flex;
              gap: 4px;
              margin-top: 8px;
              flex-wrap: wrap;

              .post-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
              }

              .more-posts {
                font-size: 10px;
                color: #a0a0b8;
              }
            }
          }
        }
      }

      .analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .analytics-card {
        background: #16213e;

        mat-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;

          mat-icon {
            color: #e94560;
          }

          h3 {
            margin: 0;
            font-size: 14px;
            color: #a0a0b8;
          }
        }

        mat-card-content {
          .big-number {
            display: block;
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
          }

          .trend {
            font-size: 13px;
            font-weight: 600;

            &.positive {
              color: #4caf50;
            }

            &.negative {
              color: #f44336;
            }
          }
        }
      }

      .platform-breakdown {
        background: #16213e;

        mat-card-header h3 {
          margin: 0 0 16px;
          font-size: 16px;
        }

        .platform-bars {
          display: flex;
          flex-direction: column;
          gap: 16px;

          .platform-bar-item {
            display: flex;
            align-items: center;
            gap: 12px;

            .platform-info {
              display: flex;
              align-items: center;
              gap: 8px;
              min-width: 120px;

              mat-icon {
                font-size: 20px;
              }

              span {
                font-size: 13px;
                color: #a0a0b8;
              }
            }

            .bar-container {
              flex: 1;
              height: 8px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 4px;
              overflow: hidden;

              .bar {
                height: 100%;
                border-radius: 4px;
                transition: width 0.3s ease;
              }
            }

            .bar-value {
              min-width: 45px;
              text-align: right;
              font-size: 13px;
              font-weight: 600;
              color: #ffffff;
            }
          }
        }
      }

      .queue-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .queue-item {
        display: flex;
        align-items: center;
        gap: 16px;
        background: #16213e;
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 16px;

        .queue-platform mat-icon {
          font-size: 24px;
        }

        .queue-content {
          flex: 1;

          h4 {
            margin: 0 0 4px;
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
          }

          p {
            margin: 0;
            font-size: 12px;
            color: #a0a0b8;
          }
        }

        .queue-meta {
          .scheduled-time {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #a0a0b8;

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }
        }

        .queue-actions {
          display: flex;
          gap: 4px;

          button {
            color: #a0a0b8;
          }
        }
      }
    `,
  ],
})
export class SocialCampaignsComponent implements OnInit {
  campaigns = signal<SocialCampaign[]>([]);
  platformStats = signal<PlatformStats[]>([]);
  postQueue = signal<any[]>([]);

  selectedStatus = 'all';
  selectedPlatform = 'all';
  currentDate = new Date();

  filteredCampaigns = computed(() => {
    let filtered = this.campaigns();
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === this.selectedStatus);
    }
    if (this.selectedPlatform !== 'all') {
      filtered = filtered.filter(
        (c) =>
          c.platforms?.includes(this.selectedPlatform as Platform) ||
          c.platform === this.selectedPlatform,
      );
    }
    return filtered;
  });

  calendarDays = computed(() => {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const today = new Date();

    for (let i = 0; i < firstDay.getDay(); i++) {
      const date = new Date(year, month, -i);
      days.unshift({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
        posts: [],
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        posts: this.getPostsForDate(date),
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        posts: [],
      });
    }

    return days;
  });

  totalReach = computed(() => 1250000);
  totalEngagement = computed(() => 45000);
  totalShares = computed(() => 12500);
  totalClicks = computed(() => 35000);

  currentMonthYear = computed(() => {
    return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  constructor(private campaignService: SocialCampaignService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.campaigns.set(this.campaignService.getCampaigns());
    this.platformStats.set(this.campaignService.getPlatformStats());
    this.postQueue.set(this.campaignService.getPostQueue());
  }

  getPostsForDate(date: Date): any[] {
    return this.postQueue().filter((p) => {
      const postDate = new Date(p.scheduledDate);
      return postDate.toDateString() === date.toDateString();
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getPlatformName(platform: Platform): string {
    const names: Record<Platform, string> = {
      twitter: 'Twitter/X',
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      pinterest: 'Pinterest',
    };
    return names[platform];
  }

  getPlatformIcon(platform: Platform): string {
    const icons: Record<Platform, string> = {
      twitter: 'tag',
      facebook: 'facebook',
      instagram: 'photo_camera',
      linkedin: 'work',
      youtube: 'play_circle',
      tiktok: 'music_note',
      pinterest: 'push_pin',
    };
    return icons[platform];
  }

  getPlatformColor(platform: Platform): string {
    const colors: Record<Platform, string> = {
      twitter: '#1DA1F2',
      facebook: '#1877F2',
      instagram: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
      linkedin: '#0A66C2',
      youtube: '#FF0000',
      tiktok: '#000000',
      pinterest: '#E60023',
    };
    return colors[platform];
  }

  getCampaignProgress(campaign: SocialCampaign): number {
    if (!campaign.startDate || !campaign.endDate) return 0;
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  toggleConnection(platform: Platform): void {
    this.campaignService.togglePlatformConnection(platform);
    this.loadData();
  }

  filterCampaigns(): void {
    // Filter is handled by computed signal
  }

  openCampaignDialog(): void {
    this.campaignService.createCampaign({
      name: 'New Campaign',
      description: 'Campaign description',
      platform: 'twitter',
      platforms: ['twitter'],
      type: 'post',
      content: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'draft',
    });
    this.loadData();
  }

  editCampaign(campaign: SocialCampaign): void {
    console.log('Edit campaign:', campaign);
  }

  duplicateCampaign(campaign: SocialCampaign): void {
    this.campaignService.duplicateCampaign(campaign.id);
    this.loadData();
  }

  pauseCampaign(campaign: SocialCampaign): void {
    this.campaignService.updateCampaignStatus(
      campaign.id,
      campaign.status === 'active' ? 'paused' : 'active',
    );
    this.loadData();
  }

  deleteCampaign(campaign: SocialCampaign): void {
    this.campaignService.deleteCampaign(campaign.id);
    this.loadData();
  }

  viewCampaignDetails(campaign: SocialCampaign): void {
    console.log('View details:', campaign);
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
  }

  editQueuedPost(post: any): void {
    console.log('Edit queued post:', post);
  }

  removeFromQueue(post: any): void {
    this.campaignService.removeFromQueue(post.id);
    this.loadData();
  }
}
