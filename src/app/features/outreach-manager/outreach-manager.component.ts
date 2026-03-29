import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { OutreachService, OutreachContact } from '../../core/services/outreach.service';

@Component({
  selector: 'app-outreach-manager',
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
    <div class="outreach-container">
      <header class="page-header">
        <h1><mat-icon>send</mat-icon> Link Building Outreach</h1>
        <p>Manage your link building campaigns and outreach contacts</p>
      </header>
      <div class="stats-grid">
        <mat-card class="stat-card"
          ><mat-icon>people</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().totalContacts }}</span
            ><span class="label">Contacts</span>
          </div></mat-card
        >
        <mat-card class="stat-card"
          ><mat-icon>email</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().contacted }}</span
            ><span class="label">Contacted</span>
          </div></mat-card
        >
        <mat-card class="stat-card"
          ><mat-icon>reply</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().responses }}</span
            ><span class="label">Responses</span>
          </div></mat-card
        >
        <mat-card class="stat-card"
          ><mat-icon>check_circle</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().published }}</span
            ><span class="label">Published</span>
          </div></mat-card
        >
      </div>
      <mat-tab-group>
        <mat-tab label="All Contacts">
          <div class="tab-content">
            <table mat-table [dataSource]="contacts()">
              <ng-container matColumnDef="name"
                ><th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let c">{{ c.name }}</td></ng-container
              >
              <ng-container matColumnDef="website"
                ><th mat-header-cell *matHeaderCellDef>Website</th>
                <td mat-cell *matCellDef="let c">{{ c.website }}</td></ng-container
              >
              <ng-container matColumnDef="da"
                ><th mat-header-cell *matHeaderCellDef>DA</th>
                <td mat-cell *matCellDef="let c">{{ c.domainAuthority }}</td></ng-container
              >
              <ng-container matColumnDef="platform"
                ><th mat-header-cell *matHeaderCellDef>Platform</th>
                <td mat-cell *matCellDef="let c">{{ c.platform }}</td></ng-container
              >
              <ng-container matColumnDef="status"
                ><th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let c">
                  <span class="status-badge" [class]="c.status">{{ c.status }}</span>
                </td></ng-container
              >
              <ng-container matColumnDef="actions"
                ><th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button (click)="update(c, 'contacted')">
                    <mat-icon>email</mat-icon>
                  </button>
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
      .outreach-container {
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
      .stats-grid {
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
      .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        text-transform: capitalize;
        &.pending {
          background: rgba(158, 158, 158, 0.2);
          color: #9e9e9e;
        }
        &.contacted {
          background: rgba(33, 150, 243, 0.2);
          color: #2196f3;
        }
        &.responded {
          background: rgba(255, 152, 0, 0.2);
          color: #ff9800;
        }
        &.published {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }
        &.rejected {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
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
    `,
  ],
})
export class OutreachManagerComponent implements OnInit {
  contacts = signal<OutreachContact[]>([]);
  stats = signal({
    totalContacts: 0,
    contacted: 0,
    responses: 0,
    published: 0,
    avgResponseRate: 0,
  });
  cols = ['name', 'website', 'da', 'platform', 'status', 'actions'];
  constructor(private svc: OutreachService) {}
  ngOnInit() {
    this.contacts.set(this.svc.getContacts());
    this.stats.set(this.svc.getStats());
  }
  update(c: OutreachContact, status: any) {
    this.svc.updateStatus(c.id, status);
    this.contacts.set(this.svc.getContacts());
    this.stats.set(this.svc.getStats());
  }
}
