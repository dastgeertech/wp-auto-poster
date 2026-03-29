import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface Redirect {
  id: string;
  fromUrl: string;
  toUrl: string;
  type: 301 | 302 | 307 | 410 | 451;
  hits: number;
  lastAccessed: Date;
  status: 'active' | 'inactive' | 'broken';
  notes: string;
}

@Component({
  selector: 'app-redirect-manager',
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
  ],
  template: `
    <div class="redirect-manager">
      <div class="page-header">
        <h1><mat-icon>alt_route</mat-icon> Redirect Manager</h1>
        <p>Manage 301, 302, and other redirects for your site</p>
      </div>

      <div class="add-redirect-section">
        <div class="add-card">
          <h3><mat-icon>add_circle</mat-icon> Add New Redirect</h3>
          <div class="redirect-form">
            <mat-form-field appearance="outline">
              <mat-label>From URL</mat-label>
              <input matInput [(ngModel)]="newRedirect.fromUrl" placeholder="/old-page" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>To URL</mat-label>
              <input
                matInput
                [(ngModel)]="newRedirect.toUrl"
                placeholder="https://yoursite.com/new-page"
              />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <mat-select [(ngModel)]="newRedirect.type">
                <mat-option [value]="301">301 - Moved Permanently</mat-option>
                <mat-option [value]="302">302 - Found (Temporary)</mat-option>
                <mat-option [value]="307">307 - Temporary Redirect</mat-option>
                <mat-option [value]="410">410 - Gone (Deleted)</mat-option>
                <mat-option [value]="451">451 - Unavailable (Legal)</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Notes (optional)</mat-label>
              <input matInput [(ngModel)]="newRedirect.notes" placeholder="Redirect reason" />
            </mat-form-field>
            <button mat-flat-button class="add-btn" (click)="addRedirect()">
              <mat-icon>add</mat-icon> Add Redirect
            </button>
          </div>
        </div>
      </div>

      <div class="import-export">
        <button mat-stroked-button (click)="importRedirects()">
          <mat-icon>upload</mat-icon> Import
        </button>
        <button mat-stroked-button (click)="exportRedirects()">
          <mat-icon>download</mat-icon> Export
        </button>
        <button mat-stroked-button (click)="bulkGenerate()">
          <mat-icon>auto_fix_high</mat-icon> Bulk Generate
        </button>
      </div>

      @if (redirects().length > 0) {
        <div class="stats-row">
          <div class="stat">
            <span class="value">{{ redirects().length }}</span>
            <span class="label">Total Redirects</span>
          </div>
          <div class="stat">
            <span class="value">{{ totalHits() }}</span>
            <span class="label">Total Hits</span>
          </div>
          <div class="stat">
            <span class="value">{{ brokenCount() }}</span>
            <span class="label">Broken</span>
          </div>
        </div>

        <div class="filter-bar">
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search redirects..." />
          </div>
          <div class="filter-tabs">
            <button [class.active]="statusFilter() === 'all'" (click)="statusFilter.set('all')">
              All
            </button>
            <button
              [class.active]="statusFilter() === 'active'"
              (click)="statusFilter.set('active')"
            >
              Active
            </button>
            <button
              [class.active]="statusFilter() === 'inactive'"
              (click)="statusFilter.set('inactive')"
            >
              Inactive
            </button>
            <button
              [class.active]="statusFilter() === 'broken'"
              (click)="statusFilter.set('broken')"
            >
              Broken
            </button>
          </div>
        </div>

        <div class="redirects-table">
          <table>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Type</th>
                <th>Hits</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (redirect of filteredRedirects(); track redirect.id) {
                <tr [class]="redirect.status">
                  <td class="url-cell">
                    <code>{{ redirect.fromUrl }}</code>
                  </td>
                  <td class="url-cell">
                    <code>{{ redirect.toUrl }}</code>
                  </td>
                  <td>
                    <span class="type-badge" [attr.data-type]="redirect.type">{{
                      redirect.type
                    }}</span>
                  </td>
                  <td>{{ redirect.hits }}</td>
                  <td>
                    <span class="status-badge" [class]="redirect.status">{{
                      redirect.status
                    }}</span>
                  </td>
                  <td class="actions">
                    <button mat-icon-button (click)="editRedirect(redirect)" matTooltip="Edit">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button (click)="toggleRedirect(redirect)" matTooltip="Toggle">
                      <mat-icon>{{
                        redirect.status === 'active' ? 'pause' : 'play_arrow'
                      }}</mat-icon>
                    </button>
                    <button mat-icon-button (click)="deleteRedirect(redirect)" matTooltip="Delete">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon>alt_route</mat-icon>
          <h3>No Redirects Yet</h3>
          <p>Add your first redirect or import from an existing configuration</p>
        </div>
      }

      <div class="redirect-types-guide">
        <h3><mat-icon>info</mat-icon> Redirect Types Guide</h3>
        <div class="guide-grid">
          <div class="guide-item">
            <span class="code">301</span>
            <div class="guide-info">
              <strong>Moved Permanently</strong>
              <p>SEO-friendly redirect. Link equity is passed to the new URL.</p>
            </div>
          </div>
          <div class="guide-item">
            <span class="code">302</span>
            <div class="guide-info">
              <strong>Found (Temporary)</strong>
              <p>Temporary redirect. Original URL remains indexed.</p>
            </div>
          </div>
          <div class="guide-item">
            <span class="code">307</span>
            <div class="guide-info">
              <strong>Temporary Redirect</strong>
              <p>HTTP/1.1 temporary redirect. Preserves request method.</p>
            </div>
          </div>
          <div class="guide-item">
            <span class="code">410</span>
            <div class="guide-info">
              <strong>Gone</strong>
              <p>Page permanently deleted. Search engines remove from index.</p>
            </div>
          </div>
          <div class="guide-item">
            <span class="code">451</span>
            <div class="guide-info">
              <strong>Unavailable (Legal)</strong>
              <p>Content removed due to legal reasons.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .redirect-manager {
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
      .add-card {
        background: #1a1a2e;
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 20px;
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
      .redirect-form {
        display: grid;
        grid-template-columns: 2fr 2fr 120px 1fr auto;
        gap: 12px;
        align-items: start;
      }
      .add-btn {
        background: #e94560 !important;
        color: white !important;
        height: 56px;
      }
      .import-export {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
      }
      .stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      .stat {
        background: #1a1a2e;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        .value {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
        }
        .label {
          font-size: 12px;
          color: #a0a0b8;
        }
      }
      .filter-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .search-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #1a1a2e;
        padding: 8px 16px;
        border-radius: 8px;
        mat-icon {
          color: #a0a0b8;
        }
        input {
          background: transparent;
          border: none;
          color: #fff;
          outline: none;
          width: 250px;
        }
      }
      .filter-tabs {
        display: flex;
        gap: 8px;
        button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a0a0b8;
          padding: 8px 16px;
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
      .redirects-table {
        background: #1a1a2e;
        border-radius: 12px;
        overflow: hidden;
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          padding: 16px;
          color: #a0a0b8;
          font-size: 12px;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        tr.broken {
          background: rgba(244, 67, 54, 0.1);
        }
      }
      .url-cell {
        max-width: 300px;
        overflow: hidden;
        code {
          background: #0f0f1a;
          padding: 4px 8px;
          border-radius: 4px;
          color: #4caf50;
          font-size: 12px;
        }
      }
      .type-badge {
        background: rgba(233, 69, 96, 0.2);
        color: #e94560;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
      }
      .status-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        text-transform: capitalize;
        &.active {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }
        &.inactive {
          background: rgba(255, 255, 255, 0.1);
          color: #a0a0b8;
        }
        &.broken {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
        }
      }
      .actions {
        display: flex;
        gap: 4px;
        button {
          color: #a0a0b8;
          &:hover {
            color: #fff;
          }
        }
      }
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        background: #1a1a2e;
        border-radius: 12px;
        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: #a0a0b8;
        }
        h3 {
          margin: 16px 0 8px;
          color: #fff;
        }
        p {
          color: #a0a0b8;
        }
      }
      .redirect-types-guide {
        background: #1a1a2e;
        padding: 24px;
        border-radius: 12px;
        margin-top: 32px;
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
      .guide-grid {
        display: grid;
        gap: 12px;
      }
      .guide-item {
        display: flex;
        gap: 16px;
        padding: 16px;
        background: #16213e;
        border-radius: 8px;
        align-items: flex-start;
        .code {
          background: #e94560;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 16px;
        }
        .guide-info {
          flex: 1;
          strong {
            display: block;
            color: #fff;
            margin-bottom: 4px;
          }
          p {
            margin: 0;
            color: #a0a0b8;
            font-size: 13px;
          }
        }
      }
    `,
  ],
})
export class RedirectManagerComponent {
  redirects = signal<Redirect[]>([
    {
      id: '1',
      fromUrl: '/old-blog/post-1',
      toUrl: '/blog/new-post-1',
      type: 301,
      hits: 150,
      lastAccessed: new Date(),
      status: 'active',
      notes: 'Moved to new structure',
    },
    {
      id: '2',
      fromUrl: '/product/123',
      toUrl: '/products/blue-widget',
      type: 301,
      hits: 89,
      lastAccessed: new Date(),
      status: 'active',
      notes: '',
    },
    {
      id: '3',
      fromUrl: '/discontinued',
      toUrl: '/products',
      type: 410,
      hits: 23,
      lastAccessed: new Date(),
      status: 'active',
      notes: 'Product discontinued',
    },
    {
      id: '4',
      fromUrl: '/temp-promo',
      toUrl: '/summer-sale',
      type: 302,
      hits: 45,
      lastAccessed: new Date(),
      status: 'inactive',
      notes: 'Campaign ended',
    },
    {
      id: '5',
      fromUrl: '/broken-link',
      toUrl: 'https://externalsite.com',
      type: 301,
      hits: 0,
      lastAccessed: new Date(2024, 0, 1),
      status: 'broken',
      notes: 'External site down',
    },
  ]);

