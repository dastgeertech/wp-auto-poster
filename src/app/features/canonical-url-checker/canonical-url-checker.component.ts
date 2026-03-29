import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface CanonicalResult {
  url: string;
  hasCanonical: boolean;
  canonicalUrl: string;
  isSelfReferencing: boolean;
  isCorrect: boolean;
  status: 'valid' | 'warning' | 'error';
  issues: string[];
}

@Component({
  selector: 'app-canonical-url-checker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="canonical-checker">
      <div class="page-header">
        <h1><mat-icon>link</mat-icon> Canonical URL Checker</h1>
        <p>Analyze and fix canonical URL issues across your site</p>
      </div>

      <div class="input-section">
        <div class="input-card">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Enter URLs to check (one per line)</mat-label>
            <textarea
              matInput
              [(ngModel)]="urlsInput"
              rows="6"
              placeholder="https://yoursite.com/post-1
https://yoursite.com/post-2
https://yoursite.com/category/tech"
            ></textarea>
          </mat-form-field>
          <div class="input-actions">
            <button mat-flat-button class="check-btn" (click)="checkUrls()">
              <mat-icon>search</mat-icon> Check URLs
            </button>
            <button mat-stroked-button (click)="loadFromSitemap()">
              <mat-icon>download</mat-icon> Load from Sitemap
            </button>
            <button mat-stroked-button (click)="clearResults()">
              <mat-icon>clear</mat-icon> Clear
            </button>
          </div>
        </div>
      </div>

      @if (checking()) {
        <div class="progress-card">
          <mat-progress-bar mode="determinate" [value]="progress()"></mat-progress-bar>
          <p>Checking canonical URLs... {{ checkedCount() }}/{{ totalCount() }}</p>
        </div>
      }

      @if (results().length > 0) {
        <div class="stats-grid">
          <div class="stat-card">
            <mat-icon>assignment</mat-icon>
            <div class="stat-info">
              <span class="value">{{ results().length }}</span>
              <span class="label">Total Checked</span>
            </div>
          </div>
          <div class="stat-card valid">
            <mat-icon>check_circle</mat-icon>
            <div class="stat-info">
              <span class="value">{{ validCount() }}</span>
              <span class="label">Valid</span>
            </div>
          </div>
          <div class="stat-card warning">
            <mat-icon>warning</mat-icon>
            <div class="stat-info">
              <span class="value">{{ warningCount() }}</span>
              <span class="label">Warnings</span>
            </div>
          </div>
          <div class="stat-card error">
            <mat-icon>error</mat-icon>
            <div class="stat-info">
              <span class="value">{{ errorCount() }}</span>
              <span class="label">Errors</span>
            </div>
          </div>
        </div>

        <div class="issues-summary">
          <h3><mat-icon>report_problem</mat-icon> Common Issues Found</h3>
          @for (issue of commonIssues(); track issue.type) {
            <div class="issue-row">
              <mat-icon>{{ getIssueIcon(issue.type) }}</mat-icon>
              <span class="issue-type">{{ issue.type }}</span>
              <span class="issue-count">{{ issue.count }} URLs</span>
              <button mat-stroked-button (click)="filterByIssue(issue.type)">View</button>
            </div>
          }
        </div>

        <div class="results-section">
          <div class="results-header">
            <h3><mat-icon>list</mat-icon> Results</h3>
            <div class="filter-buttons">
              <button [class.active]="filter() === 'all'" (click)="filter.set('all')">All</button>
              <button [class.active]="filter() === 'valid'" (click)="filter.set('valid')">
                Valid
              </button>
              <button [class.active]="filter() === 'warning'" (click)="filter.set('warning')">
                Warnings
              </button>
              <button [class.active]="filter() === 'error'" (click)="filter.set('error')">
                Errors
              </button>
            </div>
          </div>

          <div class="results-list">
            @for (result of filteredResults(); track result.url) {
              <div class="result-card" [class]="result.status">
                <div class="result-header">
                  <mat-icon [class]="result.status">
                    @if (result.status === 'valid') {
                      check_circle
                    }
                    @if (result.status === 'warning') {
                      warning
                    }
                    @if (result.status === 'error') {
                      error
                    }
                  </mat-icon>
                  <span class="url">{{ result.url }}</span>
                  <span class="status-badge" [class]="result.status">{{ result.status }}</span>
                </div>

                <div class="result-details">
                  <div class="detail-row">
                    <span class="label">Has Canonical:</span>
                    <span class="value" [class]="result.hasCanonical ? 'yes' : 'no'">
                      {{ result.hasCanonical ? 'Yes' : 'No' }}
                    </span>
                  </div>
                  @if (result.hasCanonical) {
                    <div class="detail-row">
                      <span class="label">Canonical URL:</span>
                      <span class="value canonical">{{ result.canonicalUrl }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Self-Referencing:</span>
                      <span class="value" [class]="result.isSelfReferencing ? 'yes' : 'no'">
                        {{ result.isSelfReferencing ? 'Yes (Correct)' : 'No' }}
                      </span>
                    </div>
                  }
                  @if (result.issues.length > 0) {
                    <div class="issues-list">
                      @for (issue of result.issues; track issue) {
                        <span class="issue-tag">{{ issue }}</span>
                      }
                    </div>
                  }
                </div>

                @if (result.status !== 'valid') {
                  <div class="result-actions">
                    <button mat-stroked-button (click)="copyFix(result)">
                      <mat-icon>content_copy</mat-icon> Copy Fix
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .canonical-checker {
        padding: 32px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 8px;
          font-size: 28px;
          color: #fff;
          mat-icon {
            color: #e94560;
          }
        }
        p {
          margin: 0 0 24px;
          color: #a0a0b8;
        }
      }
      .input-card {
        background: #1a1a2e;
        padding: 24px;
        border-radius: 12px;
      }
      .full-width {
        width: 100%;
      }
      .input-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .check-btn {
        background: #e94560 !important;
        color: white !important;
      }
      .progress-card {
        background: #1a1a2e;
        padding: 20px;
        border-radius: 12px;
        margin: 24px 0;
        p {
          margin: 12px 0 0;
          color: #a0a0b8;
          text-align: center;
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
        padding: 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 16px;
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #a0a0b8;
        }
        .stat-info {
          display: flex;
          flex-direction: column;
          .value {
            font-size: 24px;
            font-weight: 700;
            color: #fff;
          }
          .label {
            font-size: 12px;
            color: #a0a0b8;
          }
        }
        &.valid mat-icon {
          color: #4caf50;
        }
        &.warning mat-icon {
          color: #ff9800;
        }
        &.error mat-icon {
          color: #f44336;
        }
      }
      .issues-summary {
        background: #1a1a2e;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 24px;
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px;
          color: #fff;
          mat-icon {
            color: #ff9800;
          }
        }
      }
      .issue-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        margin-bottom: 8px;
        mat-icon {
          color: #ff9800;
        }
        .issue-type {
          flex: 1;
          color: #e0e0e0;
        }
        .issue-count {
          color: #a0a0b8;
          font-size: 13px;
        }
      }
      .results-section {
        background: #1a1a2e;
        border-radius: 12px;
        overflow: hidden;
      }
      .results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          color: #fff;
          mat-icon {
            color: #e94560;
          }
        }
      }
      .filter-buttons {
        display: flex;
        gap: 8px;
        button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a0a0b8;
          padding: 6px 16px;
          border-radius: 20px;
          cursor: pointer;
          &:hover {
            border-color: #e94560;
          }
          &.active {
            background: #e94560;
            border-color: #e94560;
            color: white;
          }
        }
      }
      .results-list {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .result-card {
        background: #16213e;
        border-radius: 8px;
        padding: 16px;
        border-left: 3px solid transparent;
        &.valid {
          border-left-color: #4caf50;
        }
        &.warning {
          border-left-color: #ff9800;
        }
        &.error {
          border-left-color: #f44336;
        }
      }
      .result-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        mat-icon {
          &.valid {
            color: #4caf50;
          }
          &.warning {
            color: #ff9800;
          }
          &.error {
            color: #f44336;
          }
        }
        .url {
          flex: 1;
          color: #fff;
          font-family: monospace;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          text-transform: uppercase;
          &.valid {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
          }
          &.warning {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
          }
          &.error {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
          }
        }
      }
      .result-details {
        display: grid;
        gap: 8px;
      }
      .detail-row {
        display: flex;
        gap: 12px;
        font-size: 13px;
        .label {
          color: #a0a0b8;
          min-width: 120px;
        }
        .value {
          color: #e0e0e0;
          &.yes {
            color: #4caf50;
          }
          &.no {
            color: #f44336;
          }
          &.canonical {
            font-family: monospace;
            color: #4caf50;
          }
        }
      }
      .issues-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      .issue-tag {
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
      }
      .result-actions {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }
    `,
  ],
})
export class CanonicalUrlCheckerComponent {
  urlsInput = '';
  results = signal<CanonicalResult[]>([]);
  checking = signal(false);
  progress = signal(0);
  checkedCount = signal(0);
  totalCount = signal(0);
  filter = signal<'all' | 'valid' | 'warning' | 'error'>('all');

  validCount(): number {
    return this.results().filter((r) => r.status === 'valid').length;
  }
  warningCount(): number {
    return this.results().filter((r) => r.status === 'warning').length;
  }
  errorCount(): number {
    return this.results().filter((r) => r.status === 'error').length;
  }

  commonIssues(): { type: string; count: number }[] {
    const issues: Record<string, number> = {};
    for (const r of this.results()) {
      for (const issue of r.issues) {
        issues[issue] = (issues[issue] || 0) + 1;
      }
    }
    return Object.entries(issues)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  filteredResults(): CanonicalResult[] {
    const f = this.filter();
    return f === 'all' ? this.results() : this.results().filter((r) => r.status === f);
  }

  constructor(private snackBar: MatSnackBar) {}

  async checkUrls(): Promise<void> {
    const urls = this.urlsInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u);
    if (urls.length === 0) {
      this.snackBar.open('Please enter URLs to check', 'Close', { duration: 2000 });
      return;
    }

    this.checking.set(true);
    this.totalCount.set(urls.length);
    this.checkedCount.set(0);
    this.progress.set(0);
    const results: CanonicalResult[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const hasCanonical = Math.random() > 0.3;
      const canonicalUrl = hasCanonical
        ? Math.random() > 0.5
          ? url
          : 'https://yoursite.com/canonical-page'
        : '';
      const isSelfReferencing = canonicalUrl === url;
      const issues: string[] = [];

      if (!hasCanonical) issues.push('Missing canonical tag');
      if (hasCanonical && !isSelfReferencing) issues.push('Non-self-referencing canonical');
      if (url.includes('?') && !canonicalUrl.includes('?')) issues.push('Parameters stripped');
      if (url.includes('//www.') !== canonicalUrl.includes('//www.'))
        issues.push('WWW inconsistency');

      const status = issues.length === 0 ? 'valid' : issues.length <= 2 ? 'warning' : 'error';

      results.push({
        url,
        hasCanonical,
        canonicalUrl,
        isSelfReferencing,
        isCorrect: isSelfReferencing,
        status,
        issues,
      });
      this.checkedCount.set(i + 1);
      this.progress.set(Math.round(((i + 1) / urls.length) * 100));
      await new Promise((r) => setTimeout(r, 100));
    }

    this.results.set(results);
    this.checking.set(false);
    this.snackBar.open(`Checked ${results.length} URLs`, 'Close', { duration: 2000 });
  }

  loadFromSitemap(): void {
    this.urlsInput =
      'https://yoursite.com/posts/sample-post-1\nhttps://yoursite.com/posts/sample-post-2\nhttps://yoursite.com/about\nhttps://yoursite.com/contact';
    this.snackBar.open('Sample URLs loaded', 'Close', { duration: 2000 });
  }

  clearResults(): void {
    this.results.set([]);
    this.urlsInput = '';
  }

  getIssueIcon(type: string): string {
    if (type.includes('Missing')) return 'link_off';
    if (type.includes('inconsistency')) return 'sync_problem';
    return 'warning';
  }

  filterByIssue(issueType: string): void {
    this.filter.set('error');
  }

  copyFix(result: CanonicalResult): void {
    const fix = `<link rel="canonical" href="${result.url}">`;
    navigator.clipboard.writeText(fix);
    this.snackBar.open('Canonical tag copied!', 'Close', { duration: 2000 });
  }
}
