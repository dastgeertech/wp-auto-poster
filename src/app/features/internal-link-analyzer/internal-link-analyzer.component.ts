import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import {
  InternalLinkAnalyzerService,
  InternalLink,
  LinkStats,
  ContentSuggestion,
} from '../../core/services/internal-link-analyzer.service';

@Component({
  selector: 'app-internal-link-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatTableModule,
  ],
  template: `
    <div class="analyzer-container">
      <header class="page-header">
        <div class="header-content">
          <h1><mat-icon>link</mat-icon> Internal Link Analyzer</h1>
          <p>Optimize your site structure and internal linking</p>
        </div>
        <button mat-raised-button color="primary" (click)="refresh()">
          <mat-icon>refresh</mat-icon>
          Analyze
        </button>
      </header>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-icon>link</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().totalInternalLinks }}</span>
            <span class="label">Internal Links</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>open_in_new</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().totalExternalLinks }}</span>
            <span class="label">External Links</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>link_off</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().brokenLinks }}</span>
            <span class="label">Broken Links</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>account_tree</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().orphanPages }}</span>
            <span class="label">Orphan Pages</span>
          </div>
        </mat-card>
      </div>

      <mat-tab-group animationDuration="300ms">
        <mat-tab label="All Links">
          <div class="tab-content">
            <table mat-table [dataSource]="links()">
              <ng-container matColumnDef="source">
                <th mat-header-cell *matHeaderCellDef>Source</th>
                <td mat-cell *matCellDef="let link">{{ link.sourceUrl }}</td>
              </ng-container>
              <ng-container matColumnDef="target">
                <th mat-header-cell *matHeaderCellDef>Target</th>
                <td mat-cell *matCellDef="let link">{{ link.targetUrl }}</td>
              </ng-container>
              <ng-container matColumnDef="anchor">
                <th mat-header-cell *matHeaderCellDef>Anchor Text</th>
                <td mat-cell *matCellDef="let link">{{ link.anchorText }}</td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let link">
                  <span class="type-badge" [class]="link.linkType">{{ link.linkType }}</span>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </div>
        </mat-tab>
        <mat-tab label="Suggestions">
          <div class="tab-content">
            <div class="suggestions-grid">
              @for (suggestion of suggestions(); track suggestion.id) {
                <mat-card class="suggestion-card" [class]="suggestion.priority">
                  <div class="suggestion-header">
                    <span class="priority-badge">{{ suggestion.priority }}</span>
                  </div>
                  <h4>{{ suggestion.reason }}</h4>
                  <p class="reason">{{ suggestion.reason }}</p>
                  <div class="suggestion-links">
                    <span class="from">From: {{ suggestion.sourceUrl }}</span>
                    <span class="to">To: {{ suggestion.targetUrl }}</span>
                  </div>
                  <div class="suggested-anchor">
                    <strong>Suggested anchor:</strong> "{{ suggestion.suggestedAnchor }}"
                  </div>
                  <button mat-raised-button color="primary">Create Link</button>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Top Pages">
          <div class="tab-content">
            <h3>Most Linked Pages</h3>
            @for (page of stats().mostLinkedPages; track page.url) {
              <mat-card class="page-card">
                <span class="link-count">{{ page.count }} links</span>
                <span class="page-url">{{ page.url }}</span>
              </mat-card>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .analyzer-container {
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
      .type-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        text-transform: capitalize;
        &.internal {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }
        &.external {
          background: rgba(33, 150, 243, 0.2);
          color: #2196f3;
        }
      }
      .suggestions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
      .suggestion-card {
        background: #1a1a2e;
        padding: 20px;
        &.high {
          border-left: 4px solid #f44336;
        }
        &.medium {
          border-left: 4px solid #ff9800;
        }
        &.low {
          border-left: 4px solid #4caf50;
        }
        .suggestion-header {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          .priority-badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: capitalize;
            background: rgba(233, 69, 96, 0.2);
            color: #e94560;
          }
          .priority-badge.high {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
          }
          .priority-badge.medium {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
          }
          .priority-badge.low {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
          }
        }
        h4 {
          margin: 0 0 8px;
          color: #fff;
        }
        .reason {
          font-size: 13px;
          color: #a0a0b8;
          margin: 0 0 12px;
        }
        .suggestion-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: #a0a0b8;
          margin-bottom: 12px;
        }
        .suggested-anchor {
          font-size: 13px;
          color: #fff;
          margin-bottom: 16px;
          strong {
            color: #e94560;
          }
        }
      }
      .page-card {
        background: #1a1a2e;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        margin-bottom: 8px;
        .link-count {
          background: rgba(233, 69, 96, 0.2);
          color: #e94560;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .page-url {
          flex: 1;
          color: #fff;
        }
      }
      table {
        width: 100%;
        th {
          color: #a0a0b8;
        }
        td {
          color: #fff;
        }
      }
      h3 {
        margin: 0 0 16px;
        color: #fff;
      }
    `,
  ],
})
export class InternalLinkAnalyzerComponent implements OnInit {
  links = signal<InternalLink[]>([]);
  stats = signal<LinkStats>({
    totalInternalLinks: 0,
    totalExternalLinks: 0,
    pagesWithNoLinks: 0,
    orphanPages: 0,
    avgLinksPerPage: 0,
    brokenLinks: 0,
    mostLinkedPages: [],
    mostLinkingPages: [],
  });
  suggestions = signal<ContentSuggestion[]>([]);
  displayedColumns = ['source', 'target', 'anchor', 'type'];

  constructor(private analyzerService: InternalLinkAnalyzerService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.links.set(this.analyzerService.getLinks());
    this.stats.set(this.analyzerService.getStats());
    this.suggestions.set(this.analyzerService.getSuggestions());
  }

  refresh(): void {
    this.analyzerService.refreshAnalysis();
    this.loadData();
  }
}
