import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule, MatRippleModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="logo">
        <div class="logo-icon">
          <mat-icon>bolt</mat-icon>
        </div>
        @if (!collapsed()) {
          <span class="logo-text">WP AutoPoster</span>
        }
      </div>

      <nav class="nav-menu">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item"
            [matTooltip]="collapsed() ? item.label : ''"
            matTooltipPosition="right"
            matRipple
          >
            <mat-icon>{{ item.icon }}</mat-icon>
            @if (!collapsed()) {
              <span class="nav-label">{{ item.label }}</span>
              @if (item.badge) {
                <span class="badge">{{ item.badge }}</span>
              }
            }
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        <button class="collapse-btn" (click)="toggleCollapse()">
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>
    </aside>
  `,
  styles: [
    `
      .sidebar {
        width: 260px;
        height: 100vh;
        background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
        display: flex;
        flex-direction: column;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: fixed;
        left: 0;
        top: 0;
        z-index: 1000;
        border-right: 1px solid rgba(233, 69, 96, 0.1);

        &.collapsed {
          width: 70px;

          .logo-text {
            display: none;
          }

          .nav-label,
          .badge {
            display: none;
          }
        }
      }

      .logo {
        padding: 24px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .logo-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          color: white;
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .logo-text {
        font-family: 'Outfit', sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: #ffffff;
        white-space: nowrap;
      }

      .nav-menu {
        flex: 1;
        padding: 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        overflow-y: auto;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 10px;
        color: #a0a0b8;
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
        position: relative;

        &:hover {
          background: rgba(233, 69, 96, 0.1);
          color: #ffffff;

          mat-icon {
            color: #e94560;
          }
        }

        &.active {
          background: linear-gradient(
            135deg,
            rgba(233, 69, 96, 0.2) 0%,
            rgba(233, 69, 96, 0.1) 100%
          );
          color: #ffffff;

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 24px;
            background: #e94560;
            border-radius: 0 3px 3px 0;
          }

          mat-icon {
            color: #e94560;
          }
        }

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
          flex-shrink: 0;
        }
      }

      .nav-label {
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }

      .badge {
        margin-left: auto;
        background: #e94560;
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 10px;
      }

      .sidebar-footer {
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }

      .collapse-btn {
        width: 100%;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: none;
        border-radius: 8px;
        color: #a0a0b8;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(233, 69, 96, 0.1);
          color: #e94560;
        }
      }
    `,
  ],
})
export class SidebarComponent {
  collapsed = signal(false);

  navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'add_circle', label: 'Create Post', route: '/create' },
    { icon: 'auto_awesome', label: 'AI Auto Poster', route: '/ai-auto-poster' },
    { icon: 'psychology', label: 'AI Models', route: '/ai-models' },
    { icon: 'tune', label: 'Content Tools', route: '/content-tools' },
    { icon: 'analytics', label: 'Analytics', route: '/analytics' },
    { icon: 'calendar_month', label: 'Content Calendar', route: '/content-calendar' },
    { icon: 'smart_toy', label: 'Tech Auto Post', route: '/tech-auto-poster' },
    { icon: 'trending_up', label: 'SEO Center', route: '/seo-center' },
    { icon: 'public', label: 'Search Engines', route: '/search-engine-manager' },
    { icon: 'campaign', label: 'Social Campaigns', route: '/social-campaigns' },
    { icon: 'link', label: 'Backlinks', route: '/backlink-manager' },
    { icon: 'search', label: 'Keyword Tracker', route: '/keyword-tracker' },
    { icon: 'compare', label: 'Competitors', route: '/competitor-analyzer' },
    { icon: 'health_and_safety', label: 'Site Health', route: '/site-health' },
    { icon: 'code', label: 'Schema Markup', route: '/schema-generator' },
    { icon: 'account_tree', label: 'Internal Links', route: '/internal-links' },
    { icon: 'campaign', label: 'Brand Mentions', route: '/brand-mentions' },
    { icon: 'location_on', label: 'Local SEO', route: '/local-seo' },
    { icon: 'trending_up', label: 'Content Gap', route: '/content-gap' },
    { icon: 'send', label: 'Outreach', route: '/outreach-manager' },
    { icon: 'person_add', label: 'Guest Posts', route: '/guest-post-finder' },
    { icon: 'table_chart', label: 'SERP Tracker', route: '/serp-tracker' },
    { icon: 'speed', label: 'Speed Monitor', route: '/speed-monitor' },
    { icon: 'article', label: 'All Posts', route: '/posts' },
    { icon: 'schedule', label: 'Scheduler', route: '/scheduler' },
    { icon: 'assignment', label: 'SEO Audit', route: '/seo-audit' },
    { icon: 'link', label: 'Link Opps', route: '/link-opportunities' },
    { icon: 'insights', label: 'Traffic', route: '/traffic-analyzer' },
    { icon: 'leaderboard', label: 'Rank Checker', route: '/rank-checker' },
    { icon: 'tag', label: 'Meta Analyzer', route: '/meta-analyzer' },
    { icon: 'image', label: 'Image Optimizer', route: '/image-optimizer' },
    { icon: 'settings_ethernet', label: 'Robots.txt', route: '/robots-txt-editor' },
    { icon: 'account_tree', label: 'Sitemap Gen', route: '/sitemap-generator' },
    { icon: 'link', label: 'Canonical URL', route: '/canonical-url-checker' },
    { icon: 'alt_route', label: 'Redirects', route: '/redirect-manager' },
    { icon: 'manage_accounts', label: 'Master Tools', route: '/master-tools' },
    { icon: 'settings', label: 'Settings', route: '/settings' },
  ];

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }
}
