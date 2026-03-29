import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ContentGapService, ContentGap, GapStats } from '../../core/services/content-gap.service';

@Component({
  selector: 'app-content-gap',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="gap-container">
      <header class="page-header">
        <div class="header-content">
          <h1><mat-icon>trending_up</mat-icon> Content Gap Analyzer</h1>
          <p>Discover topics your competitors rank for that you don't</p>
        </div>
      </header>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-icon>search</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().totalGaps }}</span>
            <span class="label">Content Gaps</span>
          </div>
        </mat-card>
        <mat-card class="stat-card high">
          <mat-icon>priority_high</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().highPriority }}</span>
            <span class="label">High Priority</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>visibility</mat-icon>
          <div class="stat-info">
            <span class="value">{{ formatNumber(stats().totalSearchVolume) }}</span>
            <span class="label">Search Volume</span>
          </div>
        </mat-card>
        <mat-card class="stat-card progress">
          <mat-icon>edit</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().contentInProgress }}</span>
            <span class="label">In Progress</span>
          </div>
        </mat-card>
      </div>

      <mat-tab-group animationDuration="300ms">
        <mat-tab label="All Gaps">
          <div class="tab-content">
            <div class="gaps-list">
              @for (gap of gaps(); track gap.id) {
                <mat-card class="gap-card" [class]="gap.priority">
                  <div class="gap-header">
                    <div class="gap-title">
                      <span class="priority-badge" [class]="gap.priority">{{ gap.priority }}</span>
                      <span class="content-type">{{ gap.contentType }}</span>
                      <span class="status-badge" [class]="gap.status">{{
                        gap.status.replace('_', ' ')
                      }}</span>
                    </div>
                    <div class="gap-metrics">
                      <span class="metric">
                        <mat-icon>search</mat-icon>
                        {{ formatNumber(gap.searchVolume) }}
                      </span>
                      <span class="metric">
                        <mat-icon>trending_up</mat-icon>
                        {{ gap.difficulty }}%
                      </span>
                      @if (gap.yourRank) {
                        <span class="rank">Your Rank: #{{ gap.yourRank }}</span>
                      }
                    </div>
                  </div>
                  <h3>{{ gap.topic }}</h3>
                  <p class="angle">{{ gap.suggestedAngle }}</p>
                  @if (gap.competitorRanks.length > 0) {
                    <div class="competitor-ranks">
                      <span class="label">Competitors:</span>
                      @for (comp of gap.competitorRanks; track comp.competitor) {
                        <span class="comp-rank">{{ comp.competitor }}: #{{ comp.rank }}</span>
                      }
                    </div>
                  }
                  <div class="gap-actions">
                    @if (gap.status === 'not_started') {
                      <button mat-raised-button color="primary" (click)="startContent(gap.id)">
                        <mat-icon>play_arrow</mat-icon>
                        Start Content
                      </button>
                    } @else if (gap.status === 'in_progress') {
                      <button mat-raised-button color="accent" (click)="completeContent(gap.id)">
                        <mat-icon>check</mat-icon>
                        Mark Complete
                      </button>
                    } @else {
                      <span class="completed">
                        <mat-icon>check_circle</mat-icon>
                        Completed
                      </span>
                    }
                  </div>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>
        <mat-tab label="High Priority">
          <div class="tab-content">
            <div class="gaps-list">
              @for (gap of highPriorityGaps(); track gap.id) {
                <mat-card class="gap-card high">
                  <h3>{{ gap.topic }}</h3>
                  <p class="angle">{{ gap.suggestedAngle }}</p>
                  <div class="gap-meta">
                    <span>{{ formatNumber(gap.searchVolume) }} searches/mo</span>
                    <span>{{ gap.difficulty }}% difficulty</span>
                  </div>
                  <button mat-raised-button color="primary">
                    <mat-icon>add</mat-icon>
                    Create Content
                  </button>
                </mat-card>
              } @empty {
                <p class="no-gaps">No high priority gaps. Great job!</p>
              }
            </div>
          </div>
        </mat-tab>
        <mat-tab label="In Progress">
          <div class="tab-content">
            <div class="gaps-list">
              @for (gap of inProgressGaps(); track gap.id) {
                <mat-card class="gap-card">
                  <h3>{{ gap.topic }}</h3>
                  <mat-progress-bar mode="determinate" value="60"></mat-progress-bar>
                  <p class="progress-text">Draft in progress...</p>
                  <button mat-raised-button color="accent" (click)="completeContent(gap.id)">
                    <mat-icon>check</mat-icon>
                    Complete
                  </button>
                </mat-card>
              } @empty {
                <p class="no-gaps">No content in progress</p>
              }
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .gap-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: 24px;
        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 28px;
          color: #fff;
          mat-icon {
            color: #e94560;
          }
        }
        p {
          margin: 8px 0 0;
          color: #a0a0b8;
        }
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      .stat-card {
        background: #1a1a2e;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        &.high {
          border-color: rgba(244, 67, 54, 0.3);
          mat-icon {
            color: #f44336;
          }
        }
        &.progress {
          border-color: rgba(255, 152, 0, 0.3);
          mat-icon {
            color: #ff9800;
          }
        }
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #e94560;
        }
        .stat-info {
          .value {
            display: block;
            font-size: 24px;
            font-weight: 700;
            color: #fff;
          }
          .label {
            font-size: 13px;
            color: #a0a0b8;
          }
        }
      }
      .gaps-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .gap-card {
        background: #1a1a2e;
        padding: 24px;
        border-left: 4px solid transparent;
        &.high {
          border-left-color: #f44336;
        }
        &.medium {
          border-left-color: #ff9800;
        }
        &.low {
          border-left-color: #4caf50;
        }
        .gap-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          .gap-title {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            .priority-badge {
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              text-transform: capitalize;
              &.high {
                background: rgba(244, 67, 54, 0.2);
                color: #f44336;
              }
              &.medium {
                background: rgba(255, 152, 0, 0.2);
                color: #ff9800;
              }
              &.low {
                background: rgba(76, 175, 80, 0.2);
                color: #4caf50;
              }
            }
            .content-type,
            .status-badge {
              font-size: 11px;
              color: #a0a0b8;
              text-transform: capitalize;
              &.not_started {
                background: rgba(158, 158, 158, 0.2);
                color: #9e9e9e;
                padding: 2px 8px;
                border-radius: 4px;
              }
              &.in_progress {
                background: rgba(255, 152, 0, 0.2);
                color: #ff9800;
                padding: 2px 8px;
                border-radius: 4px;
              }
              &.completed {
                background: rgba(76, 175, 80, 0.2);
                color: #4caf50;
                padding: 2px 8px;
                border-radius: 4px;
              }
            }
          }
          .gap-metrics {
            display: flex;
            gap: 16px;
            .metric {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 13px;
              color: #a0a0b8;
              mat-icon {
                font-size: 16px;
                width: 16px;
                height: 16px;
              }
            }
            .rank {
              font-size: 12px;
              color: #e94560;
              font-weight: 600;
            }
          }
        }
        h3 {
          margin: 0 0 8px;
          color: #fff;
          font-size: 18px;
        }
        .angle {
          color: #a0a0b8;
          font-size: 14px;
          margin: 0 0 12px;
          line-height: 1.5;
        }
        .competitor-ranks {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          font-size: 12px;
          .label {
            color: #a0a0b8;
          }
          .comp-rank {
            background: rgba(255, 255, 255, 0.05);
            padding: 2px 8px;
            border-radius: 4px;
            color: #fff;
          }
        }
        .gap-actions {
          display: flex;
          gap: 12px;
          .completed {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #4caf50;
            font-weight: 600;
            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
        }
        .gap-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #a0a0b8;
          margin-bottom: 16px;
        }
        .progress-text {
          font-size: 13px;
          color: #a0a0b8;
          margin: 8px 0;
        }
      }
      .no-gaps {
        text-align: center;
        color: #4caf50;
        padding: 40px;
      }
    `,
  ],
})
export class ContentGapComponent implements OnInit {
  gaps = signal<ContentGap[]>([]);
  stats = signal<GapStats>({
    totalGaps: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    totalSearchVolume: 0,
    contentInProgress: 0,
    contentCompleted: 0,
  });
  highPriorityGaps = signal<ContentGap[]>([]);
  inProgressGaps = signal<ContentGap[]>([]);

  constructor(private contentGapService: ContentGapService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.gaps.set(this.contentGapService.getGaps());
    this.stats.set(this.contentGapService.getStats());
    this.highPriorityGaps.set(this.contentGapService.getHighPriorityGaps());
    this.inProgressGaps.set(this.gaps().filter((g) => g.status === 'in_progress'));
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  startContent(id: string): void {
    this.contentGapService.updateGapStatus(id, 'in_progress');
    this.loadData();
  }

  completeContent(id: string): void {
    this.contentGapService.updateGapStatus(id, 'completed');
    this.loadData();
  }
}
