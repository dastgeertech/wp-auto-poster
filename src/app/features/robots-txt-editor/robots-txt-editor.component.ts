import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-robots-txt-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="robots-editor">
      <div class="page-header">
        <h1><mat-icon>settings_ethernet</mat-icon> Robots.txt Editor</h1>
        <p>Manage your site's robots.txt file to control search engine crawling</p>
      </div>

      <div class="editor-card">
        <div class="editor-toolbar">
          <span class="file-path">robots.txt</span>
          <div class="toolbar-actions">
            <button mat-stroked-button (click)="validateRobots()">
              <mat-icon>check_circle</mat-icon> Validate
            </button>
            <button mat-stroked-button (click)="resetToDefault()">
              <mat-icon>refresh</mat-icon> Reset Default
            </button>
            <button mat-flat-button class="save-btn" (click)="saveRobots()">
              <mat-icon>save</mat-icon> Save
            </button>
          </div>
        </div>

        <div class="editor-area">
          <textarea
            [(ngModel)]="robotsContent"
            (input)="onContentChange()"
            placeholder="Enter robots.txt content..."
            spellcheck="false"
          ></textarea>
        </div>

        @if (validationErrors().length > 0) {
          <div class="validation-panel">
            <h3><mat-icon>warning</mat-icon> Validation Issues</h3>
            <ul>
              @for (error of validationErrors(); track error) {
                <li class="error">{{ error }}</li>
              }
            </ul>
          </div>
        }

        @if (suggestions().length > 0) {
          <div class="suggestions-panel">
            <h3><mat-icon>lightbulb</mat-icon> Suggestions</h3>
            <ul>
              @for (s of suggestions(); track s) {
                <li class="suggestion">{{ s }}</li>
              }
            </ul>
          </div>
        }
      </div>

      <div class="templates-section">
        <h2><mat-icon>library_add</mat-icon> Quick Templates</h2>
        <div class="template-grid">
          @for (template of templates; track template.name) {
            <div class="template-card" (click)="applyTemplate(template.content)">
              <mat-icon>{{ template.icon }}</mat-icon>
              <span>{{ template.name }}</span>
            </div>
          }
        </div>
      </div>

      <div class="rules-guide">
        <h2><mat-icon>help</mat-icon> Common Rules Guide</h2>
        <div class="rule-list">
          <div class="rule-item">
            <code>User-agent: *</code>
            <span>Applies to all crawlers</span>
          </div>
          <div class="rule-item">
            <code>Disallow: /wp-admin/</code>
            <span>Blocks admin directory</span>
          </div>
          <div class="rule-item">
            <code>Allow: /wp-admin/admin-ajax.php</code>
            <span>Permits AJAX requests</span>
          </div>
          <div class="rule-item">
            <code>Sitemap: https://yoursite.com/sitemap.xml</code>
            <span>Points to your sitemap</span>
          </div>
          <div class="rule-item">
            <code>Crawl-delay: 1</code>
            <span>1 second delay between requests</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .robots-editor {
        padding: 32px;
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
      .editor-card {
        background: #1a1a2e;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 32px;
      }
      .editor-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #16213e;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        .file-path {
          font-family: monospace;
          color: #4caf50;
          font-size: 14px;
        }
        .toolbar-actions {
          display: flex;
          gap: 12px;
        }
      }
      .save-btn {
        background: #e94560 !important;
        color: white !important;
      }
      .editor-area {
        padding: 0;
        textarea {
          width: 100%;
          min-height: 400px;
          background: #0f0f1a;
          color: #e0e0e0;
          border: none;
          padding: 20px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          outline: none;
        }
      }
      .validation-panel,
      .suggestions-panel {
        padding: 20px;
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          font-size: 14px;
          color: #fff;
        }
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        li {
          padding: 8px 12px;
          margin-bottom: 8px;
          border-radius: 6px;
          font-size: 13px;
        }
      }
      .validation-panel {
        background: rgba(244, 67, 54, 0.1);
        border-top: 1px solid rgba(244, 67, 54, 0.3);
        .error {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
        }
      }
      .suggestions-panel {
        background: rgba(76, 175, 80, 0.1);
        border-top: 1px solid rgba(76, 175, 80, 0.3);
        .suggestion {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }
      }
      .templates-section,
      .rules-guide {
        margin-bottom: 32px;
        h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px;
          font-size: 18px;
          color: #fff;
          mat-icon {
            color: #e94560;
          }
        }
      }
      .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }
      .template-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #1a1a2e;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        &:hover {
          background: #16213e;
          mat-icon {
            color: #e94560;
          }
        }
        mat-icon {
          color: #a0a0b8;
        }
        span {
          font-size: 14px;
          color: #e0e0e0;
        }
      }
      .rule-list {
        display: grid;
        gap: 8px;
      }
      .rule-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        background: #1a1a2e;
        border-radius: 8px;
        code {
          background: #0f0f1a;
          padding: 4px 12px;
          border-radius: 4px;
          color: #4caf50;
          font-family: monospace;
          font-size: 13px;
        }
        span {
          color: #a0a0b8;
          font-size: 14px;
        }
      }
    `,
  ],
})
export class RobotsTxtEditorComponent {
  robotsContent = signal(`User-agent: *
