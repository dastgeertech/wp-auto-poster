import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  SiteHealthService,
  SiteHealthIssue,
  SiteHealthReport,
} from '../../core/services/site-health.service';

@Component({
  selector: 'app-site-health',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="health-container">
      <header class="page-header">
        <div class="header-content">
          <h1>
            <mat-icon>health_and_safety</mat-icon>
            Site Health Monitor
          </h1>
          <p>Monitor technical SEO health and fix issues proactively</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="runHealthCheck()">
            <mat-icon>refresh</mat-icon>
            Run Health Check
          </button>
        </div>
      </header>

      <div class="score-overview">
        <div class="main-score" [class]="getScoreClass(report().overallScore)">
          <div class="score-circle">
            <svg viewBox="0 0 100 100">
              <circle class="bg" cx="50" cy="50" r="45" />
              <circle
                class="progress"
                cx="50"
                cy="50"
                r="45"
                [style.strokeDasharray]="getCircleDash(report().overallScore)"
              />
            </svg>
            <div class="score-value">
              <span class="number">{{ report().overallScore }}</span>
              <span class="label">Score</span>
            </div>
          </div>
          <div class="score-details">
            <h3>{{ getScoreLabel(report().overallScore) }}</h3>
            <p>Core Web Vitals and technical SEO health</p>
          </div>
        </div>

        <div class="category-scores">
          <div class="category-card" [class]="getScoreClass(report().performance.score)">
            <mat-icon>speed</mat-icon>
            <div class="cat-info">
              <span class="cat-name">Performance</span>
              <span class="cat-value">{{ report().performance.score }}</span>
            </div>
          </div>
          <div class="category-card" [class]="getScoreClass(report().accessibility.score)">
            <mat-icon>accessibility</mat-icon>
            <div class="cat-info">
              <span class="cat-name">Accessibility</span>
              <span class="cat-value">{{ report().accessibility.score }}</span>
            </div>
          </div>
          <div class="category-card" [class]="getScoreClass(report().bestPractices.score)">
            <mat-icon>verified</mat-icon>
            <div class="cat-info">
              <span class="cat-name">Best Practices</span>
              <span class="cat-value">{{ report().bestPractices.score }}</span>
            </div>
          </div>
          <div class="category-card" [class]="getScoreClass(report().seo.score)">
            <mat-icon>search</mat-icon>
            <div class="cat-info">
              <span class="cat-name">SEO</span>
              <span class="cat-value">{{ report().seo.score }}</span>
            </div>
          </div>
          <div class="category-card" [class]="getScoreClass(report().security.score)">
            <mat-icon>security</mat-icon>
            <div class="cat-info">
              <span class="cat-name">Security</span>
              <span class="cat-value">{{ report().security.score }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="performance-metrics">
        <h3>Core Web Vitals</h3>
        <div class="metrics-grid">
          <mat-card class="metric-card">
            <div class="metric-header">
              <mat-icon>schedule</mat-icon>
              <span>FCP (First Contentful Paint)</span>
            </div>
            <span class="metric-value">{{ report().performance.fcp.toFixed(1) }}s</span>
            <mat-progress-bar
              mode="determinate"
              [value]="getMetricPercent(report().performance.fcp, 1.8, 3.0)"
            ></mat-progress-bar>
            <span
              class="metric-status"
              [class]="getMetricClass(report().performance.fcp, 1.8, 3.0)"
            >
              {{ getMetricStatus(report().performance.fcp, 1.8, 3.0) }}
            </span>
          </mat-card>
          <mat-card class="metric-card">
            <div class="metric-header">
              <mat-icon>image</mat-icon>
              <span>LCP (Largest Contentful Paint)</span>
            </div>
            <span class="metric-value">{{ report().performance.lcp.toFixed(1) }}s</span>
            <mat-progress-bar
              mode="determinate"
              [value]="getMetricPercent(report().performance.lcp, 2.5, 4.0)"
            ></mat-progress-bar>
            <span
              class="metric-status"
              [class]="getMetricClass(report().performance.lcp, 2.5, 4.0)"
            >
              {{ getMetricStatus(report().performance.lcp, 2.5, 4.0) }}
            </span>
          </mat-card>
          <mat-card class="metric-card">
            <div class="metric-header">
              <mat-icon>layout</mat-icon>
              <span>CLS (Cumulative Layout Shift)</span>
            </div>
            <span class="metric-value">{{ report().performance.cls.toFixed(3) }}</span>
            <mat-progress-bar
              mode="determinate"
              [value]="getMetricPercent(report().performance.cls, 0.1, 0.25)"
            ></mat-progress-bar>
            <span
              class="metric-status"
              [class]="getMetricClass(report().performance.cls, 0.1, 0.25)"
            >
              {{ getMetricStatus(report().performance.cls, 0.1, 0.25) }}
            </span>
          </mat-card>
          <mat-card class="metric-card">
            <div class="metric-header">
              <mat-icon>network_check</mat-icon>
              <span>TTFB (Time to First Byte)</span>
            </div>
            <span class="metric-value">{{ report().performance.ttfb.toFixed(0) }}ms</span>
            <mat-progress-bar
              mode="determinate"
              [value]="getMetricPercent(report().performance.ttfb, 800, 1800)"
            ></mat-progress-bar>
            <span
              class="metric-status"
              [class]="getMetricClass(report().performance.ttfb, 800, 1800)"
            >
              {{ getMetricStatus(report().performance.ttfb, 800, 1800) }}
            </span>
          </mat-card>
        </div>
      </div>

      <mat-tab-group class="main-tabs" animationDuration="300ms">
        <mat-tab label="All Issues">
          <div class="tab-content">
            <div class="filters-row">
              <mat-chip-listbox [(ngModel)]="filterCategory" (change)="applyFilters()">
                <mat-chip-option value="all">All Categories</mat-chip-option>
                <mat-chip-option value="performance">Performance</mat-chip-option>
                <mat-chip-option value="accessibility">Accessibility</mat-chip-option>
                <mat-chip-option value="best-practices">Best Practices</mat-chip-option>
                <mat-chip-option value="seo">SEO</mat-chip-option>
                <mat-chip-option value="security">Security</mat-chip-option>
              </mat-chip-listbox>
              <mat-chip-listbox [(ngModel)]="filterType" (change)="applyFilters()">
                <mat-chip-option value="all">All Types</mat-chip-option>
                <mat-chip-option value="critical">Critical</mat-chip-option>
                <mat-chip-option value="warning">Warning</mat-chip-option>
                <mat-chip-option value="info">Info</mat-chip-option>
              </mat-chip-listbox>
            </div>

            <div class="issues-list">
              @for (issue of filteredIssues(); track issue.id) {
                <mat-card
                  class="issue-card"
                  [class]="issue.type"
                  [class.fixed]="issue.status === 'fixed'"
                >
                  <div class="issue-header">
                    <div class="issue-type">
                      <mat-icon>{{ getTypeIcon(issue.type) }}</mat-icon>
                      <span class="type-label">{{ issue.type }}</span>
                    </div>
                    <div class="issue-category">{{ issue.category }}</div>
                  </div>
                  <div class="issue-content">
                    <h4>{{ issue.title }}</h4>
                    <p>{{ issue.description }}</p>
                    <div class="issue-meta">
                      <span class="impact" [class]="issue.impact"> {{ issue.impact }} impact </span>
                      <span class="affected"> {{ issue.affectedUrls.length }} affected URLs </span>
                    </div>
                    @if (issue.affectedUrls.length > 0) {
                      <div class="affected-urls">
                        @for (url of issue.affectedUrls.slice(0, 3); track url) {
                          <code>{{ url }}</code>
                        }
                        @if (issue.affectedUrls.length > 3) {
                          <span class="more">+{{ issue.affectedUrls.length - 3 }} more</span>
                        }
                      </div>
                    }
                  </div>
                  <div class="issue-actions">
                    <div class="recommendation">
                      <strong>Recommendation:</strong> {{ issue.recommendation }}
                    </div>
                    @if (issue.status === 'open') {
                      <button mat-raised-button color="primary" (click)="fixIssue(issue)">
                        <mat-icon>check</mat-icon>
                        Mark as Fixed
                      </button>
                      <button mat-stroked-button (click)="ignoreIssue(issue)">
                        <mat-icon>visibility_off</mat-icon>
                        Ignore
                      </button>
                    } @else if (issue.status === 'fixed') {
                      <span class="fixed-badge">
                        <mat-icon>check_circle</mat-icon>
                        Fixed {{ issue.fixedAt | date: 'MMM d' }}
                      </span>
                      <button mat-stroked-button (click)="reopenIssue(issue)">Reopen</button>
                    }
                  </div>
                </mat-card>
              } @empty {
                <div class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <h3>No issues found</h3>
                  <p>Great! Your site has no issues in this category.</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Recommendations">
          <div class="tab-content">
            <h3>Recommended Actions</h3>
            <div class="recommendations-list">
              @for (rec of recommendations; track rec) {
                <div class="recommendation-item">
                  <mat-icon>lightbulb</mat-icon>
                  <span>{{ rec }}</span>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="History">
          <div class="tab-content">
            <div class="history-placeholder">
              <mat-icon>history</mat-icon>
              <h3>Issue History</h3>
              <p>Track when issues were detected and fixed</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .health-container {
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

      .score-overview {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 24px;
        margin-bottom: 24px;

        @media (max-width: 1024px) {
          grid-template-columns: 1fr;
        }
      }

      .main-score {
        background: #1a1a2e;
        border-radius: 16px;
        padding: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        border: 2px solid transparent;

        &.good {
          border-color: rgba(76, 175, 80, 0.5);
        }
        &.needs-work {
          border-color: rgba(255, 152, 0, 0.5);
        }
        &.poor {
          border-color: rgba(244, 67, 54, 0.5);
        }

        .score-circle {
          position: relative;
          width: 160px;
          height: 160px;

          svg {
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);

            circle {
              fill: none;
              stroke-width: 8;
              stroke-linecap: round;

              &.bg {
                stroke: rgba(255, 255, 255, 0.1);
              }

              &.progress {
                stroke: #4caf50;
                transition: stroke-dasharray 0.3s ease;
              }
            }
          }

          .score-value {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);

            .number {
              display: block;
              font-size: 48px;
              font-weight: 700;
              color: #ffffff;
            }

            .label {
              font-size: 14px;
              color: #a0a0b8;
            }
          }
        }

        .score-details {
          margin-top: 24px;

          h3 {
            margin: 0;
            font-size: 20px;
            color: #ffffff;
          }

          p {
            margin: 8px 0 0;
            color: #a0a0b8;
            font-size: 14px;
          }
        }
      }

      .category-scores {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
      }

      .category-card {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-left: 4px solid transparent;

        &.good {
          border-left-color: #4caf50;
        }
        &.needs-work {
          border-left-color: #ff9800;
        }
        &.poor {
          border-left-color: #f44336;
        }

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          color: #e94560;
        }

        .cat-info {
          .cat-name {
            display: block;
            font-size: 12px;
            color: #a0a0b8;
          }

          .cat-value {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
          }
        }
      }

      .performance-metrics {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;

        h3 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #ffffff;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
      }

      .metric-card {
        background: #16213e;
        padding: 16px;

        .metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;

          mat-icon {
            color: #e94560;
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          span {
            font-size: 13px;
            color: #a0a0b8;
          }
        }

        .metric-value {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        mat-progress-bar {
          height: 6px;
          border-radius: 3px;
          margin-bottom: 8px;
        }

        .metric-status {
          font-size: 12px;
          font-weight: 600;

          &.good {
            color: #4caf50;
          }
          &.needs-work {
            color: #ff9800;
          }
          &.poor {
            color: #f44336;
          }
        }
      }

      .main-tabs {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 16px;
      }

      .filters-row {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .issues-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .issue-card {
        background: #16213e;
        border-radius: 12px;
        padding: 20px;
        border-left: 4px solid transparent;

        &.critical {
          border-left-color: #f44336;
        }
        &.warning {
          border-left-color: #ff9800;
        }
        &.info {
          border-left-color: #2196f3;
        }
        &.fixed {
          opacity: 0.7;
        }

        .issue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .issue-type {
            display: flex;
            align-items: center;
            gap: 8px;

            mat-icon {
              &.critical {
                color: #f44336;
              }
              &.warning {
                color: #ff9800;
              }
              &.info {
                color: #2196f3;
              }
            }

            .type-label {
              font-size: 12px;
              font-weight: 600;
              text-transform: capitalize;

              .critical & {
                color: #f44336;
              }
              .warning & {
                color: #ff9800;
              }
              .info & {
                color: #2196f3;
              }
            }
          }

          .issue-category {
            background: rgba(233, 69, 96, 0.2);
            color: #e94560;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            text-transform: capitalize;
          }
        }

        .issue-content {
          h4 {
            margin: 0 0 8px;
            font-size: 16px;
            color: #ffffff;
          }

          p {
            margin: 0 0 12px;
            font-size: 14px;
            color: #a0a0b8;
            line-height: 1.5;
          }

          .issue-meta {
            display: flex;
            gap: 16px;
            margin-bottom: 12px;

            .impact {
              font-size: 12px;
              font-weight: 600;
              text-transform: capitalize;

              &.high {
                color: #f44336;
              }
              &.medium {
                color: #ff9800;
              }
              &.low {
                color: #4caf50;
              }
            }

            .affected {
              font-size: 12px;
              color: #a0a0b8;
            }
          }

          .affected-urls {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;

            code {
              background: rgba(255, 255, 255, 0.05);
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              color: #2196f3;
            }

            .more {
              font-size: 12px;
              color: #a0a0b8;
            }
          }
        }

        .issue-actions {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 12px;

          .recommendation {
            font-size: 13px;
            color: #a0a0b8;
            line-height: 1.5;

            strong {
              color: #ffffff;
            }
          }

          .fixed-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #4caf50;
            font-size: 13px;
            font-weight: 600;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: 60px;
        color: #a0a0b8;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: #4caf50;
          opacity: 0.5;
        }

        h3 {
          margin: 16px 0 8px;
          color: #ffffff;
        }

        p {
          margin: 0;
        }
      }

      .recommendations-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .recommendation-item {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #16213e;
        padding: 16px;
        border-radius: 8px;

        mat-icon {
          color: #ff9800;
        }

        span {
          color: #ffffff;
          font-size: 14px;
        }
      }

      .history-placeholder,
      .empty-state {
        text-align: center;
        padding: 60px;
        color: #a0a0b8;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          opacity: 0.3;
        }

        h3 {
          margin: 16px 0 8px;
          color: #ffffff;
        }

        p {
          margin: 0;
        }
      }
    `,
  ],
})
export class SiteHealthComponent implements OnInit {
  issues = signal<SiteHealthIssue[]>([]);
  report = signal<SiteHealthReport>({
    overallScore: 0,
    performance: { score: 0, fcp: 0, lcp: 0, cls: 0, ttfb: 0 },
    accessibility: { score: 0, issues: 0 },
    bestPractices: { score: 0, issues: 0 },
    seo: { score: 0, issues: 0 },
    security: { score: 0, issues: 0 },
  });

  filterCategory = 'all';
  filterType = 'all';

  recommendations = [
    'Implement lazy loading for images below the fold',
    'Add a service worker for offline caching',
    'Enable Brotli or gzip compression',
    'Preconnect to critical third-party domains',
    'Add structured data for your main content types',
    'Set up proper caching headers',
    'Implement Core Web Vitals optimization',
  ];

  filteredIssues = computed(() => {
    let filtered = this.issues();
    if (this.filterCategory !== 'all') {
      filtered = filtered.filter((i) => i.category === this.filterCategory);
    }
    if (this.filterType !== 'all') {
      filtered = filtered.filter((i) => i.type === this.filterType);
    }
    return filtered;
  });

  constructor(private siteHealthService: SiteHealthService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.issues.set(this.siteHealthService.getIssues());
    this.report.set(this.siteHealthService.getReport());
  }

  applyFilters(): void {
    // Filter is handled by computed signal
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'good';
    if (score >= 50) return 'needs-work';
    return 'poor';
  }

  getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Work';
    return 'Poor';
  }

  getCircleDash(score: number): string {
    const circumference = 2 * Math.PI * 45;
    const percent = (score / 100) * circumference;
    return `${percent} ${circumference}`;
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'help';
    }
  }

  getMetricPercent(value: number, good: number, poor: number): number {
    if (value <= good) return 100;
    if (value >= poor) return 0;
    return ((poor - value) / (poor - good)) * 100;
  }

  getMetricClass(value: number, good: number, poor: number): string {
    const percent = this.getMetricPercent(value, good, poor);
    if (percent >= 75) return 'good';
    if (percent >= 40) return 'needs-work';
    return 'poor';
  }

  getMetricStatus(value: number, good: number, poor: number): string {
    const percent = this.getMetricPercent(value, good, poor);
    if (percent >= 75) return 'Good';
    if (percent >= 40) return 'Needs Improvement';
    return 'Poor';
  }

  runHealthCheck(): void {
    this.report.set(this.siteHealthService.runHealthCheck());
    this.loadData();
  }

  fixIssue(issue: SiteHealthIssue): void {
    this.siteHealthService.fixIssue(issue.id);
    this.loadData();
  }

  ignoreIssue(issue: SiteHealthIssue): void {
    this.siteHealthService.ignoreIssue(issue.id);
    this.loadData();
  }

  reopenIssue(issue: SiteHealthIssue): void {
    this.siteHealthService.reopenIssue(issue.id);
    this.loadData();
  }
}
