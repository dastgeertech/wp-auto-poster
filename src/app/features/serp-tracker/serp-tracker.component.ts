import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-serp-tracker',
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
    <div class="serp-container">
      <header class="page-header">
        <h1><mat-icon>table_chart</mat-icon> SERP Tracker</h1>
        <p>Monitor search engine results pages for your keywords</p>
      </header>
      <div class="stats-row">
        <mat-card class="stat"
          ><mat-icon>search</mat-icon><span class="val">1,250</span
          ><span class="lbl">Serps Tracked</span></mat-card
        >
        <mat-card class="stat"
          ><mat-icon>visibility</mat-icon><span class="val">45K</span
          ><span class="lbl">Monthly Impressions</span></mat-card
        >
        <mat-card class="stat"
          ><mat-icon>trending_up</mat-icon><span class="val">+12</span
          ><span class="lbl">New Features</span></mat-card
        >
      </div>
      <mat-tab-group>
        <mat-tab label="Rankings">
          <div class="tab-content">
            <table mat-table [dataSource]="serpData">
              <ng-container matColumnDef="keyword"
                ><th mat-header-cell *matHeaderCellDef>Keyword</th>
                <td mat-cell *matCellDef="let s">{{ s.keyword }}</td></ng-container
              >
              <ng-container matColumnDef="position"
                ><th mat-header-cell *matHeaderCellDef>Position</th>
                <td mat-cell *matCellDef="let s">
                  <span class="pos" [class]="s.pos <= 3 ? 'top3' : s.pos <= 10 ? 'top10' : ''"
                    >#{{ s.pos }}</span
                  >
                </td></ng-container
              >
              <ng-container matColumnDef="volume"
                ><th mat-header-cell *matHeaderCellDef>Volume</th>
                <td mat-cell *matCellDef="let s">{{ s.volume }}</td></ng-container
              >
              <ng-container matColumnDef="change"
                ><th mat-header-cell *matHeaderCellDef>Change</th>
                <td mat-cell *matCellDef="let s">
                  <span [class]="s.change > 0 ? 'up' : 'down'"
                    >{{ s.change > 0 ? '+' : '' }}{{ s.change }}</span
                  >
                </td></ng-container
              >
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .serp-container {
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
      .stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      .stat {
        background: #1a1a2e;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        mat-icon {
          font-size: 32px;
          color: #e94560;
          margin-bottom: 8px;
        }
        .val {
          font-size: 28px;
          font-weight: 700;
          color: #fff;
        }
        .lbl {
          font-size: 12px;
          color: #a0a0b8;
        }
      }
      .pos {
        font-weight: 700;
        &.top3 {
          color: #ffd700;
        }
        &.top10 {
          color: #4caf50;
        }
      }
      .up {
        color: #4caf50;
      }
      .down {
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
export class SerpTrackerComponent {
  cols = ['keyword', 'position', 'volume', 'change'];
  serpData = [
    { keyword: 'best SEO tools 2024', pos: 5, volume: '12.5K', change: 2 },
    { keyword: 'digital marketing guide', pos: 8, volume: '8.2K', change: -1 },
    { keyword: 'content marketing strategies', pos: 15, volume: '5.6K', change: 5 },
    { keyword: 'social media management', pos: 3, volume: '15K', change: 0 },
    { keyword: 'email marketing tips', pos: 12, volume: '4.2K', change: 3 },
  ];
}
