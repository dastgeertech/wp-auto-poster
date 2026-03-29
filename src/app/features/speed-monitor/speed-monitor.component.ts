import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-speed-monitor',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="speed-container">
      <header class="page-header">
        <h1><mat-icon>speed</mat-icon> Site Speed Monitor</h1>
        <p>Track Core Web Vitals and page performance over time</p>
      </header>
      <div class="vitals-grid">
        <mat-card class="vital-card">
          <div class="vital-header"><mat-icon>schedule</mat-icon><span>FCP</span></div>
          <span class="vital-val good">1.8s</span>
          <mat-progress-bar mode="determinate" value="90"></mat-progress-bar>
          <span class="vital-status good">Good</span>
        </mat-card>
        <mat-card class="vital-card">
          <div class="vital-header"><mat-icon>image</mat-icon><span>LCP</span></div>
          <span class="vital-val warning">3.2s</span>
          <mat-progress-bar mode="determinate" value="65"></mat-progress-bar>
          <span class="vital-status warning">Needs Work</span>
        </mat-card>
        <mat-card class="vital-card">
          <div class="vital-header"><mat-icon>layout</mat-icon><span>CLS</span></div>
          <span class="vital-val good">0.05</span>
          <mat-progress-bar mode="determinate" value="95"></mat-progress-bar>
          <span class="vital-status good">Good</span>
        </mat-card>
        <mat-card class="vital-card">
          <div class="vital-header"><mat-icon>network_check</mat-icon><span>TTFB</span></div>
          <span class="vital-val good">180ms</span>
          <mat-progress-bar mode="determinate" value="85"></mat-progress-bar>
          <span class="vital-status good">Good</span>
        </mat-card>
      </div>
      <div class="trend-section">
        <h3>30-Day Performance Trend</h3>
        <div class="trend-chart">
          @for (day of days; track day) {
            <div class="day-bar" [style.height.%]="Math.random() * 40 + 60"></div>
          }
        </div>
        <div class="trend-labels"><span>30 days ago</span><span>Today</span></div>
      </div>
    </div>
  `,
  styles: [
    `
      .speed-container {
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
      .vitals-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      .vital-card {
        background: #1a1a2e;
        padding: 20px;
        text-align: center;
        .vital-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 12px;
          mat-icon {
            color: #e94560;
          }
          span {
            color: #a0a0b8;
            font-size: 14px;
          }
        }
        .vital-val {
          display: block;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 12px;
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
        mat-progress-bar {
          margin-bottom: 8px;
        }
        .vital-status {
          font-size: 12px;
          font-weight: 600;
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
      .trend-section {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 24px;
        h3 {
          margin: 0 0 20px;
          color: #fff;
        }
        .trend-chart {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 120px;
          .day-bar {
            flex: 1;
            background: linear-gradient(180deg, #e94560, #ff6b6b);
            border-radius: 4px 4px 0 0;
            min-height: 20px;
          }
        }
        .trend-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          span {
            font-size: 12px;
            color: #a0a0b8;
          }
        }
      }
    `,
  ],
})
export class SpeedMonitorComponent {
  Math = Math;
  days = Array.from({ length: 30 }, (_, i) => i);
}
