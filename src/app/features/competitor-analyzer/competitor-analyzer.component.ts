import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  CompetitorAnalyzerService,
  Competitor,
  CompetitorAnalysis,
} from '../../core/services/competitor-analyzer.service';

@Component({
  selector: 'app-competitor-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatMenuModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="competitor-container">
      <header class="page-header">
        <div class="header-content">
          <h1>
            <mat-icon>compare</mat-icon>
            Competitor Analyzer
          </h1>
          <p>Analyze competitors' strategies and discover content opportunities</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="add-competitor">
            <mat-label>Add competitor domain</mat-label>
            <input matInput [(ngModel)]="newCompetitorDomain" placeholder="example.com" />
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="addCompetitor()">
            <mat-icon>add</mat-icon>
            Add
          </button>
        </div>
      </header>

      <div class="overview-stats">
        <mat-card class="stat-card">
          <mat-icon>group</mat-icon>
          <div class="stat-info">
            <span class="value">{{ analysis().totalCompetitors }}</span>
            <span class="label">Competitors</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>traffic</mat-icon>
          <div class="stat-info">
            <span class="value">{{ formatNumber(analysis().avgTraffic) }}</span>
            <span class="label">Avg Traffic</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>star</mat-icon>
          <div class="stat-info">
            <span class="value">{{ analysis().avgDA }}</span>
            <span class="label">Avg DA</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>search</mat-icon>
          <div class="stat-info">
            <span class="value">{{ analysis().sharedKeywords }}</span>
            <span class="label">Shared Keywords</span>
          </div>
        </mat-card>
      </div>

      <div class="traffic-comparison">
        <h3>Traffic Comparison</h3>
        <div class="comparison-bars">
          <div class="comp-item">
            <span class="comp-label">Your Site</span>
            <div class="bar-container">
              <div class="bar yours" [style.width.%]="getTrafficPercent(traffic().yours)"></div>
            </div>
            <span class="comp-value">{{ formatNumber(traffic().yours) }}</span>
          </div>
          <div class="comp-item">
            <span class="comp-label">Competitor Avg</span>
            <div class="bar-container">
              <div class="bar avg" [style.width.%]="getTrafficPercent(traffic().avg)"></div>
            </div>
            <span class="comp-value">{{ formatNumber(traffic().avg) }}</span>
          </div>
          <div class="comp-item">
            <span class="comp-label">Industry Leaders</span>
            <div class="bar-container">
              <div class="bar leaders" [style.width.%]="getTrafficPercent(traffic().leaders)"></div>
            </div>
            <span class="comp-value">{{ formatNumber(traffic().leaders) }}</span>
          </div>
        </div>
      </div>

      <mat-tab-group class="main-tabs" animationDuration="300ms">
        <mat-tab label="Competitors">
          <div class="tab-content">
            <div class="competitors-grid">
              @for (comp of competitors(); track comp.id) {
                <mat-card class="competitor-card">
                  <mat-card-header>
                    <div class="comp-header">
                      <mat-icon class="comp-icon">public</mat-icon>
                      <div>
                        <h3>{{ comp.name }}</h3>
                        <span class="domain">{{ comp.domain }}</span>
                      </div>
                    </div>
                    <button mat-icon-button [matMenuTriggerFor]="menu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="analyzeCompetitor(comp)">
                        <mat-icon>refresh</mat-icon>
                        <span>Re-analyze</span>
                      </button>
                      <button mat-menu-item (click)="deleteCompetitor(comp)">
                        <mat-icon>delete</mat-icon>
                        <span>Remove</span>
                      </button>
                    </mat-menu>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="comp-stats">
                      <div class="stat-row">
                        <span class="stat-label">Traffic</span>
                        <span class="stat-value">{{ formatNumber(comp.traffic) }}</span>
                        <span
                          class="change"
                          [class.positive]="comp.trafficChange > 0"
                          [class.negative]="comp.trafficChange < 0"
                        >
                          {{ comp.trafficChange > 0 ? '+' : ''
                          }}{{ comp.trafficChange.toFixed(1) }}%
                        </span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Keywords</span>
                        <span class="stat-value">{{ formatNumber(comp.keywords) }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Domain Authority</span>
                        <span class="stat-value">{{ comp.domainAuthority }}</span>
                        <mat-progress-bar
                          mode="determinate"
                          [value]="comp.domainAuthority"
                        ></mat-progress-bar>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Backlinks</span>
                        <span class="stat-value">{{ formatNumber(comp.backlinks) }}</span>
                      </div>
                    </div>

                    <div class="social-section">
                      <h4>Social Presence</h4>
                      <div class="social-bars">
                        <div class="social-item">
                          <mat-icon>facebook</mat-icon>
                          <span>{{ formatNumber(comp.socialFollowers.facebook) }}</span>
                        </div>
                        <div class="social-item">
                          <mat-icon>tag</mat-icon>
                          <span>{{ formatNumber(comp.socialFollowers.twitter) }}</span>
                        </div>
                        <div class="social-item">
                          <mat-icon>work</mat-icon>
                          <span>{{ formatNumber(comp.socialFollowers.linkedin) }}</span>
                        </div>
                        <div class="social-item">
                          <mat-icon>photo_camera</mat-icon>
                          <span>{{ formatNumber(comp.socialFollowers.instagram) }}</span>
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Content Gaps">
          <div class="tab-content">
            <h3>Keywords Your Competitors Rank For (But You Don't)</h3>
            <div class="gaps-grid">
              @for (gap of analysis().contentGaps; track gap.keyword) {
                <mat-card class="gap-card">
                  <div class="gap-header">
                    <h4>{{ gap.keyword }}</h4>
                    <span class="competitor">by {{ gap.competitor }}</span>
                  </div>
                  <div class="gap-meta">
                    <span class="difficulty">Difficulty: {{ gap.difficulty }}%</span>
                  </div>
                  <button mat-stroked-button color="primary">
                    <mat-icon>add</mat-icon>
                    Create Content
                  </button>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Top Keywords">
          <div class="tab-content">
            <div class="keywords-table">
              @for (comp of competitors(); track comp.id) {
                <h4>{{ comp.name }} - Top Keywords</h4>
                <div class="keyword-list">
                  @for (kw of comp.topKeywords; track kw.keyword) {
                    <div class="keyword-item">
                      <span class="kw-text">{{ kw.keyword }}</span>
                      <span class="kw-rank">#{{ kw.rank }}</span>
                      <span class="kw-traffic">{{ formatNumber(kw.traffic) }} visits/mo</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Top Pages">
          <div class="tab-content">
            <div class="pages-table">
              @for (comp of competitors(); track comp.id) {
                <h4>{{ comp.name }} - Top Pages</h4>
                <div class="page-list">
                  @for (page of comp.topPages; track page.url) {
                    <div class="page-item">
                      <mat-icon>article</mat-icon>
                      <span class="page-url">{{ page.url }}</span>
                      <span class="page-traffic">{{ formatNumber(page.traffic) }} visits</span>
                      <span class="page-keywords">{{ page.keywords }} keywords</span>
                    </div>
                  }
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
      .competitor-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        gap: 16px;
        flex-wrap: wrap;

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

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;

          .add-competitor {
            width: 250px;
          }
        }
      }

      .overview-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;

        @media (max-width: 1024px) {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .stat-card {
        background: #1a1a2e;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;

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
            color: #ffffff;
          }

          .label {
            font-size: 13px;
            color: #a0a0b8;
          }
        }
      }

      .traffic-comparison {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;

        h3 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #ffffff;
        }

        .comparison-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .comp-item {
          display: flex;
          align-items: center;
          gap: 12px;

          .comp-label {
            min-width: 120px;
            font-size: 13px;
            color: #a0a0b8;
          }

          .bar-container {
            flex: 1;
            height: 24px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            overflow: hidden;
          }

          .bar {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;

            &.yours {
              background: linear-gradient(90deg, #e94560, #ff6b6b);
            }
            &.avg {
              background: linear-gradient(90deg, #2196f3, #64b5f6);
            }
            &.leaders {
              background: linear-gradient(90deg, #4caf50, #81c784);
            }
          }

          .comp-value {
            min-width: 80px;
            text-align: right;
            font-weight: 600;
            color: #ffffff;
          }
        }
      }

      .main-tabs {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 16px;
      }

      .competitors-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
      }

      .competitor-card {
        background: #16213e;

        mat-card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;

          .comp-header {
            display: flex;
            align-items: center;
            gap: 12px;

            .comp-icon {
              font-size: 32px;
              width: 32px;
              height: 32px;
              color: #e94560;
            }

            h3 {
              margin: 0;
              font-size: 16px;
              color: #ffffff;
            }

            .domain {
              font-size: 12px;
              color: #a0a0b8;
            }
          }
        }

        .comp-stats {
          .stat-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);

            &:last-child {
              border-bottom: none;
            }

            .stat-label {
              flex: 1;
              font-size: 13px;
              color: #a0a0b8;
            }

            .stat-value {
              font-weight: 600;
              color: #ffffff;
            }

            .change {
              font-size: 12px;
              font-weight: 600;

              &.positive {
                color: #4caf50;
              }
              &.negative {
                color: #f44336;
              }
            }

            mat-progress-bar {
              width: 60px;
              height: 6px;
              border-radius: 3px;
            }
          }
        }

        .social-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);

          h4 {
            margin: 0 0 12px;
            font-size: 13px;
            color: #a0a0b8;
          }

          .social-bars {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;

            .social-item {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              color: #a0a0b8;

              mat-icon {
                font-size: 18px;
                width: 18px;
                height: 18px;
              }
            }
          }
        }
      }

      .gaps-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }

      .gap-card {
        background: #16213e;
        padding: 16px;

        .gap-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;

          h4 {
            margin: 0;
            font-size: 14px;
            color: #ffffff;
          }

          .competitor {
            font-size: 11px;
            color: #a0a0b8;
          }
        }

        .gap-meta {
          margin-bottom: 12px;

          .difficulty {
            font-size: 12px;
            color: #a0a0b8;
          }
        }
      }

      .keywords-table,
      .pages-table {
        h4 {
          margin: 16px 0 12px;
          font-size: 14px;
          color: #e94560;
        }
      }

      .keyword-list,
      .page-list {
        background: #16213e;
        border-radius: 8px;
        overflow: hidden;
      }

      .keyword-item,
      .page-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        &:last-child {
          border-bottom: none;
        }

        mat-icon {
          color: #a0a0b8;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        .kw-text,
        .page-url {
          flex: 1;
          color: #ffffff;
        }

        .kw-rank {
          background: rgba(233, 69, 96, 0.2);
          color: #e94560;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .kw-traffic,
        .page-traffic {
          font-size: 13px;
          color: #a0a0b8;
          min-width: 100px;
          text-align: right;
        }

        .page-keywords {
          font-size: 12px;
          color: #a0a0b8;
        }
      }
    `,
  ],
})
export class CompetitorAnalyzerComponent implements OnInit {
  competitors = signal<Competitor[]>([]);
  analysis = signal<CompetitorAnalysis>({
    totalCompetitors: 0,
    avgTraffic: 0,
    avgDA: 0,
    sharedKeywords: 0,
    contentGaps: [],
  });
  traffic = signal({ yours: 0, avg: 0, leaders: 0 });
  newCompetitorDomain = '';

  constructor(private competitorService: CompetitorAnalyzerService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.competitors.set(this.competitorService.getCompetitors());
    this.analysis.set(this.competitorService.getAnalysis());
    this.traffic.set(this.competitorService.getTrafficComparison());
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  getTrafficPercent(value: number): number {
    const max = Math.max(this.traffic().leaders, value);
    return max > 0 ? (value / max) * 100 : 0;
  }

  addCompetitor(): void {
    if (this.newCompetitorDomain) {
      this.competitorService.addCompetitor(this.newCompetitorDomain);
      this.newCompetitorDomain = '';
      this.loadData();
    }
  }

  analyzeCompetitor(comp: Competitor): void {
    this.competitorService.analyzeCompetitor(comp.id);
    this.loadData();
  }

  deleteCompetitor(comp: Competitor): void {
    this.competitorService.deleteCompetitor(comp.id);
    this.loadData();
  }
}
