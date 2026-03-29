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
import { MatSortModule } from '@angular/material/sort';
import { BacklinkService, Backlink, BacklinkStats } from '../../core/services/backlink.service';

@Component({
  selector: 'app-backlink-manager',
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
    MatSortModule,
  ],
  template: `
    <div class="backlink-container">
      <header class="page-header">
        <div class="header-content">
          <h1>
            <mat-icon>link</mat-icon>
            Backlink Manager
          </h1>
          <p>Track, analyze, and build powerful backlinks to boost your SEO</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="checkBacklinks()">
            <mat-icon>refresh</mat-icon>
            Check Backlinks
          </button>
        </div>
      </header>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <div class="stat-icon total">
            <mat-icon>link</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats().totalBacklinks }}</span>
            <span class="stat-label">Total Backlinks</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <div class="stat-icon dofollow">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats().dofollow }}</span>
            <span class="stat-label">Do-Follow</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <div class="stat-icon new">
            <mat-icon>add_circle</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats().newThisWeek }}</span>
            <span class="stat-label">New This Week</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <div class="stat-icon lost">
            <mat-icon>remove_circle</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats().lostThisWeek }}</span>
            <span class="stat-label">Lost This Week</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <div class="stat-icon da">
            <mat-icon>star</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats().avgDomainAuthority }}</span>
            <span class="stat-label">Avg Domain Auth</span>
          </div>
        </mat-card>
      </div>

      <mat-tab-group class="main-tabs" animationDuration="300ms">
        <mat-tab label="All Backlinks">
          <div class="tab-content">
            <div class="filters-row">
              <mat-chip-listbox [(ngModel)]="filterStatus" (change)="applyFilters()">
                <mat-chip-option value="all">All</mat-chip-option>
                <mat-chip-option value="active">Active</mat-chip-option>
                <mat-chip-option value="new">New</mat-chip-option>
                <mat-chip-option value="lost">Lost</mat-chip-option>
                <mat-chip-option value="broken">Broken</mat-chip-option>
              </mat-chip-listbox>
              <mat-chip-listbox [(ngModel)]="filterType" (change)="applyFilters()">
                <mat-chip-option value="all">All Types</mat-chip-option>
                <mat-chip-option value="dofollow">Do-Follow</mat-chip-option>
                <mat-chip-option value="nofollow">No-Follow</mat-chip-option>
                <mat-chip-option value="sponsored">Sponsored</mat-chip-option>
              </mat-chip-listbox>
            </div>

            <div class="backlinks-table">
              <table mat-table [dataSource]="filteredBacklinks()">
                <ng-container matColumnDef="source">
                  <th mat-header-cell *matHeaderCellDef>Source</th>
                  <td mat-cell *matCellDef="let link">
                    <div class="source-cell">
                      <a [href]="link.sourceUrl" target="_blank" class="source-link">
                        {{ link.domain }}
                      </a>
                      <span class="anchor-text">"{{ link.anchorText }}"</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="target">
                  <th mat-header-cell *matHeaderCellDef>Target</th>
                  <td mat-cell *matCellDef="let link">
                    <a [href]="link.targetUrl" target="_blank" class="target-link">
                      {{ truncateUrl(link.targetUrl) }}
                    </a>
                  </td>
                </ng-container>

                <ng-container matColumnDef="authority">
                  <th mat-header-cell *matHeaderCellDef>Authority</th>
                  <td mat-cell *matCellDef="let link">
                    <div class="authority-bars">
                      <div class="auth-item">
                        <span class="auth-label">DA</span>
                        <mat-progress-bar
                          mode="determinate"
                          [value]="link.domainAuthority"
                        ></mat-progress-bar>
                        <span class="auth-value">{{ link.domainAuthority }}</span>
                      </div>
                      <div class="auth-item">
                        <span class="auth-label">PA</span>
                        <mat-progress-bar
                          mode="determinate"
                          [value]="link.pageAuthority"
                        ></mat-progress-bar>
                        <span class="auth-value">{{ link.pageAuthority }}</span>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let link">
                    <span class="type-badge" [class]="link.type">{{ link.type }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let link">
                    <span class="status-badge" [class]="link.status">{{ link.status }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="traffic">
                  <th mat-header-cell *matHeaderCellDef>Traffic</th>
                  <td mat-cell *matCellDef="let link">
                    {{ formatNumber(link.traffic) }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let link">
                    <button mat-icon-button [matMenuTriggerFor]="menu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="markAsFixed(link)">
                        <mat-icon>check</mat-icon>
                        <span>Mark as Fixed</span>
                      </button>
                      <button mat-menu-item (click)="ignoreBacklink(link)">
                        <mat-icon>visibility_off</mat-icon>
                        <span>Ignore</span>
                      </button>
                      <button mat-menu-item (click)="deleteBacklink(link)">
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

        <mat-tab label="Top Domains">
          <div class="tab-content">
            <div class="domains-grid">
              @for (domain of stats().topDomains; track domain.domain) {
                <mat-card class="domain-card">
                  <div class="domain-header">
                    <mat-icon>language</mat-icon>
                    <h3>{{ domain.domain }}</h3>
                  </div>
                  <div class="domain-stats">
                    <span class="backlink-count">{{ domain.count }} backlinks</span>
                  </div>
                  <button mat-stroked-button color="primary">View Details</button>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Opportunities">
          <div class="tab-content">
            <div class="opportunities-grid">
              @for (opp of opportunities; track opp.domain) {
                <mat-card class="opportunity-card">
                  <div class="opp-header">
                    <mat-icon>trending_up</mat-icon>
                    <h3>{{ opp.domain }}</h3>
                    <span class="da-badge">DA {{ opp.da }}</span>
                  </div>
                  <p class="opp-reason">{{ opp.reason }}</p>
                  <button mat-raised-button color="primary">
                    <mat-icon>add</mat-icon>
                    Add to List
                  </button>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Analytics">
          <div class="tab-content">
            <div class="analytics-section">
              <h3>Backlink Growth</h3>
              <div class="chart-placeholder">
                <mat-icon>show_chart</mat-icon>
                <p>Backlink growth chart visualization</p>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .backlink-container {
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
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;

          &.total {
            background: rgba(233, 69, 96, 0.2);
            mat-icon {
              color: #e94560;
            }
          }
          &.dofollow {
            background: rgba(76, 175, 80, 0.2);
            mat-icon {
              color: #4caf50;
            }
          }
          &.new {
            background: rgba(33, 150, 243, 0.2);
            mat-icon {
              color: #2196f3;
            }
          }
          &.lost {
            background: rgba(244, 67, 54, 0.2);
            mat-icon {
              color: #f44336;
            }
          }
          &.da {
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

      .backlinks-table {
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

          .source-cell {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .source-link {
              color: #2196f3;
              text-decoration: none;
              font-weight: 500;

              &:hover {
                text-decoration: underline;
              }
            }

            .anchor-text {
              font-size: 12px;
              color: #a0a0b8;
              font-style: italic;
            }
          }

          .target-link {
            color: #4caf50;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }

          .authority-bars {
            display: flex;
            gap: 12px;

            .auth-item {
              display: flex;
              align-items: center;
              gap: 6px;

              .auth-label {
                font-size: 11px;
                color: #a0a0b8;
                min-width: 24px;
              }

              mat-progress-bar {
                width: 50px;
                height: 6px;
                border-radius: 3px;
              }

              .auth-value {
                font-size: 12px;
                font-weight: 600;
                min-width: 24px;
              }
            }
          }

          .type-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: capitalize;

            &.dofollow {
              background: rgba(76, 175, 80, 0.2);
              color: #4caf50;
            }

            &.nofollow {
              background: rgba(158, 158, 158, 0.2);
              color: #9e9e9e;
            }

            &.sponsored {
              background: rgba(255, 152, 0, 0.2);
              color: #ff9800;
            }
          }

          .status-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: capitalize;

            &.active {
              background: rgba(76, 175, 80, 0.2);
              color: #4caf50;
            }
            &.new {
              background: rgba(33, 150, 243, 0.2);
              color: #2196f3;
            }
            &.lost {
              background: rgba(244, 67, 54, 0.2);
              color: #f44336;
            }
            &.broken {
              background: rgba(244, 67, 54, 0.2);
              color: #f44336;
            }
          }
        }
      }

      .domains-grid,
      .opportunities-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }

      .domain-card,
      .opportunity-card {
        background: #16213e;
        padding: 20px;

        .domain-header,
        .opp-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          mat-icon {
            color: #e94560;
          }

          h3 {
            margin: 0;
            flex: 1;
            font-size: 16px;
            color: #ffffff;
          }

          .da-badge {
            background: rgba(233, 69, 96, 0.2);
            color: #e94560;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
        }

        .domain-stats {
          margin-bottom: 16px;

          .backlink-count {
            font-size: 14px;
            color: #a0a0b8;
          }
        }

        .opp-reason {
          margin: 0 0 16px;
          font-size: 13px;
          color: #a0a0b8;
          line-height: 1.5;
        }
      }

      .analytics-section {
        h3 {
          margin: 0 0 16px;
          color: #ffffff;
        }

        .chart-placeholder {
          background: #16213e;
          border-radius: 12px;
          padding: 60px;
          text-align: center;
          color: #a0a0b8;

          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            opacity: 0.5;
          }

          p {
            margin: 16px 0 0;
          }
        }
      }
    `,
  ],
})
export class BacklinkManagerComponent implements OnInit {
  backlinks = signal<Backlink[]>([]);
  stats = signal<BacklinkStats>({
    totalBacklinks: 0,
    dofollow: 0,
    nofollow: 0,
    newThisWeek: 0,
    lostThisWeek: 0,
    avgDomainAuthority: 0,
    topDomains: [],
  });

