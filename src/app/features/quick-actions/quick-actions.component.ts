import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ActivityFeedService,
  Activity,
  QuickAction,
} from '../../core/services/activity-feed.service';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="quick-actions-panel">
      <div class="panel-header">
        <h3><mat-icon>bolt</mat-icon> Quick Actions</h3>
      </div>

      <div class="actions-grid">
        @for (action of quickActions; track action.id) {
          <a
            [routerLink]="action.route"
            class="action-card"
            [style.--accent-color]="action.color"
            [matTooltip]="action.description || ''"
            matTooltipPosition="above"
          >
            <div class="action-icon">
              <mat-icon>{{ action.icon }}</mat-icon>
            </div>
            <span class="action-label">{{ action.label }}</span>
          </a>
        }
      </div>

      <div class="recent-activity">
        <div class="activity-header">
          <h4>Recent Activity</h4>
          <button class="clear-btn" (click)="clearActivities()">Clear</button>
        </div>

        <div class="activity-list">
          @for (activity of recentActivities; track activity.id) {
            <div class="activity-item" [style.--activity-color]="activity.color">
              <div class="activity-icon">
                <mat-icon>{{ activity.icon }}</mat-icon>
              </div>
              <div class="activity-content">
                <span class="activity-action">{{ activity.action }}</span>
                @if (activity.details) {
                  <span class="activity-details">{{ activity.details }}</span>
                }
              </div>
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            </div>
          }

          @if (recentActivities.length === 0) {
            <div class="empty-state">
              <mat-icon>history</mat-icon>
              <p>No recent activity</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .quick-actions-panel {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;
        height: fit-content;
      }

      .panel-header {
        margin-bottom: 16px;

        h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 16px;
          color: #ffffff;

          mat-icon {
            color: #e94560;
          }
        }
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }

      .action-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.2s ease;
        border: 1px solid transparent;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--accent-color);
          transform: translateY(-2px);

          .action-icon {
            background: var(--accent-color);
          }
        }

        .action-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;

          mat-icon {
            color: var(--accent-color);
            font-size: 22px;
          }
        }

        .action-label {
          font-size: 11px;
          color: #ffffff;
          font-weight: 500;
          text-align: center;
        }
      }

      .recent-activity {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 16px;
      }

      .activity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        h4 {
          margin: 0;
          font-size: 13px;
          color: #a0a0b8;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #666;
          font-size: 11px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;

          &:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #e94560;
          }
        }
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
      }

      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        border-left: 3px solid var(--activity-color);

        .activity-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: var(--activity-color);
          }
        }

        .activity-content {
          flex: 1;
          min-width: 0;

          .activity-action {
            display: block;
            font-size: 12px;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .activity-details {
            display: block;
            font-size: 11px;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .activity-time {
          font-size: 10px;
          color: #666;
          white-space: nowrap;
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px;
        color: #666;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          opacity: 0.3;
        }

        p {
          margin: 8px 0 0;
          font-size: 12px;
        }
      }
    `,
  ],
})
export class QuickActionsComponent {
  recentActivities: Activity[] = [];
  quickActions: QuickAction[] = [];

  constructor(private activityService: ActivityFeedService) {
    this.refreshActivities();
    this.quickActions = this.activityService.getQuickActions();
  }

  refreshActivities(): void {
    this.recentActivities = this.activityService.getRecentActivities(10);
  }

  clearActivities(): void {
    this.activityService.clearActivities();
    this.recentActivities = [];
  }

  formatTime(date: Date): string {
    return this.activityService.formatTime(date);
  }
}
