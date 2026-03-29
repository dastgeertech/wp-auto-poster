import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  type: 'static' | 'dynamic' | 'category' | 'tag' | 'author';
  status: 'valid' | 'warning' | 'error';
  issues: string[];
}

@Component({
  selector: 'app-sitemap-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="sitemap-generator">
      <div class="page-header">
        <h1><mat-icon>account_tree</mat-icon> Sitemap Generator</h1>
        <p>Generate and manage XML sitemaps for search engines</p>
      </div>

      <div class="config-section">
        <div class="config-card">
          <h3><mat-icon>settings</mat-icon> Configuration</h3>
          <div class="config-grid">
            <mat-form-field appearance="outline">
              <mat-label>Site URL</mat-label>
              <input matInput [(ngModel)]="siteUrl" placeholder="https://yoursite.com" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Change Frequency</mat-label>
              <mat-select [(ngModel)]="defaultChangefreq">
                <mat-option value="daily">Daily</mat-option>
                <mat-option value="weekly">Weekly</mat-option>
                <mat-option value="monthly">Monthly</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Default Priority</mat-label>
              <mat-select [(ngModel)]="defaultPriority">
                <mat-option [value]="1.0">1.0 (High)</mat-option>
                <mat-option [value]="0.8">0.8</mat-option>
                <mat-option [value]="0.6">0.6 (Normal)</mat-option>
                <mat-option [value]="0.4">0.4</mat-option>
                <mat-option [value]="0.2">0.2 (Low)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="include-options">
            <label>
              <input type="checkbox" [(ngModel)]="includePosts" />
              <span>Include Posts</span>
            </label>
            <label>
              <input type="checkbox" [(ngModel)]="includePages" />
              <span>Include Pages</span>
            </label>
            <label>
              <input type="checkbox" [(ngModel)]="includeCategories" />
              <span>Categories</span>
            </label>
            <label>
              <input type="checkbox" [(ngModel)]="includeTags" />
              <span>Tags</span>
            </label>
            <label>
              <input type="checkbox" [(ngModel)]="includeAuthors" />
              <span>Authors</span>
            </label>
          </div>

          <div class="action-buttons">
            <button mat-flat-button class="generate-btn" (click)="generateSitemap()">
              <mat-icon>auto_fix_high</mat-icon> Generate Sitemap
            </button>
            <button mat-stroked-button (click)="previewSitemap()">
              <mat-icon>preview</mat-icon> Preview
            </button>
            <button mat-stroked-button (click)="downloadSitemap()">
              <mat-icon>download</mat-icon> Download XML
            </button>
          </div>
        </div>
      </div>

      @if (generating()) {
        <div class="progress-section">
          <mat-progress-bar mode="determinate" [value]="progress()"></mat-progress-bar>
          <p>Generating sitemap... {{ progress() }}%</p>
        </div>
      }

      @if (urls().length > 0) {
        <div class="stats-section">
          <div class="stat-card">
            <mat-icon>link</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ urls().length }}</span>
              <span class="stat-label">Total URLs</span>
            </div>
          </div>
          <div class="stat-card valid">
            <mat-icon>check_circle</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ validCount() }}</span>
              <span class="stat-label">Valid</span>
            </div>
          </div>
          <div class="stat-card warning">
            <mat-icon>warning</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ warningCount() }}</span>
              <span class="stat-label">Warnings</span>
            </div>
          </div>
          <div class="stat-card error">
            <mat-icon>error</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ errorCount() }}</span>
              <span class="stat-label">Errors</span>
            </div>
          </div>
        </div>

        <div class="urls-section">
          <div class="urls-header">
            <h3><mat-icon>list</mat-icon> Generated URLs ({{ urls().length }})</h3>
            <div class="filter-tabs">
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

          <div class="urls-table">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Frequency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (url of filteredUrls(); track url.loc) {
                  <tr [class]="url.status">
                    <td class="url-cell">
                      <span class="url-text">{{ url.loc }}</span>
                      @if (url.issues.length > 0) {
                        <span class="issue-badge">{{ url.issues.length }}</span>
                      }
                    </td>
                    <td>
                      <span class="type-badge" [attr.data-type]="url.type">{{ url.type }}</span>
                    </td>
                    <td>{{ url.priority }}</td>
                    <td>{{ url.changefreq }}</td>
                    <td>
                      <mat-icon [class]="url.status">
                        @if (url.status === 'valid') {
                          check_circle
                        }
                        @if (url.status === 'warning') {
                          warning
                        }
                        @if (url.status === 'error') {
                          error
                        }
                      </mat-icon>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .sitemap-generator {
        padding: 32px;
        max-width: 1400px;
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
      .config-card {
        background: #1a1a2e;
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 24px;
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 20px;
          color: #fff;
          mat-icon {
            color: #e94560;
          }
        }
      }
      .config-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }
      .include-options {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 20px;
        label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #e0e0e0;
          input {
            accent-color: #e94560;
            width: 18px;
            height: 18px;
          }
        }
      }
      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .generate-btn {
        background: #e94560 !important;
        color: white !important;
      }
      .progress-section {
        background: #1a1a2e;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 24px;
        p {
          margin: 12px 0 0;
          color: #a0a0b8;
          text-align: center;
        }
      }
      .stats-section {
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
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #fff;
          }
          .stat-label {
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
      .urls-section {
        background: #1a1a2e;
        border-radius: 12px;
        overflow: hidden;
      }
      .urls-header {
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
      .filter-tabs {
        display: flex;
        gap: 8px;
        button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a0a0b8;
          padding: 6px 16px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
          &:hover {
            border-color: #e94560;
            color: #fff;
          }
          &.active {
            background: #e94560;
            border-color: #e94560;
            color: white;
          }
        }
      }
      .urls-table {
        overflow-x: auto;
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          padding: 12px 16px;
          color: #a0a0b8;
          font-size: 12px;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          color: #e0e0e0;
          font-size: 13px;
        }
        tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        tr.error {
          background: rgba(244, 67, 54, 0.1);
        }
        tr.warning {
          background: rgba(255, 152, 0, 0.1);
        }
      }
      .url-cell {
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 400px;
      }
      .url-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: monospace;
      }
      .issue-badge {
        background: #ff9800;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
      }
      .type-badge {
        background: rgba(233, 69, 96, 0.2);
        color: #e94560;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        text-transform: capitalize;
      }
      mat-icon.valid {
        color: #4caf50;
      }
      mat-icon.warning {
        color: #ff9800;
      }
      mat-icon.error {
        color: #f44336;
      }
    `,
  ],
})
export class SitemapGeneratorComponent {
  siteUrl = 'https://yoursite.com';
  defaultChangefreq: any = 'weekly';
  defaultPriority = 0.8;
  includePosts = true;
  includePages = true;
  includeCategories = true;
  includeTags = true;
  includeAuthors = false;

  urls = signal<SitemapUrl[]>([]);
  generating = signal(false);
  progress = signal(0);
  filter = signal<'all' | 'valid' | 'warning' | 'error'>('all');

  validCount(): number {
    return this.urls().filter((u) => u.status === 'valid').length;
  }
  warningCount(): number {
    return this.urls().filter((u) => u.status === 'warning').length;
  }
  errorCount(): number {
    return this.urls().filter((u) => u.status === 'error').length;
  }

  filteredUrls(): SitemapUrl[] {
    const f = this.filter();
    return f === 'all' ? this.urls() : this.urls().filter((u) => u.status === f);
  }

  constructor(private snackBar: MatSnackBar) {}

  async generateSitemap(): Promise<void> {
    this.generating.set(true);
    this.progress.set(0);
    const generated: SitemapUrl[] = [];

    if (this.includePosts) {
      for (let i = 1; i <= 50; i++) {
        generated.push({
          loc: `${this.siteUrl}/posts/sample-post-${i}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.8,
          type: 'dynamic',
          status: 'valid',
          issues: [],
        });
      }
      this.progress.set(30);
    }

    if (this.includePages) {
      const pages = ['about', 'contact', 'services', 'pricing', 'faq'];
      for (const page of pages) {
        generated.push({
          loc: `${this.siteUrl}/${page}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: 0.6,
          type: 'static',
          status: 'valid',
          issues: [],
        });
      }
      this.progress.set(50);
    }

    if (this.includeCategories) {
      const cats = ['tech', 'news', 'tutorials', 'reviews', 'guides'];
      for (const cat of cats) {
        generated.push({
          loc: `${this.siteUrl}/category/${cat}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'daily',
          priority: 0.7,
          type: 'category',
          status: 'valid',
          issues: ['Consider adding more content to this category'],
        });
      }
      this.progress.set(70);
    }

    if (this.includeTags) {
      const tags = ['wordpress', 'seo', 'ai', 'marketing', 'design'];
      for (const tag of tags) {
        generated.push({
          loc: `${this.siteUrl}/tag/${tag}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.4,
          type: 'tag',
          status: 'warning',
          issues: ['Low priority tag page'],
        });
      }
      this.progress.set(100);
    }

    this.urls.set(generated);
    this.generating.set(false);
    this.snackBar.open(`Generated ${generated.length} URLs`, 'Close', { duration: 2000 });
  }

  previewSitemap(): void {
    if (this.urls().length === 0) {
      this.snackBar.open('Generate sitemap first', 'Close', { duration: 2000 });
      return;
    }
    const xml = this.generateXml();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  downloadSitemap(): void {
    if (this.urls().length === 0) {
      this.snackBar.open('Generate sitemap first', 'Close', { duration: 2000 });
      return;
    }
    const xml = this.generateXml();
    const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sitemap.xml';
    a.click();
    this.snackBar.open('Sitemap downloaded!', 'Close', { duration: 2000 });
  }

  private generateXml(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const url of this.urls()) {
      xml += '  <url>\n';
      xml += `    <loc>${url.loc}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      xml += '  </url>\n';
    }
    xml += '</urlset>';
    return xml;
  }
}