  filterStatus = 'all';
  filterType = 'all';
  displayedColumns = ['source', 'target', 'authority', 'type', 'status', 'traffic', 'actions'];

  opportunities = [
    { domain: 'wikipedia.org', da: 98, reason: 'High authority, allows external links' },
    { domain: 'github.com', da: 96, reason: 'Developer community, relevant for tech topics' },
    { domain: 'stackoverflow.com', da: 94, reason: 'Q&A platform, high engagement' },
    { domain: 'linkedin.com', da: 95, reason: 'Professional networking, B2B opportunities' },
    { domain: 'twitter.com', da: 93, reason: 'Social signals, brand mentions' },
  ];

  filteredBacklinks = computed(() => {
    let filtered = this.backlinks();
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((b) => b.status === this.filterStatus);
    }
    if (this.filterType !== 'all') {
      filtered = filtered.filter((b) => b.type === this.filterType);
    }
    return filtered;
  });

  constructor(private backlinkService: BacklinkService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.backlinks.set(this.backlinkService.getBacklinks());
    this.stats.set(this.backlinkService.getStats());
  }

  applyFilters(): void {
    // Filter is handled by computed signal
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  truncateUrl(url: string): string {
    return url.length > 40 ? url.substring(0, 40) + '...' : url;
  }

  checkBacklinks(): void {
    this.backlinkService.checkBacklinks();
    this.loadData();
  }

  markAsFixed(link: Backlink): void {
    this.backlinkService.updateBacklinkStatus(link.id, 'active');
    this.loadData();
  }

  ignoreBacklink(link: Backlink): void {
    this.backlinkService.updateBacklinkStatus(link.id, 'lost');
    this.loadData();
  }

  deleteBacklink(link: Backlink): void {
    this.backlinkService.deleteBacklink(link.id);
    this.loadData();
  }
}
