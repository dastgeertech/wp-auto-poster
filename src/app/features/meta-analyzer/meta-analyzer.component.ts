import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-meta-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    FormsModule,
  ],
  template: `
    <div class="meta-container">
      <header class="page-header">
        <h1><mat-icon>title</mat-icon> Meta Tags Analyzer</h1>
        <p>Analyze and optimize your page meta tags</p>
      </header>
      <mat-card class="input-card">
        <mat-form-field appearance="outline" class="full"
          ><mat-label>Enter URL or paste HTML</mat-label
          ><input matInput [(ngModel)]="url" placeholder="https://yoursite.com/page"
        /></mat-form-field>
        <button mat-raised-button color="primary" (click)="analyze()">
          <mat-icon>analytics</mat-icon> Analyze
        </button>
      </mat-card>
      <div class="analysis-grid">
        <mat-card class="score-card"
          ><h3>Overall Score</h3>
          <div class="score">{{ score }}</div>
          <mat-progress-bar mode="determinate" [value]="score"></mat-progress-bar
        ></mat-card>
        @for (tag of tags; track tag.name) {
          <mat-card class="tag-card" [class]="tag.status">
            <div class="tag-header">
              <mat-icon>{{ tag.icon }}</mat-icon
              ><span>{{ tag.name }}</span
              ><span class="status">{{ tag.status }}</span>
            </div>
            <div class="tag-content">
              <pre>{{ tag.content }}</pre>
            </div>
            <div class="tag-meta">
              <span>Length: {{ tag.length }}/{{ tag.recommended }}</span
              ><span [class]="tag.length > tag.recommended ? 'warn' : 'ok'">{{
                tag.length > tag.recommended ? 'Too long' : 'Good'
              }}</span>
            </div>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .meta-container {
        padding: 24px;
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
        margin-bottom: 24px;
        display: flex;
        gap: 16px;
        align-items: flex-start;
        .full {
          flex: 1;
        }
      }
      .analysis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
      }
      .score-card {
        background: #1a1a2e;
        text-align: center;
        padding: 32px;
        h3 {
          margin: 0 0 12px;
          color: #fff;
        }
        .score {
          font-size: 64px;
          font-weight: 700;
          color: #4caf50;
          margin-bottom: 12px;
        }
      }
      .tag-card {
        background: #1a1a2e;
        padding: 20px;
        &.good {
          border-left: 4px solid #4caf50;
        }
        &.warning {
          border-left: 4px solid #ff9800;
        }
        &.error {
          border-left: 4px solid #f44336;
        }
      }
      .tag-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        mat-icon {
          color: #e94560;
        }
        span {
          font-weight: 600;
          color: #fff;
        }
        .status {
          margin-left: auto;
          font-size: 12px;
          text-transform: capitalize;
          &.good {
            color: #4caf50;
          }
          &.warning {
            color: #ff9800;
          }
          &.error {
            color: #f44336;
          }
        }
      }
      .tag-content {
        background: #16213e;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        pre {
          margin: 0;
          font-size: 12px;
          color: #a0a0b8;
          white-space: pre-wrap;
          word-break: break-all;
        }
      }
      .tag-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #a0a0b8;
        .warn {
          color: #f44336;
        }
        .ok {
          color: #4caf50;
        }
      }
    `,
  ],
})
export class MetaAnalyzerComponent {
  url = '';
  score = 78;
  tags = [
    {
      name: 'Title Tag',
      icon: 'title',
      content: 'Best SEO Tools & Software for 2024 | YourBrand',
      length: 52,
      recommended: 60,
      status: 'good',
    },
    {
      name: 'Meta Description',
      icon: 'description',
      content:
        'Discover the best SEO tools and software to boost your rankings. Our comprehensive guide covers top-rated solutions for every budget.',
      length: 118,
      recommended: 160,
      status: 'good',
    },
    {
      name: 'H1 Tag',
      icon: 'format_size',
      content: 'Best SEO Tools & Software for 2024',
      length: 35,
      recommended: 70,
      status: 'good',
    },
    {
      name: 'Canonical URL',
      icon: 'link',
      content: 'https://yoursite.com/seo-tools',
      length: 35,
      recommended: 200,
      status: 'good',
    },
    {
      name: 'OG Title',
      icon: 'share',
      content: 'Best SEO Tools 2024 - YourBrand',
      length: 35,
      recommended: 95,
      status: 'warning',
    },
  ];
  analyze() {
    this.score = Math.floor(Math.random() * 30) + 70;
  }
}
