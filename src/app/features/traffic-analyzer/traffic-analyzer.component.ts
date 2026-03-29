import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-traffic-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
  ],
  template: `
    <div class="traffic-container">
      <header class="page-header">
        <h1><mat-icon>insights</mat-icon> Traffic Analyzer</h1>
        <p>Analyze your website traffic and user behavior</p>
      </header>
      <div class="stats-row">
        <mat-card class="stat-card"
          ><mat-icon>visibility</mat-icon>
          <div><span class="val">125K</span><span class="lbl">Total Visits</span></div></mat-card
        >
        <mat-card class="stat-card"
          ><mat-icon>people</mat-icon>
          <div><span class="val">45K</span><span class="lbl">Unique Visitors</span></div></mat-card
        >
        <mat-card class="stat-card"
          ><mat-icon>timer</mat-icon>
          <div><span class="val">3:45</span><span class="lbl">Avg Duration</span></div></mat-card
        >
        <mat-card class="stat-card"
          ><mat-icon>trending_up</mat-icon>
          <div><span class="val">+12.5%</span><span class="lbl">Growth</span></div></mat-card
        >
      </div>
      <mat-tab-group>
        <mat-tab label="Top Pages">
          <table mat-table [dataSource]="pages">
            <ng-container matColumnDef="page"
              ><th mat-header-cell *matHeaderCellDef>Page</th>
              <td mat-cell *matCellDef="let p">{{ p.page }}</td></ng-container
            >
            <ng-container matColumnDef="views"
              ><th mat-header-cell *matHeaderCellDef>Views</th>
              <td mat-cell *matCellDef="let p">{{ p.views }}</td></ng-container
            >
            <ng-container matColumnDef="bounce"
              ><th mat-header-cell *matHeaderCellDef>Bounce</th>
              <td mat-cell *matCellDef="let p">
                <span [class]="p.bounce < 50 ? 'good' : 'bad'">{{ p.bounce }}%</span>
              </td></ng-container
            >
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>
          </table>
        </mat-tab>
        <mat-tab label="Traffic Sources">
          <div class="sources-list">
            @for (src of sources; track src.name) {
              <mat-card class="source-card"
                ><mat-icon>{{ src.icon }}</mat-icon>
                <div class="src-info">
                  <span class="name">{{ src.name }}</span
                  ><span class="percent">{{ src.percent }}%</span>
                </div>
                <div class="bar">
                  <div
                    class="fill"
                    [style.width.%]="src.percent"
                    [style.background]="src.color"
                  ></div></div
              ></mat-card>
            }
          </div>
        </mat-tab>
        <mat-tab label="Geography">
          <div class="geo-grid">
            @for (g of geo; track g.country) {
              <mat-card class="geo-card"
                ><span class="flag">{{ g.flag }}</span
                ><span class="country">{{ g.country }}</span
                ><span class="visits">{{ g.visits }} visits</span></mat-card
              >
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .traffic-container {
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
      .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      .stat-card {
        background: #1a1a2e;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        mat-icon {
          font-size: 32px;
          color: #e94560;
        }
        .val {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
        }
        .lbl {
          font-size: 12px;
          color: #a0a0b8;
        }
      }
      .sources-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .source-card {
        background: #1a1a2e;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        mat-icon {
          color: #e94560;
        }
        .src-info {
          min-width: 150px;
          .name {
            display: block;
            color: #fff;
          }
          .percent {
            font-weight: 700;
            color: #fff;
          }
        }
        .bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          .fill {
            height: 100%;
            border-radius: 4px;
          }
        }
      }
      .geo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }
      .geo-card {
        background: #1a1a2e;
        padding: 16px;
        text-align: center;
        .flag {
          display: block;
          font-size: 32px;
          margin-bottom: 8px;
        }
        .country {
          display: block;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }
        .visits {
          font-size: 12px;
          color: #a0a0b8;
        }
      }
      .good {
        color: #4caf50;
      }
      .bad {
        color: #f44336;
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
    `,
  ],
})
export class TrafficAnalyzerComponent {
  cols = ['page', 'views', 'bounce'];
  pages = [
    { page: '/blog/seo-guide', views: '15.2K', bounce: 42 },
    { page: '/', views: '12.8K', bounce: 35 },
    { page: '/pricing', views: '8.5K', bounce: 55 },
    { page: '/blog/content-marketing', views: '7.2K', bounce: 48 },
    { page: '/features', views: '5.9K', bounce: 62 },
  ];
  sources = [
    { name: 'Organic Search', percent: 45, icon: 'search', color: '#4caf50' },
    { name: 'Direct', percent: 28, icon: 'link', color: '#2196f3' },
    { name: 'Social Media', percent: 15, icon: 'share', color: '#9c27b0' },
    { name: 'Referral', percent: 8, icon: 'language', color: '#ff9800' },
    { name: 'Email', percent: 4, icon: 'email', color: '#e94560' },
  ];
  geo = [
    { country: 'United States', flag: '🇺🇸', visits: '45K' },
    { country: 'United Kingdom', flag: '🇬🇧', visits: '18K' },
    { country: 'Canada', flag: '🇨🇦', visits: '12K' },
    { country: 'Germany', flag: '🇩🇪', visits: '8K' },
    { country: 'Australia', flag: '🇦🇺', visits: '6K' },
    { country: 'France', flag: '🇫🇷', visits: '5K' },
  ];
}
