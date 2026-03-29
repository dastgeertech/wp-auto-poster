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
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  KeywordTrackerService,
  TrackedKeyword,
  KeywordStats,
} from '../../core/services/keyword-tracker.service';

@Component({
  selector: 'app-keyword-tracker',
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
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="keyword-container">
      <header class="page-header">
        <div class="header-content">
          <h1>
            <mat-icon>trending_up</mat-icon>
            Keyword Rank Tracker
          </h1>
          <p>Monitor keyword positions and track your SEO progress</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="refreshRankings()">
            <mat-icon>refresh</mat-icon>
            Refresh Rankings
          </button>
        </div>
      </header>

      <div class="stats-grid">
        <mat-card class="stat-card highlight">
          <div class="stat-icon">
            <mat-icon>keyword</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats().totalKeywords }}</span>
            <span class="stat-label">Tracked Keywords</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <div class="stat-icon position">
            <mat-icon>place</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">#{{ stats().avgPosition }}</span>
            <span class="stat-label">Avg Position</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <div class="stat-icon volume">
            <mat-icon>visibility</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ formatNumber(stats().totalSearchVolume) }}</span>
            <span class="stat-label">Monthly Searches</span>
          </div>
        </mat-card>
        <mat-card class="stat-card improved">
          <div class="stat-icon">
            <mat-icon>arrow_upward</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ positionChanges().improved }}</span>
            <span class="stat-label">Improved</span>
          </div>
        </mat-card>
        <mat-card class="stat-card declined">
          <div class="stat-icon">
            <mat-icon>arrow_downward</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ positionChanges().declined }}</span>
            <span class="stat-label">Declined</span>
          </div>
        </mat-card>
      </div>

      <div class="top-movers">
        <h3>Top Position Movers</h3>
        <div class="movers-list">
          @for (mover of stats().topMovers; track mover.keyword) {
            <div
              class="mover-card"
              [class.positive]="mover.change > 0"
              [class.negative]="mover.change < 0"
            >
              <span class="keyword">{{ mover.keyword }}</span>
              <span class="change">
                <mat-icon>{{ mover.change > 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                {{ mover.change > 0 ? '+' : '' }}{{ mover.change }} positions
              </span>
            </div>
          } @empty {
            <p class="no-movers">No significant position changes this period</p>
          }
        </div>
      </div>

      <mat-tab-group class="main-tabs" animationDuration="300ms">
        <mat-tab label="All Keywords">
          <div class="tab-content">
            <div class="keywords-table">
              <table mat-table [dataSource]="keywords()">
                <ng-container matColumnDef="keyword">
                  <th mat-header-cell *matHeaderCellDef>Keyword</th>
                  <td mat-cell *matCellDef="let kw">
                    <div class="keyword-cell">
                      <span class="keyword-text">{{ kw.keyword }}</span>
                      <span class="url">{{ kw.url }}</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="rank">
                  <th mat-header-cell *matHeaderCellDef>Current Rank</th>
                  <td mat-cell *matCellDef="let kw">
                    <div class="rank-cell">
                      <span
                        class="current-rank"
                        [class.top3]="kw.currentRank <= 3"
                        [class.top10]="kw.currentRank <= 10 && kw.currentRank > 3"
                      >
                        #{{ kw.currentRank }}
                      </span>
                      <span class="previous-rank"> (was #{{ kw.previousRank }}) </span>
                      <span
                        class="rank-change"
                        [class.up]="kw.currentRank < kw.previousRank"
                        [class.down]="kw.currentRank > kw.previousRank"
                      >
                        <mat-icon>{{
                          kw.currentRank < kw.previousRank
                            ? 'arrow_upward'
                            : kw.currentRank > kw.previousRank
                              ? 'arrow_downward'
                              : 'remove'
                        }}</mat-icon>
                      </span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="volume">
                  <th mat-header-cell *matHeaderCellDef>Search Volume</th>
                  <td mat-cell *matCellDef="let kw">{{ formatNumber(kw.searchVolume) }}/mo</td>
                </ng-container>

                <ng-container matColumnDef="difficulty">
                  <th mat-header-cell *matHeaderCellDef>Difficulty</th>
                  <td mat-cell *matCellDef="let kw">
                    <div class="difficulty-cell">
                      <mat-progress-bar
                        mode="determinate"
                        [value]="kw.difficulty"
                      ></mat-progress-bar>
                      <span>{{ kw.difficulty }}%</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="trend">
                  <th mat-header-cell *matHeaderCellDef>Trend</th>
                  <td mat-cell *matCellDef="let kw">
                    <div class="trend-cell">
                      @for (val of kw.trend.slice(-6); track $index) {
                        <span class="trend-bar" [style.height.%]="100 - val"></span>
                      }
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="engine">
                  <th mat-header-cell *matHeaderCellDef>Engine</th>
                  <td mat-cell *matCellDef="let kw">
                    <span class="engine-badge">{{ kw.searchEngine }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let kw">
                    <button mat-icon-button [matMenuTriggerFor]="menu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item>
                        <mat-icon>edit</mat-icon>
                        <span>Edit</span>
                      </button>
                      <button mat-menu-item>
                        <mat-icon>delete</mat-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Opportunities">
          <div class="tab-content">
            <h3>Quick Wins - Keywords in Position 11-20</h3>
            <div class="opportunities-grid">
              @for (kw of stats().opportunities; track kw.id) {
                <mat-card class="opportunity-card">
                  <div class="opp-header">
                    <h4>{{ kw.keyword }}</h4>
                    <span class="position-badge">#{{ kw.currentRank }}</span>
                  </div>
                  <div class="opp-stats">
                    <span>{{ formatNumber(kw.searchVolume) }} searches/mo</span>
                    <span>{{ kw.difficulty }}% difficulty</span>
                  </div>
                  <button mat-stroked-button color="primary">Optimize Content</button>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="SERPs">
          <div class="tab-content">
            <div class="serp-placeholder">
              <mat-icon>table_chart</mat-icon>
              <h3>Search Engine Results Pages</h3>
              <p>View top ranking pages for your keywords</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .keyword-container {
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

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

        &.highlight {
          border-color: rgba(233, 69, 96, 0.3);
        }
        &.improved {
          border-color: rgba(76, 175, 80, 0.3);
        }
        &.declined {
          border-color: rgba(244, 67, 54, 0.3);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(233, 69, 96, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            color: #e94560;
          }

          &.position {
            background: rgba(33, 150, 243, 0.2);
            mat-icon {
              color: #2196f3;
            }
          }
          &.volume {
            background: rgba(156, 39, 176, 0.2);
            mat-icon {
              color: #9c27b0;
            }
          }
        }

        .stat-info {
          .stat-value {
            display: block;
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

      .top-movers {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;

        h3 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #ffffff;
        }

        .movers-list {
          display: flex;
          gap: 12px;
          overflow-x: auto;
        }

        .mover-card {
          background: #16213e;
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 200px;
          border: 1px solid transparent;

          &.positive {
            border-color: rgba(76, 175, 80, 0.3);
          }
          &.negative {
            border-color: rgba(244, 67, 54, 0.3);
          }

          .keyword {
            flex: 1;
            font-weight: 500;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .change {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            font-weight: 600;

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }

            .positive & {
              color: #4caf50;
            }
            .negative & {
              color: #f44336;
            }
          }
        }

        .no-movers {
          color: #a0a0b8;
          font-size: 14px;
          margin: 0;
        }
      }

      .main-tabs {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 16px;
      }

      .keywords-table {
        overflow-x: auto;

        table {
          width: 100%;
          background: transparent;

          th {
            color: #a0a0b8;
            font-weight: 600;
          }

          td {
            color: #ffffff;
          }

          .keyword-cell {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .keyword-text {
              font-weight: 500;
            }

            .url {
              font-size: 12px;
              color: #a0a0b8;
            }
          }

          .rank-cell {
            display: flex;
            align-items: center;
            gap: 8px;

            .current-rank {
              font-size: 18px;
              font-weight: 700;
              color: #ffffff;

              &.top3 {
                color: #ffd700;
              }
              &.top10 {
                color: #4caf50;
              }
            }

            .previous-rank {
              font-size: 12px;
              color: #a0a0b8;
            }

            .rank-change {
              mat-icon {
                font-size: 18px;
                width: 18px;
                height: 18px;
              }

              &.up mat-icon {
                color: #4caf50;
              }
              &.down mat-icon {
                color: #f44336;
              }
            }
          }

          .difficulty-cell {
            display: flex;
            align-items: center;
            gap: 8px;

            mat-progress-bar {
              width: 60px;
              height: 6px;
              border-radius: 3px;
            }

            span {
              font-size: 12px;
              min-width: 35px;
            }
          }

          .trend-cell {
            display: flex;
            align-items: flex-end;
            gap: 2px;
            height: 30px;

            .trend-bar {
              width: 6px;
              background: #e94560;
              border-radius: 2px;
              min-height: 4px;
            }
          }

          .engine-badge {
            background: rgba(33, 150, 243, 0.2);
            color: #2196f3;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            text-transform: capitalize;
          }
        }
      }

      .opportunities-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }

      .opportunity-card {
        background: #16213e;
        padding: 16px;

        .opp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;

          h4 {
            margin: 0;
            font-size: 14px;
            color: #ffffff;
          }

          .position-badge {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
        }

        .opp-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #a0a0b8;
          margin-bottom: 12px;
        }
      }

      .serp-placeholder {
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
export class KeywordTrackerComponent implements OnInit {
  keywords = signal<TrackedKeyword[]>([]);
  stats = signal<KeywordStats>({
    totalKeywords: 0,
    avgPosition: 0,
    topMovers: [],
    totalSearchVolume: 0,
    opportunities: [],
  });

  displayedColumns = ['keyword', 'rank', 'volume', 'difficulty', 'trend', 'engine', 'actions'];

  positionChanges = computed(() => {
    return this.keywordTrackerService.getPositionChanges();
  });

  constructor(private keywordTrackerService: KeywordTrackerService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.keywords.set(this.keywordTrackerService.getKeywords());
    this.stats.set(this.keywordTrackerService.getStats());
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  refreshRankings(): void {
    this.keywordTrackerService.refreshRankings();
    this.loadData();
  }
}
