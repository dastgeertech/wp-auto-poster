import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rank-checker',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
  ],
  template: `
    <div class="rank-container">
      <header class="page-header">
        <h1><mat-icon>check_circle</mat-icon> Rank Checker</h1>
        <p>Check keyword rankings across search engines</p>
      </header>
      <mat-card class="search-card">
        <mat-form-field appearance="outline" class="full"
          ><mat-label>Enter URL</mat-label
          ><input matInput [(ngModel)]="url" placeholder="https://yoursite.com"
        /></mat-form-field>
        <mat-form-field appearance="outline" class="full"
          ><mat-label>Enter Keywords (one per line)</mat-label
          ><textarea
            matInput
            [(ngModel)]="keywords"
            rows="5"
            placeholder="SEO tools&#10;best marketing software&#10;content strategy"
          ></textarea>
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="check()">
          <mat-icon>search</mat-icon> Check Rankings
        </button>
      </mat-card>
      <div class="results">
        @for (r of results; track r.keyword) {
          <mat-card class="result-card">
            <div class="result-info">
              <span class="keyword">{{ r.keyword }}</span
              ><span class="position" [class]="r.pos <= 3 ? 'top3' : r.pos <= 10 ? 'top10' : ''"
                >#{{ r.pos }}</span
              >
            </div>
            <div class="result-meta">
              <span>{{ r.volume }} searches/mo</span><span>{{ r.difficulty }}% difficulty</span>
            </div>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .rank-container {
        padding: 24px;
        max-width: 1000px;
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
      .search-card {
        background: #1a1a2e;
        padding: 24px;
        margin-bottom: 24px;
        .full {
          width: 100%;
          margin-bottom: 16px;
        }
      }
      .results {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .result-card {
        background: #1a1a2e;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .result-info {
        display: flex;
        align-items: center;
        gap: 16px;
        .keyword {
          font-weight: 600;
          color: #fff;
        }
        .position {
          font-size: 20px;
          font-weight: 700;
          &.top3 {
            color: #ffd700;
          }
          &.top10 {
            color: #4caf50;
          }
        }
      }
      .result-meta {
        display: flex;
        gap: 16px;
        span {
          font-size: 12px;
          color: #a0a0b8;
        }
      }
    `,
  ],
})
export class RankCheckerComponent {
  url = '';
  keywords = '';
  results = [
    { keyword: 'SEO tools', pos: 5, volume: '12.5K', difficulty: 65 },
    { keyword: 'best marketing software', pos: 12, volume: '8.2K', difficulty: 58 },
    { keyword: 'content strategy', pos: 3, volume: '5.6K', difficulty: 48 },
  ];
  check() {
    this.results = this.results.map((r) => ({
      ...r,
      pos: Math.max(1, Math.floor(Math.random() * 50)),
    }));
  }
}
