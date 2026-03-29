import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  BrandMentionsService,
  BrandMention,
  MentionStats,
} from '../../core/services/brand-mentions.service';

@Component({
  selector: 'app-brand-mentions',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="mentions-container">
      <header class="page-header">
        <div class="header-content">
          <h1><mat-icon>campaign</mat-icon> Brand Mentions Monitor</h1>
          <p>Track and convert unlinked brand mentions into backlinks</p>
        </div>
      </header>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-icon>format_quote</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().totalMentions }}</span>
            <span class="label">Total Mentions</span>
          </div>
        </mat-card>
        <mat-card class="stat-card linked">
          <mat-icon>link</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().linkedMentions }}</span>
            <span class="label">Linked</span>
          </div>
        </mat-card>
        <mat-card class="stat-card unlinked">
          <mat-icon>link_off</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().unlinkedMentions }}</span>
            <span class="label">Unlinked</span>
          </div>
        </mat-card>
        <mat-card class="stat-card positive">
          <mat-icon>sentiment_satisfied</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().positiveSentiment }}</span>
            <span class="label">Positive</span>
          </div>
        </mat-card>
      </div>

      <mat-tab-group animationDuration="300ms">
        <mat-tab label="Unlinked Mentions">
          <div class="tab-content">
            <div class="mentions-grid">
              @for (mention of unlinkedMentions(); track mention.id) {
                <mat-card class="mention-card" [class]="mention.sentiment">
                  <div class="mention-header">
                    <span class="source">{{ mention.source }}</span>
                    <span class="sentiment-badge" [class]="mention.sentiment">{{
                      mention.sentiment
                    }}</span>
                  </div>
                  <p class="context">"{{ mention.context }}"</p>
                  <div class="mention-meta">
                    <span class="pa">DA: {{ mention.pageAuthority }}</span>
                    <span class="traffic">{{ formatNumber(mention.traffic) }} visits/mo</span>
                  </div>
                  <div class="mention-actions">
                    <a [href]="mention.url" target="_blank" mat-stroked-button>
                      <mat-icon>open_in_new</mat-icon>
                      View
                    </a>
                    <button mat-raised-button color="primary" (click)="reachOut(mention)">
                      <mat-icon>email</mat-icon>
                      Reach Out
                    </button>
                    <button mat-icon-button (click)="dismiss(mention.id)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </mat-card>
              } @empty {
                <div class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <h3>All Caught Up!</h3>
                  <p>No unlinked brand mentions found</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>
        <mat-tab label="All Mentions">
          <div class="tab-content">
            <div class="mentions-grid">
              @for (mention of mentions(); track mention.id) {
                <mat-card class="mention-card" [class]="mention.sentiment">
                  <div class="mention-header">
                    <span class="source">{{ mention.source }}</span>
                    @if (mention.linked) {
                      <span class="linked-badge">Linked</span>
                    }
                  </div>
                  <p class="context">"{{ mention.context }}"</p>
                  <a [href]="mention.url" target="_blank" class="view-link">
                    <mat-icon>open_in_new</mat-icon>
                    View Source
                  </a>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Sentiment Analysis">
          <div class="tab-content">
            <div class="sentiment-cards">
              <mat-card class="sentiment-card positive">
                <mat-icon>sentiment_very_satisfied</mat-icon>
                <h3>Positive</h3>
                <span class="count">{{ stats().positiveSentiment }}</span>
                <p>Brand-positive mentions across the web</p>
              </mat-card>
              <mat-card class="sentiment-card negative">
                <mat-icon>sentiment_very_dissatisfied</mat-icon>
                <h3>Negative</h3>
                <span class="count">{{ stats().negativeSentiment }}</span>
                <p>Areas needing attention</p>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .mentions-container {
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
        &.linked {
          border-color: rgba(76, 175, 80, 0.3);
        }
        &.unlinked {
          border-color: rgba(233, 69, 96, 0.3);
        }
        &.positive {
          border-color: rgba(76, 175, 80, 0.3);
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
      .mentions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 16px;
      }
      .mention-card {
        background: #1a1a2e;
        padding: 20px;
        border-left: 4px solid transparent;
        &.positive {
          border-left-color: #4caf50;
        }
        &.negative {
          border-left-color: #f44336;
        }
        &.neutral {
          border-left-color: #9e9e9e;
        }
        .mention-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          .source {
            font-weight: 600;
            color: #fff;
          }
          .sentiment-badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            text-transform: capitalize;
            &.positive {
              background: rgba(76, 175, 80, 0.2);
              color: #4caf50;
            }
            &.negative {
              background: rgba(244, 67, 54, 0.2);
              color: #f44336;
            }
            &.neutral {
              background: rgba(158, 158, 158, 0.2);
              color: #9e9e9e;
            }
          }
          .linked-badge {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
          }
        }
        .context {
          font-size: 14px;
          color: #fff;
          line-height: 1.5;
          margin: 0 0 12px;
        }
        .mention-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #a0a0b8;
          margin-bottom: 16px;
        }
        .mention-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          a {
            text-decoration: none;
          }
          .view-link {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #2196f3;
            text-decoration: none;
            font-size: 13px;
            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }
        }
      }
      .sentiment-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }
      .sentiment-card {
        background: #1a1a2e;
        padding: 32px;
        text-align: center;
        &.positive {
          border: 1px solid rgba(76, 175, 80, 0.3);
          mat-icon {
            color: #4caf50;
          }
        }
        &.negative {
          border: 1px solid rgba(244, 67, 54, 0.3);
          mat-icon {
            color: #f44336;
          }
        }
        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }
        h3 {
          margin: 16px 0 8px;
          color: #fff;
        }
        .count {
          display: block;
          font-size: 48px;
          font-weight: 700;
          color: #fff;
        }
        p {
          margin: 8px 0 0;
          color: #a0a0b8;
          font-size: 14px;
        }
      }
      .empty-state {
        grid-column: 1/-1;
        text-align: center;
        padding: 60px;
        color: #a0a0b8;
        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          opacity: 0.3;
          color: #4caf50;
        }
        h3 {
          margin: 16px 0 8px;
          color: #fff;
        }
      }
    `,
  ],
})
export class BrandMentionsComponent implements OnInit {
  mentions = signal<BrandMention[]>([]);
  stats = signal<MentionStats>({
    totalMentions: 0,
    linkedMentions: 0,
    unlinkedMentions: 0,
    positiveSentiment: 0,
    negativeSentiment: 0,
    topSources: [],
  });
  unlinkedMentions = signal<BrandMention[]>([]);

  constructor(
    private mentionsService: BrandMentionsService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.mentions.set(this.mentionsService.getMentions());
    this.stats.set(this.mentionsService.getStats());
    this.unlinkedMentions.set(this.mentionsService.getUnlinkedMentions());
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  reachOut(mention: BrandMention): void {
    this.snackBar.open(`Email template opened for ${mention.source}`, 'Close', { duration: 3000 });
  }

  dismiss(id: string): void {
    this.mentionsService.dismissMention(id);
    this.loadData();
  }
}