  newRedirect = { fromUrl: '', toUrl: '', type: 301 as 301 | 302 | 307 | 410 | 451, notes: '' };
  searchQuery = '';
  statusFilter = signal<'all' | 'active' | 'inactive' | 'broken'>('all');

  totalHits(): number {
    return this.redirects().reduce((sum, r) => sum + r.hits, 0);
  }
  brokenCount(): number {
    return this.redirects().filter((r) => r.status === 'broken').length;
  }

  filteredRedirects(): Redirect[] {
    let filtered = this.redirects();
    const f = this.statusFilter();
    if (f !== 'all') filtered = filtered.filter((r) => r.status === f);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) => r.fromUrl.toLowerCase().includes(q) || r.toUrl.toLowerCase().includes(q),
      );
    }
    return filtered;
  }

  constructor(private snackBar: MatSnackBar) {}

  addRedirect(): void {
    if (!this.newRedirect.fromUrl || !this.newRedirect.toUrl) {
      this.snackBar.open('Please fill in both URLs', 'Close', { duration: 2000 });
      return;
    }
    const redirect: Redirect = {
      id: Date.now().toString(),
      ...this.newRedirect,
      hits: 0,
      lastAccessed: new Date(),
      status: 'active',
    };
    this.redirects.update((r) => [...r, redirect]);
    this.newRedirect = { fromUrl: '', toUrl: '', type: 301, notes: '' };
    this.snackBar.open('Redirect added!', 'Close', { duration: 2000 });
  }

  editRedirect(redirect: Redirect): void {
    this.snackBar.open('Edit functionality coming soon', 'Close', { duration: 2000 });
  }

  toggleRedirect(redirect: Redirect): void {
    this.redirects.update((list) =>
      list.map((r) =>
        r.id === redirect.id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r,
      ),
    );
    this.snackBar.open('Redirect toggled', 'Close', { duration: 2000 });
  }

  deleteRedirect(redirect: Redirect): void {
    this.redirects.update((list) => list.filter((r) => r.id !== redirect.id));
    this.snackBar.open('Redirect deleted', 'Close', { duration: 2000 });
  }

  importRedirects(): void {
    this.snackBar.open('Import feature coming soon', 'Close', { duration: 2000 });
  }

  exportRedirects(): void {
    const data = JSON.stringify(this.redirects(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'redirects.json';
    a.click();
    this.snackBar.open('Redirects exported!', 'Close', { duration: 2000 });
  }

  bulkGenerate(): void {
    const bulk: Redirect[] = [];
    for (let i = 1; i <= 10; i++) {
      bulk.push({
        id: Date.now().toString() + i,
        fromUrl: `/old-page-${i}`,
        toUrl: `/new-page-${i}`,
        type: 301,
        hits: 0,
        lastAccessed: new Date(),
        status: 'active',
        notes: 'Bulk generated',
      });
    }
    this.redirects.update((list) => [...list, ...bulk]);
    this.snackBar.open('10 redirects generated!', 'Close', { duration: 2000 });
  }
}