Allow: /
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /wp-content/plugins/
Disallow: /wp-content/cache/
Disallow: /wp-json/
Disallow: /?s=
Disallow: /*/trackback/
Disallow: /*/feed/
Disallow: /*/comments/

Sitemap: https://yoursite.com/sitemap.xml
`);
  validationErrors = signal<string[]>([]);
  suggestions = signal<string[]>([]);

  templates = [
    {
      name: 'WordPress Default',
      icon: 'wordpress',
      content: `User-agent: *\nAllow: /\nDisallow: /wp-admin/\nDisallow: /wp-includes/\n\nSitemap: https://yoursite.com/sitemap.xml\n`,
    },
    { name: 'Block All Bots', icon: 'block', content: `User-agent: *\nDisallow: /\n` },
    {
      name: 'Allow Google Only',
      icon: 'search',
      content: `User-agent: Googlebot\nAllow: /\n\nUser-agent: *\nDisallow: /\n`,
    },
    {
      name: 'E-commerce',
      icon: 'shopping_cart',
      content: `User-agent: *\nAllow: /\nDisallow: /cart/\nDisallow: /checkout/\nDisallow: /my-account/\nDisallow: /wp-admin/\n\nSitemap: https://yoursite.com/sitemap.xml\n`,
    },
    {
      name: 'Blog Only',
      icon: 'article',
      content: `User-agent: *\nAllow: /\nDisallow: /wp-admin/\nDisallow: /wp-includes/\nDisallow: /trackback/\nDisallow: /comments/\n\nSitemap: https://yoursite.com/sitemap.xml\n`,
    },
    {
      name: 'Aggressive SEO',
      icon: 'trending_up',
      content: `User-agent: *\nAllow: /\nDisallow: /wp-admin/\nDisallow: /wp-includes/\nDisallow: /?s=\nDisallow: /page/\nCrawl-delay: 1\n\nSitemap: https://yoursite.com/sitemap.xml\n`,
    },
  ];

  constructor(private snackBar: MatSnackBar) {}

  onContentChange(): void {
    this.validationErrors.set([]);
    this.suggestions.set([]);
  }

  validateRobots(): void {
    const content = this.robotsContent();
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (!content.includes('User-agent:')) {
      errors.push('Missing User-agent directive');
    }
    if (!content.includes('Disallow:') && !content.includes('Allow:')) {
      errors.push('No Disallow or Allow rules defined');
    }
    if (content.includes('Disallow: /') && content.includes('Allow: /')) {
      errors.push('Conflicting Disallow and Allow rules for root path');
    }
    if (!content.toLowerCase().includes('sitemap:')) {
      suggestions.push('Consider adding a Sitemap directive');
    }
    if (!content.includes('Crawl-delay')) {
      suggestions.push('Consider adding Crawl-delay for better server performance');
    }
    if (content.includes('Disallow: /wp-includes/') && content.includes('Allow: /wp-includes/')) {
      errors.push('Conflicting rules for wp-includes directory');
    }

    this.validationErrors.set(errors);
    this.suggestions.set(suggestions);
  }

  resetToDefault(): void {
    this.robotsContent.set(`User-agent: *
Allow: /
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /wp-content/plugins/
Disallow: /wp-content/cache/
Disallow: /wp-json/
Disallow: /?s=
Disallow: /*/trackback/
Disallow: /*/feed/
Disallow: /*/comments/

Sitemap: https://yoursite.com/sitemap.xml
`);
    this.snackBar.open('Reset to default', 'Close', { duration: 2000 });
  }

  applyTemplate(content: string): void {
    this.robotsContent.set(content);
    this.snackBar.open('Template applied', 'Close', { duration: 2000 });
  }

  saveRobots(): void {
    localStorage.setItem('robots_txt', this.robotsContent());
    this.snackBar.open('Robots.txt saved!', 'Close', { duration: 2000 });
  }
}
