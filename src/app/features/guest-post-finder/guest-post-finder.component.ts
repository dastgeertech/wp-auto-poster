import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-guest-post-finder',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="finder-container">
      <header class="page-header">
        <h1><mat-icon>person_add</mat-icon> Guest Post Finder</h1>
        <p>Find guest posting opportunities in your niche</p>
      </header>
      <div class="search-section">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Enter your niche or keyword</mat-label>
          <input matInput placeholder="e.g., digital marketing, SEO, technology" />
        </mat-form-field>
        <button mat-raised-button color="primary">
          <mat-icon>search</mat-icon> Find Opportunities
        </button>
      </div>
      <div class="opportunities-grid">
        @for (opp of opportunities; track opp.id) {
          <mat-card class="opp-card">
            <div class="opp-header">
              <mat-icon>{{ opp.icon }}</mat-icon>
              <div>
                <h3>{{ opp.name }}</h3>
                <span class="domain">{{ opp.domain }}</span>
              </div>
              <span class="da-badge">DA {{ opp.da }}</span>
            </div>
            <p>{{ opp.description }}</p>
            <div class="opp-meta">
              <span><mat-icon>article</mat-icon> {{ opp.guestPosts }} guest posts</span>
              <span><mat-icon>trending_up</mat-icon> DR {{ opp.dr }}</span>
            </div>
            <button mat-raised-button color="primary">Pitch</button>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .finder-container {
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
      .search-section {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        .search-field {
          flex: 1;
        }
      }
      .opportunities-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
      }
      .opp-card {
        background: #1a1a2e;
        padding: 20px;
        .opp-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          mat-icon {
            font-size: 32px;
            color: #e94560;
          }
          h3 {
            margin: 0;
            font-size: 16px;
            color: #fff;
          }
          .domain {
            font-size: 12px;
            color: #a0a0b8;
          }
          .da-badge {
            margin-left: auto;
            background: rgba(233, 69, 96, 0.2);
            color: #e94560;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
        }
        p {
          font-size: 13px;
          color: #a0a0b8;
          margin: 0 0 12px;
        }
        .opp-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          span {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #a0a0b8;
            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }
        }
      }
    `,
  ],
})
export class GuestPostFinderComponent {
  opportunities = [
    {
      id: '1',
      name: 'TechCrunch',
      domain: 'techcrunch.com',
      da: 92,
      dr: 95,
      icon: 'article',
      description: 'Leading technology news outlet accepting guest contributions',
      guestPosts: 1250,
    },
    {
      id: '2',
      name: 'HubSpot Blog',
      domain: 'blog.hubspot.com',
      da: 89,
      dr: 92,
      icon: 'business',
      description: 'Marketing and sales blog with high authority',
      guestPosts: 890,
    },
    {
      id: '3',
      name: 'Moz Blog',
      domain: 'moz.com/blog',
      da: 91,
      dr: 93,
      icon: 'search',
      description: 'SEO insights and industry analysis',
      guestPosts: 450,
    },
    {
      id: '4',
      name: 'Entrepreneur',
      domain: 'entrepreneur.com',
      da: 88,
      dr: 91,
      icon: 'work',
      description: 'Business and startup focused content',
      guestPosts: 720,
    },
    {
      id: '5',
      name: 'Forbes',
      domain: 'forbes.com',
      da: 95,
      dr: 97,
      icon: 'business_center',
      description: 'Premium business publication',
      guestPosts: 2100,
    },
    {
      id: '6',
      name: 'Search Engine Journal',
      domain: 'searchenginejournal.com',
      da: 86,
      dr: 89,
      icon: 'search',
      description: 'SEO and digital marketing news',
      guestPosts: 560,
    },
  ];
}
