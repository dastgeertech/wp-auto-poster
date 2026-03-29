import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AnalyticsService, AnalyticsData } from '../../core/services/analytics.service';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div class="analytics-dashboard">
      <div class="dashboard-header">
        <div class="header-left">
          <h2><mat-icon>analytics</mat-icon> Analytics Dashboard</h2>
          <p>Track your content performance and SEO metrics</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="refreshData()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
          <button mat-stroked-button (click)="generateMockData()">
            <mat-icon>add_chart</mat-icon> Generate Demo Data
          </button>
          <button mat-stroked-button (click)="clearData()">
            <mat-icon>delete_sweep</mat-icon> Clear
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon posts">
            <mat-icon>article</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ analytics()?.totalPosts || 0 }}</span>
            <span class="stat-label">Total Posts</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon views">
            <mat-icon>visibility</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ formatNumber(analytics()?.totalViews || 0) }}</span>
            <span class="stat-label">Total Views</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon seo">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ analytics()?.avgSeoScore || 0 }}%</span>
            <span class="stat-label">Avg SEO Score</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon week">
            <mat-icon>date_range</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ analytics()?.postsThisWeek || 0 }}</span>
            <span class="stat-label">This Week</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <!-- Publishing Trend -->
        <div class="chart-card">
          <h3><mat-icon>show_chart</mat-icon> Publishing Trend (7 Days)</h3>
          <div class="bar-chart">
            @for (day of analytics()?.publishingTrend || []; track day.date) {
              <div class="bar-column">
                <div class="bar-wrapper">
                  <div class="bar" [style.height.%]="getBarHeight(day.count)"></div>
                </div>
                <span class="bar-label">{{ formatDate(day.date) }}</span>
                <span class="bar-value">{{ day.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- SEO Distribution -->
        <div class="chart-card">
          <h3><mat-icon>donut_large</mat-icon> SEO Score Distribution</h3>
          <div class="donut-chart">
            <div class="donut-center">
              <span class="donut-value">{{ analytics()?.avgSeoScore || 0 }}%</span>
              <span class="donut-label">Avg Score</span>
            </div>
            <svg viewBox="0 0 100 100" class="donut-svg">
              @for (segment of getSeoSegments(); track segment.range; let i = $index) {
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  [attr.stroke]="segment.color"
                  stroke-width="12"
                  [attr.stroke-dasharray]="segment.dashArray"
                  [attr.stroke-dashoffset]="segment.dashOffset"
                  transform="rotate(-90 50 50)"
                />
              }
            </svg>
          </div>
          <div class="legend">
            @for (item of analytics()?.seoDistribution || []; track item.range) {
              <div class="legend-item">
                <span class="legend-color" [style.background]="getLegendColor(item.range)"></span>
                <span class="legend-label">{{ item.range }}</span>
                <span class="legend-value">{{ item.count }} ({{ item.percent }}%)</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="bottom-row">
        <!-- Top Keywords -->
        <div class="panel keywords-panel">
          <h3><mat-icon>label</mat-icon> Top Keywords</h3>
          @if ((analytics()?.topKeywords || []).length > 0) {
            <div class="keywords-list">
              @for (keyword of analytics()?.topKeywords || []; track keyword.keyword) {
                <div class="keyword-row">
                  <div class="keyword-info">
                    <span class="keyword-name">{{ keyword.keyword }}</span>
                    <span class="keyword-count">{{ keyword.count }} posts</span>
                  </div>
                  <div class="keyword-score">
                    <div class="score-bar">
                      <div class="score-fill" [style.width.%]="keyword.avgScore"></div>
                    </div>
                    <span class="score-value">{{ keyword.avgScore }}%</span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <mat-icon>label_off</mat-icon>
              <p>No keyword data yet</p>
            </div>
          }
        </div>

        <!-- Language Breakdown -->
        <div class="panel languages-panel">
          <h3><mat-icon>language</mat-icon> Language Breakdown</h3>
          @if ((analytics()?.languageBreakdown || []).length > 0) {
            <div class="languages-list">
              @for (lang of analytics()?.languageBreakdown || []; track lang.language) {
                <div class="language-row">
                  <span class="lang-code">{{ lang.language.toUpperCase() }}</span>
                  <div class="lang-bar-wrapper">
                    <div class="lang-bar" [style.width.%]="lang.percent"></div>
                  </div>
                  <span class="lang-count">{{ lang.count }}</span>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <mat-icon>language</mat-icon>
              <p>No language data yet</p>
            </div>
          }
        </div>

        <!-- Top Posts -->
        <div class="panel posts-panel">
          <h3><mat-icon>star</mat-icon> Top Performing Posts</h3>
          @if ((analytics()?.topPerformingPosts || []).length > 0) {
            <div class="posts-list">
              @for (post of analytics()?.topPerformingPosts || []; track post.id) {
                <div class="post-row">
                  <div class="post-rank">#{{ $index + 1 }}</div>
                  <div class="post-info">
                    <span class="post-title">{{ post.title }}</span>
                    <span class="post-date">{{ post.date | date: 'mediumDate' }}</span>
                  </div>
                  <div class="post-stats">
                    <div class="stat-item">
                      <mat-icon>visibility</mat-icon>
                      {{ formatNumber(post.views) }}
                    </div>
                    <div class="stat-item">
                      <mat-icon>trending_up</mat-icon>
                      {{ post.seoScore }}%
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <mat-icon>article</mat-icon>
              <p>No posts yet</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .analytics-dashboard {
        padding: 24px;
        max-width: 1600px;
        margin: 0 auto;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;

        .header-left {
          h2 {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 0 0 8px;
            font-size: 24px;
            color: #ffffff;

            mat-icon {
              color: #e94560;
            }
          }

          p {
            margin: 0;
            color: #a0a0b8;
            font-size: 14px;
          }
        }

        .header-actions {
          display: flex;
          gap: 12px;

          button {
            color: #e94560;
            border-color: #e94560;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
        }
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
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);

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

          &.posts {
            background: linear-gradient(135deg, #e94560, #ff6b6b);
          }
          &.views {
            background: linear-gradient(135deg, #9c27b0, #ba68c8);
          }
          &.seo {
            background: linear-gradient(135deg, #00d9a5, #00b894);
          }
          &.week {
            background: linear-gradient(135deg, #2196f3, #64b5f6);
          }
        }

        .stat-info {
          display: flex;
          flex-direction: column;

          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
          }

          .stat-label {
            font-size: 13px;
            color: #a0a0b8;
          }
        }
      }

      .charts-row {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
        margin-bottom: 24px;
      }

      .chart-card {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);

        h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 20px;
          font-size: 16px;
          color: #ffffff;

          mat-icon {
            color: #e94560;
          }
        }
      }

      .bar-chart {
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        height: 200px;
        padding-top: 20px;

        .bar-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          .bar-wrapper {
            height: 160px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            width: 100%;
          }

          .bar {
            width: 40px;
            background: linear-gradient(180deg, #e94560, #ff6b6b);
            border-radius: 6px 6px 0 0;
            min-height: 4px;
            transition: height 0.3s ease;
          }

          .bar-label {
            font-size: 11px;
            color: #666;
          }

          .bar-value {
            font-size: 12px;
            font-weight: 600;
            color: #ffffff;
          }
        }
      }

      .donut-chart {
        position: relative;
        width: 180px;
        height: 180px;
        margin: 0 auto 20px;

        .donut-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;

          .donut-value {
            display: block;
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
          }

          .donut-label {
            display: block;
            font-size: 12px;
            color: #666;
          }
        }

        .donut-svg {
          width: 100%;
          height: 100%;
        }
      }

      .legend {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;

          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 3px;
          }

          .legend-label {
            color: #a0a0b8;
            flex: 1;
          }

          .legend-value {
            color: #ffffff;
            font-weight: 500;
          }
        }
      }

      .bottom-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }

      .panel {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);

        h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 16px;
          font-size: 15px;
          color: #ffffff;

          mat-icon {
            color: #e94560;
          }
        }
      }

      .keywords-list,
      .languages-list,
      .posts-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .keyword-row {
        display: flex;
        align-items: center;
        gap: 12px;

        .keyword-info {
          flex: 1;
          min-width: 0;

          .keyword-name {
            display: block;
            font-size: 13px;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .keyword-count {
            font-size: 11px;
            color: #666;
          }
        }

        .keyword-score {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 120px;

          .score-bar {
            flex: 1;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;

            .score-fill {
              height: 100%;
              background: linear-gradient(90deg, #00d9a5, #00b894);
              border-radius: 3px;
            }
          }

          .score-value {
            font-size: 12px;
            font-weight: 600;
            color: #00d9a5;
            min-width: 35px;
            text-align: right;
          }
        }
      }

      .language-row {
        display: flex;
        align-items: center;
        gap: 12px;

        .lang-code {
          width: 40px;
          font-size: 12px;
          font-weight: 600;
          color: #e94560;
        }

        .lang-bar-wrapper {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;

          .lang-bar {
            height: 100%;
            background: linear-gradient(90deg, #e94560, #ff6b6b);
            border-radius: 4px;
          }
        }

        .lang-count {
          font-size: 12px;
          color: #ffffff;
          min-width: 30px;
          text-align: right;
        }
      }

      .post-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;

        .post-rank {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(233, 69, 96, 0.2);
          color: #e94560;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .post-info {
          flex: 1;
          min-width: 0;

          .post-title {
            display: block;
            font-size: 12px;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .post-date {
            font-size: 10px;
            color: #666;
          }
        }

        .post-stats {
          display: flex;
          gap: 12px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #a0a0b8;

            mat-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
              color: #00d9a5;
            }
          }
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
        color: #666;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          opacity: 0.3;
        }

        p {
          margin: 12px 0 0;
          font-size: 13px;
        }
      }

      @media (max-width: 1200px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .charts-row {
          grid-template-columns: 1fr;
        }

        .bottom-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AnalyticsDashboardComponent implements OnInit {
  analytics = signal<AnalyticsData | null>(null);

  constructor(
    private analyticsService: AnalyticsService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    const data = this.analyticsService.getAnalytics();
    this.analytics.set(data);
  }

  refreshData(): void {
    this.loadAnalytics();
    this.snackBar.open('Analytics refreshed', 'Close', { duration: 2000 });
  }

  generateMockData(): void {
    this.analyticsService.generateMockData(50);
    this.loadAnalytics();
    this.snackBar.open('Demo data generated!', 'Close', { duration: 2000 });
  }

  clearData(): void {
    this.analyticsService.clearAnalytics();
    this.loadAnalytics();
    this.snackBar.open('Analytics cleared', 'Close', { duration: 2000 });
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

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  getBarHeight(count: number): number {
    const max = Math.max(...(this.analytics()?.publishingTrend || []).map((d) => d.count), 1);
    return (count / max) * 100;
  }

  getSeoSegments(): { range: string; color: string; dashArray: string; dashOffset: number }[] {
    const distribution = this.analytics()?.seoDistribution || [];
    const total = distribution.reduce((sum, d) => sum + d.count, 0) || 1;
    const colors: { [key: string]: string } = {
      '90-100': '#00d9a5',
      '80-89': '#64b5f6',
      '70-79': '#ffc107',
      '60-69': '#ff9800',
      '50-59': '#ff6b6b',
      '0-49': '#e94560',
    };

    const circumference = 2 * Math.PI * 40;
    let offset = 0;

    return distribution.map((item) => {
      const percent = (item.count / total) * 100;
      const dashLength = (percent / 100) * circumference;
      const segment = {
        range: item.range,
        color: colors[item.range] || '#666',
        dashArray: `${dashLength} ${circumference - dashLength}`,
        dashOffset: -offset,
      };
      offset += dashLength;
      return segment;
    });
  }

  getLegendColor(range: string): string {
    const colors: { [key: string]: string } = {
      '90-100': '#00d9a5',
      '80-89': '#64b5f6',
      '70-79': '#ffc107',
      '60-69': '#ff9800',
      '50-59': '#ff6b6b',
      '0-49': '#e94560',
    };
    return colors[range] || '#666';
  }
}
