import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-link-opportunities',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="opp-container">
      <header class="page-header">
        <h1><mat-icon>link</mat-icon> Link Opportunities</h1>
        <p>Discover new backlink opportunities for your website</p>
      </header>
      <mat-form-field appearance="outline" class="search-field"
        ><mat-label>Enter your URL</mat-label><input matInput value="yoursite.com"
      /></mat-form-field>
      <button mat-raised-button color="primary">
        <mat-icon>search</mat-icon> Find Opportunities
      </button>

      <div class="opp-sections">
        @for (section of sections; track section.title) {
          <div class="section">
            <h2>
              <mat-icon>{{ section.icon }}</mat-icon> {{ section.title }}
            </h2>
            <div class="cards-grid">
              @for (card of section.cards; track card.domain) {
                <mat-card class="opp-card">
                  <div class="card-header">
                    <span class="domain">{{ card.domain }}</span
                    ><span class="da">DA {{ card.da }}</span>
                  </div>
                  <p>{{ card.reason }}</p>
                  <div class="card-meta">
                    <span>{{ card.type }}</span
                    ><span>{{ card.difficulty }}</span>
                  </div>
                  <button mat-raised-button color="primary">Outreach</button>
                </mat-card>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .opp-container {
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
      .search-field {
        width: 400px;
        margin-right: 16px;
      }
      .section {
        margin-top: 32px;
        h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-size: 18px;
          mat-icon {
            color: #e94560;
          }
        }
      }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      .opp-card {
        background: #1a1a2e;
        padding: 20px;
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          .domain {
            font-weight: 600;
            color: #fff;
            font-size: 16px;
          }
          .da {
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
          line-height: 1.5;
        }
        .card-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          span {
            font-size: 12px;
            color: #666;
          }
        }
      }
    `,
  ],
})
export class LinkOpportunitiesComponent {
  sections = [
    {
      title: 'Guest Posting',
      icon: 'person_add',
      cards: [
        {
          domain: 'techcrunch.com',
          da: 92,
          reason:
            'High authority tech blog accepting guest contributions on digital marketing topics.',
          type: 'Guest Post',
          difficulty: 'High',
        },
        {
          domain: 'hubspot.com/blog',
          da: 89,
          reason: 'Marketing resource center with active guest posting program.',
          type: 'Guest Post',
          difficulty: 'High',
        },
        {
          domain: 'moz.com/blog',
          da: 91,
          reason: 'SEO industry leader with contributor guidelines for experts.',
          type: 'Guest Post',
          difficulty: 'Medium',
        },
      ],
    },
    {
      title: 'Broken Link Building',
      icon: 'link_off',
      cards: [
        {
          domain: 'example.com/resource',
          da: 45,
          reason: 'Has broken links to resources similar to your content.',
          type: 'Broken Link',
          difficulty: 'Low',
        },
        {
          domain: 'blog.com/old-post',
          da: 52,
          reason: 'References outdated tools with broken outbound links.',
          type: 'Broken Link',
          difficulty: 'Low',
        },
      ],
    },
    {
      title: 'Resource Pages',
      icon: 'folder',
      cards: [
        {
          domain: 'marketing.edu/resources',
          da: 58,
          reason: 'Curated list of marketing tools and resources.',
          type: 'Resource Page',
          difficulty: 'Medium',
        },
        {
          domain: 'seo.tools/directory',
          da: 48,
          reason: 'SEO tools directory with link submissions open.',
          type: 'Resource Page',
          difficulty: 'Low',
        },
      ],
    },
  ];
}
