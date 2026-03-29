import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WordPressService } from '../../core/services/wordpress.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  template: `
    <header class="header">
      <div class="header-left">
        <h1 class="page-title">{{ pageTitle() }}</h1>
      </div>

      <div class="header-right">
        <button mat-icon-button class="header-btn" [matMenuTriggerFor]="notificationsMenu">
          <mat-icon [matBadge]="notificationCount()" matBadgeColor="warn" matBadgeSize="small">
            notifications
          </mat-icon>
        </button>

        <mat-menu #notificationsMenu="matMenu" class="notifications-menu">
          <div class="menu-header">
            <span>Notifications</span>
          </div>
          @if (notifications().length === 0) {
            <div class="empty-notifications">
              <mat-icon>notifications_none</mat-icon>
              <span>No new notifications</span>
            </div>
          }
          @for (notification of notifications(); track notification.id) {
            <button mat-menu-item class="notification-item">
              <mat-icon [class]="notification.type">{{ notification.icon }}</mat-icon>
              <span>{{ notification.message }}</span>
            </button>
          }
        </mat-menu>

        <div class="connection-status" [class.connected]="isConnected()">
          <span class="status-dot"></span>
          <span class="status-text">{{ isConnected() ? 'Connected' : 'Disconnected' }}</span>
        </div>

        <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-avatar">
          <mat-icon>account_circle</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu">
          <button mat-menu-item>
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </button>
          <button mat-menu-item routerLink="/settings">
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item>
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [
    `
      .header {
        height: 64px;
        background: rgba(26, 26, 46, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(233, 69, 96, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        position: fixed;
        top: 0;
        right: 0;
        left: 260px;
        z-index: 999;
        transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      :host-context(.sidebar-collapsed) .header {
        left: 70px;
      }

      .page-title {
        font-family: 'Outfit', sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: #ffffff;
        margin: 0;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-btn {
        color: #a0a0b8;

        &:hover {
          color: #ffffff;
        }
      }

      .connection-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: rgba(255, 107, 107, 0.1);
        border-radius: 20px;
        border: 1px solid rgba(255, 107, 107, 0.2);

        &.connected {
          background: rgba(0, 217, 165, 0.1);
          border-color: rgba(0, 217, 165, 0.2);

          .status-dot {
            background: #00d9a5;
            box-shadow: 0 0 8px rgba(0, 217, 165, 0.5);
          }

          .status-text {
            color: #00d9a5;
          }
        }
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff6b6b;
      }

      .status-text {
        font-size: 12px;
        font-weight: 500;
        color: #ff6b6b;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        border-radius: 50%;
        color: white;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .menu-header {
        padding: 12px 16px;
        font-weight: 600;
        color: #ffffff;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .empty-notifications {
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: #a0a0b8;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
      }

      .notification-item {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon.success {
          color: #00d9a5;
        }

        mat-icon.error {
          color: #ff6b6b;
        }

        mat-icon.warning {
          color: #ffc107;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  pageTitle = signal('Dashboard');
  notificationCount = signal(0);
  isConnected = signal(false);

  notifications = signal([
    { id: 1, icon: 'check_circle', message: 'Post published successfully', type: 'success' },
    { id: 2, icon: 'schedule', message: 'Post scheduled for tomorrow', type: 'warning' },
  ]);

  constructor(private wordPressService: WordPressService) {
    this.wordPressService.isConnected$.subscribe((connected: boolean) => {
      this.isConnected.set(connected);
    });
  }
}
