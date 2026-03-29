import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  LocalSeoService,
  LocalBusiness,
  LocalCitation,
  LocalSEOStats,
} from '../../core/services/local-seo.service';

@Component({
  selector: 'app-local-seo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="local-seo-container">
      <header class="page-header">
        <div class="header-content">
          <h1><mat-icon>location_on</mat-icon> Local SEO Manager</h1>
          <p>Manage your local business presence across directories and maps</p>
        </div>
      </header>

      @if (business()) {
        <mat-card class="business-card">
          <div class="business-header">
            <mat-icon>store</mat-icon>
            <div class="business-info">
              <h3>{{ business()!.name }}</h3>
              <span class="type">{{ business()!.type }}</span>
            </div>
            @if (business()!.verified) {
              <span class="verified-badge">Verified</span>
            }
          </div>
          <div class="business-details">
            <div class="detail">
              <mat-icon>location_on</mat-icon>
              <span
                >{{ business()!.address.street }}, {{ business()!.address.city }},
                {{ business()!.address.state }} {{ business()!.address.zip }}</span
              >
            </div>
            <div class="detail">
              <mat-icon>phone</mat-icon>
              <span>{{ business()!.phone }}</span>
            </div>
            <div class="detail">
              <mat-icon>star</mat-icon>
              <span
                >Google: {{ business()!.ratings.google }} | Yelp: {{ business()!.ratings.yelp }} |
                FB: {{ business()!.ratings.facebook }}</span
              >
            </div>
          </div>
        </mat-card>
      }

      <div class="stats-grid">
        <mat-card class="stat-card found">
          <mat-icon>check_circle</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().citationsFound }}</span>
            <span class="label">Citations Found</span>
          </div>
        </mat-card>
        <mat-card class="stat-card missing">
          <mat-icon>error</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().citationsMissing }}</span>
            <span class="label">Missing</span>
          </div>
        </mat-card>
        <mat-card class="stat-card incorrect">
          <mat-icon>warning</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().citationsIncorrect }}</span>
            <span class="label">Incorrect</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>star_rate</mat-icon>
          <div class="stat-info">
            <span class="value">{{ stats().avgRating.toFixed(1) }}</span>
            <span class="label">Avg Rating</span>
          </div>
        </mat-card>
      </div>

      <mat-tab-group animationDuration="300ms">
        <mat-tab label="All Citations">
          <div class="tab-content">
            <div class="citations-list">
              @for (citation of citations(); track citation.id) {
                <mat-card class="citation-card" [class]="citation.status">
                  <div class="citation-info">
                    <span class="platform">{{ citation.platform }}</span>
                    <span class="category">{{ citation.category }}</span>
                  </div>
                  <div class="citation-status">
                    <span class="status-badge" [class]="citation.status">{{
                      citation.status
                    }}</span>
                  </div>
                  <div class="citation-actions">
                    @if (citation.status === 'found') {
                      <button mat-stroked-button>
                        <mat-icon>edit</mat-icon>
                        Update
                      </button>
                    } @else {
                      <button mat-raised-button color="primary">
                        <mat-icon>add</mat-icon>
                        Add
                      </button>
                    }
                    <a [href]="citation.url" target="_blank" mat-icon-button>
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  </div>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Missing Citations">
          <div class="tab-content">
            <div class="missing-list">
              @for (citation of missingCitations(); track citation.id) {
                <mat-card class="citation-card missing">
                  <div class="citation-info">
                    <span class="platform">{{ citation.platform }}</span>
                    <span class="category">{{ citation.category }}</span>
                  </div>
                  <button mat-raised-button color="primary">
                    <mat-icon>add</mat-icon>
                    Create Citation
                  </button>
                </mat-card>
              } @empty {
                <p class="no-missing">All citations are found!</p>
              }
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Business Info">
          <div class="tab-content">
            <mat-card class="edit-card">
              <h3>Edit Business Information</h3>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Business Name</mat-label>
                  <input matInput [(ngModel)]="business()!.name" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Phone</mat-label>
                  <input matInput [(ngModel)]="business()!.phone" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Street Address</mat-label>
                  <input matInput [(ngModel)]="business()!.address.street" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>City</mat-label>
                  <input matInput [(ngModel)]="business()!.address.city" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>State</mat-label>
                  <input matInput [(ngModel)]="business()!.address.state" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>ZIP</mat-label>
                  <input matInput [(ngModel)]="business()!.address.zip" />
                </mat-form-field>
              </div>
              <button mat-raised-button color="primary">
                <mat-icon>save</mat-icon>
                Save Changes
              </button>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .local-seo-container {
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
      .business-card {
        background: #1a1a2e;
        padding: 24px;
        margin-bottom: 24px;
        .business-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: #e94560;
          }
          .business-info {
            flex: 1;
            h3 {
              margin: 0;
              color: #fff;
            }
            .type {
              font-size: 13px;
              color: #a0a0b8;
            }
          }
          .verified-badge {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
        }
        .business-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          .detail {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #a0a0b8;
            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
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
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        &.found {
          border-color: rgba(76, 175, 80, 0.3);
          mat-icon {
            color: #4caf50;
          }
        }
        &.missing {
          border-color: rgba(244, 67, 54, 0.3);
          mat-icon {
            color: #f44336;
          }
        }
        &.incorrect {
          border-color: rgba(255, 152, 0, 0.3);
          mat-icon {
            color: #ff9800;
          }
        }
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
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
      .citations-list,
      .missing-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .citation-card {
        background: #1a1a2e;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        &.found {
          border-left: 4px solid #4caf50;
        }
        &.missing {
          border-left: 4px solid #f44336;
        }
        &.incorrect {
          border-left: 4px solid #ff9800;
        }
        .citation-info {
          flex: 1;
          .platform {
            display: block;
            font-weight: 600;
            color: #fff;
          }
          .category {
            font-size: 12px;
            color: #a0a0b8;
          }
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          &.found {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
          }
          &.missing {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
          }
          &.incorrect {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
          }
        }
        .citation-actions {
          display: flex;
          gap: 8px;
        }
      }
      .edit-card {
        background: #1a1a2e;
        padding: 24px;
        h3 {
          margin: 0 0 24px;
          color: #fff;
        }
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      .full-width {
        grid-column: 1 / -1;
      }
      .no-missing {
        text-align: center;
        color: #4caf50;
        padding: 40px;
      }
    `,
  ],
})
export class LocalSeoComponent implements OnInit {
  business = signal<LocalBusiness | null>(null);
  citations = signal<LocalCitation[]>([]);
  stats = signal<LocalSEOStats>({
    citationsFound: 0,
    citationsMissing: 0,
    citationsIncorrect: 0,
    avgRating: 0,
    totalReviews: 0,
    businessScore: 0,
  });
  missingCitations = signal<LocalCitation[]>([]);

  constructor(private localSeoService: LocalSeoService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.business.set(this.localSeoService.getBusiness());
    this.citations.set(this.localSeoService.getCitations());
    this.stats.set(this.localSeoService.getStats());
    this.missingCitations.set(this.localSeoService.getMissingCitations());
  }
}
