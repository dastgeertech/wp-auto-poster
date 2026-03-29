import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-seo-audit',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule, MatProgressBarModule],
  template: `
    <div class="audit-container">
      <header class="page-header">
        <h1><mat-icon>assignment</mat-icon> SEO Audit Tool</h1>
        <p>Comprehensive technical SEO analysis for your website</p>
      </header>
      <button mat-raised-button color="primary" (click)="runAudit()">
        <mat-icon>play_arrow</mat-icon> Run Full Audit
      </button>

      <div class="audit-grid">
        <mat-card class="score-card">
          <h3>Overall Score</h3>
          <div class="score-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#333" stroke-width="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#4caf50"
                stroke-width="8"
                [attr.stroke-dasharray]="220 + ' ' + 283"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <span class="score">{{ score }}</span>
          </div>
          <span class="label">{{
            score >= 80 ? 'Good' : score >= 60 ? 'Needs Work' : 'Poor'
          }}</span>
        </mat-card>

        @for (category of categories; track category.name) {
          <mat-card class="category-card">
            <div class="cat-header">
              <mat-icon>{{ category.icon }}</mat-icon>
              <h3>{{ category.name }}</h3>
              <span
                class="score"
                [class]="category.score >= 80 ? 'good' : category.score >= 60 ? 'warning' : 'poor'"
                >{{ category.score }}/100</span
              >
            </div>
            <mat-progress-bar mode="determinate" [value]="category.score"></mat-progress-bar>
            <div class="issues">
              <span class="critical">{{ category.critical }} Critical</span
              ><span class="warnings">{{ category.warnings }} Warnings</span>
            </div>
          </mat-card>
        }
      </div>

      <div class="issues-list">
        <h2>Critical Issues</h2>
        @for (issue of issues; track issue.id) {
          <mat-card class="issue-card" [class]="issue.severity">
            <mat-icon>{{ issue.severity === 'critical' ? 'error' : 'warning' }}</mat-icon>
            <div class="issue-content">
              <h4>{{ issue.title }}</h4>
              <p>{{ issue.description }}</p>
            </div>
            <button mat-stroked-button color="primary">Fix</button>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .audit-container {
        padding: 24px;
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
      .audit-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        margin: 24px 0;
      }
      .score-card {
        background: #1a1a2e;
        text-align: center;
        padding: 32px;
        h3 {
          margin: 0 0 16px;
          color: #fff;
        }
        .score-circle {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 12px;
          svg {
            width: 100%;
            height: 100%;
          }
          .score {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 36px;
            font-weight: 700;
            color: #fff;
          }
        }
        .label {
          font-size: 14px;
          color: #a0a0b8;
        }
      }
      .category-card {
        background: #1a1a2e;
        padding: 20px;
        .cat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          mat-icon {
            color: #e94560;
          }
          h3 {
            flex: 1;
            margin: 0;
            font-size: 16px;
            color: #fff;
          }
          .score {
            font-weight: 700;
            &.good {
              color: #4caf50;
            }
            &.warning {
              color: #ff9800;
            }
            &.poor {
              color: #f44336;
            }
          }
        }
        mat-progress-bar {
          margin-bottom: 12px;
        }
        .issues {
          display: flex;
          gap: 16px;
          font-size: 12px;
          .critical {
            color: #f44336;
          }
          .warnings {
            color: #ff9800;
          }
        }
      }
      .issues-list {
        h2 {
          color: #fff;
          margin: 24px 0 16px;
        }
      }
      .issue-card {
        background: #1a1a2e;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        margin-bottom: 12px;
        &.critical mat-icon {
          color: #f44336;
        }
        &.warning mat-icon {
          color: #ff9800;
        }
        .issue-content {
          flex: 1;
          h4 {
            margin: 0 0 4px;
            font-size: 14px;
            color: #fff;
          }
          p {
            margin: 0;
            font-size: 13px;
            color: #a0a0b8;
          }
        }
      }
    `,
  ],
})
export class SeoAuditComponent {
  score = 78;
  categories = [
    { name: 'Performance', icon: 'speed', score: 72, critical: 2, warnings: 5 },
    { name: 'Accessibility', icon: 'accessibility', score: 85, critical: 0, warnings: 3 },
    { name: 'Best Practices', icon: 'verified', score: 68, critical: 1, warnings: 4 },
    { name: 'SEO', icon: 'search', score: 82, critical: 1, warnings: 6 },
    { name: 'Social', icon: 'share', score: 75, critical: 0, warnings: 2 },
  ];
  issues = [
    {
      id: '1',
      severity: 'critical',
      title: 'Missing Meta Descriptions',
      description: '15 pages are missing meta descriptions which affects CTR in search results.',
    },
    {
      id: '2',
      severity: 'critical',
      title: 'Slow Page Speed',
      description: 'LCP is taking 3.2s which exceeds the 2.5s recommended threshold.',
    },
    {
      id: '3',
      severity: 'warning',
      title: 'Broken Internal Links',
      description: 'Found 8 broken internal links that should be fixed or redirected.',
    },
    {
      id: '4',
      severity: 'warning',
      title: 'Missing Alt Text',
      description: '23 images are missing alt attributes for accessibility.',
    },
  ];
  runAudit() {
    this.score = Math.floor(Math.random() * 20) + 75;
  }
}
