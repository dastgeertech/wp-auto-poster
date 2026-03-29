import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import { WebsiteSeoService, SeoCheckResult } from '../../core/services/website-seo.service';
import { WordPressService } from '../../core/services/wordpress.service';
import { SchemaMarkupService } from '../../core/services/schema-markup.service';
import { SitemapService } from '../../core/services/sitemap.service';

@Component({
  selector: 'app-seo-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    MatExpansionModule,
    MatDialogModule,
  ],
  template: `
    <div class="seo-dashboard">
      <div class="dashboard-header">
        <h1>Website SEO Center</h1>
        <p>Complete SEO optimization for dastgeertech.studio</p>
      </div>

      <mat-tab-group animationDuration="300ms">
        <mat-tab label="SEO Audit">
          <div class="tab-content">
            <div class="audit-grid">
              @for (result of seoResults(); track result.item) {
                <div class="audit-card" [class]="result.category">
                  <div class="audit-icon">
                    <mat-icon>
                      @switch (result.category) {
                        @case ('critical') {
                          error
                        }
                        @case ('warning') {
                          warning
                        }
                        @case ('success') {
                          check_circle
                        }
                      }
                    </mat-icon>
                  </div>
                  <div class="audit-content">
                    <h3>{{ result.item }}</h3>
                    <span class="status-badge" [class]="result.category">{{ result.status }}</span>
                    <p>{{ result.recommendation }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Generate Files">
          <div class="tab-content">
            <div class="files-grid">
              <div class="file-card">
                <div class="file-header">
                  <mat-icon>code</mat-icon>
                  <h3>robots.txt</h3>
                </div>
                <p>Instructions for search engine crawlers</p>
                <button mat-raised-button color="primary" (click)="downloadRobotsTxt()">
                  <mat-icon>download</mat-icon>
                  Download robots.txt
                </button>
              </div>

              <div class="file-card">
                <div class="file-header">
                  <mat-icon>map</mat-icon>
                  <h3>sitemap.xml</h3>
                </div>
                <p>Main sitemap for search engines</p>
                <button mat-raised-button color="primary" (click)="downloadSitemap()">
                  <mat-icon>download</mat-icon>
                  Download sitemap.xml
                </button>
              </div>

              <div class="file-card">
                <div class="file-header">
                  <mat-icon>newspaper</mat-icon>
                  <h3>news-sitemap.xml</h3>
                </div>
                <p>Google News specific sitemap</p>
                <button mat-raised-button color="primary" (click)="downloadNewsSitemap()">
                  <mat-icon>download</mat-icon>
                  Download News Sitemap
                </button>
              </div>

              <div class="file-card">
                <div class="file-header">
                  <mat-icon>tag</mat-icon>
                  <h3>Meta Tags</h3>
                </div>
                <p>Open Graph & Twitter Card tags</p>
                <button mat-raised-button color="primary" (click)="downloadMetaTags()">
                  <mat-icon>download</mat-icon>
                  Download Meta Tags
                </button>
              </div>

              <div class="file-card plugin-card">
                <div class="file-header">
                  <mat-icon>verified</mat-icon>
                  <h3>Dastgeer SEO Premium v2</h3>
                </div>
                <p>
                  Complete SEO Solution: Analysis, Schema, Sitemaps, Social, 404 Monitor, AI Tools
                </p>
                <button mat-raised-button color="accent" (click)="downloadWordPressPlugin()">
                  <mat-icon>download</mat-icon>
                  Download Premium Plugin
                </button>
              </div>
            </div>

            <div class="instructions-section">
              <h3>How to Use These Files</h3>

              <mat-accordion>
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>upload_file</mat-icon>
                      Upload robots.txt
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  <ol>
                    <li>Download robots.txt file</li>
                    <li>Login to your WordPress admin panel</li>
                    <li>Go to Settings → Reading or use an SEO plugin</li>
                    <li>Upload or paste the content</li>
                    <li>Verify at: {{ siteUrl }}/robots.txt</li>
                  </ol>
                </mat-expansion-panel>

                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>manage_search</mat-icon>
                      Submit sitemaps to Google
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  <ol>
                    <li>
                      Go to
                      <a href="https://search.google.com/search-console" target="_blank"
                        >Google Search Console</a
                      >
                    </li>
                    <li>Select your website</li>
                    <li>Go to Sitemaps section</li>
                    <li>Submit: {{ siteUrl }}/sitemap.xml</li>
                    <li>Submit: {{ siteUrl }}/news-sitemap.xml</li>
                    <li>Wait 1-2 days for indexing</li>
                  </ol>
                </mat-expansion-panel>

                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>code</mat-icon>
                      Add Meta Tags to WordPress
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  <ol>
                    <li>Download the meta tags file</li>
                    <li>Install "WPCode" or "Insert Headers and Footers" plugin</li>
                    <li>Go to Appearance → Theme File Editor</li>
                    <li>Or use your theme's header.php</li>
                    <li>Paste the meta tags in the &lt;head&gt; section</li>
                  </ol>
                </mat-expansion-panel>
              </mat-accordion>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Google News Setup">
          <div class="tab-content">
            <div class="news-setup">
              <div class="setup-header">
                <h2>Google News Indexing Setup</h2>
                <p>Get your tech news site indexed in Google News</p>
              </div>

              <div class="setup-steps">
                <div class="step-card completed">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>Schema Markup</h4>
                    <p>NewsArticle schema is automatically added to all posts</p>
                    <span class="step-status success">Active</span>
                  </div>
                </div>

                <div class="step-card completed">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>News Sitemap</h4>
                    <p>Generate and submit news-sitemap.xml</p>
                    <button mat-stroked-button (click)="downloadNewsSitemap()">
                      <mat-icon>download</mat-icon>
                      Generate Sitemap
                    </button>
                  </div>
                </div>

                <div class="step-card">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>Google Search Console</h4>
                    <p>Verify and submit sitemap in Search Console</p>
                    <a
                      mat-stroked-button
                      href="https://search.google.com/search-console"
                      target="_blank"
                    >
                      <mat-icon>open_in_new</mat-icon>
                      Open Search Console
                    </a>
                  </div>
                </div>

                <div class="step-card">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h4>Google News Publisher Center</h4>
                    <p>Register in Google News Publisher Center</p>
                    <a mat-stroked-button href="https://publishercenter.google.com" target="_blank">
                      <mat-icon>open_in_new</mat-icon>
                      Open Publisher Center
                    </a>
                  </div>
                </div>
              </div>

              <div class="requirements-section">
                <h3>Google News Requirements Checklist</h3>
                <div class="requirements-list">
                  @for (req of googleNewsRequirements; track req) {
                    <div class="requirement-item">
                      <mat-icon>check_circle</mat-icon>
                      <span>{{ req }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Recommended Plugins">
          <div class="tab-content">
            <div class="plugins-grid">
              @for (plugin of recommendedPlugins; track plugin.name) {
                <div class="plugin-card">
                  <div class="plugin-icon">
                    <mat-icon>extension</mat-icon>
                  </div>
                  <div class="plugin-content">
                    <h3>{{ plugin.name }}</h3>
                    <p>{{ plugin.purpose }}</p>
                    <a [href]="plugin.url" target="_blank" mat-stroked-button>
                      <mat-icon>open_in_new</mat-icon>
                      View Plugin
                    </a>
                  </div>
                </div>
              }
            </div>

            <div class="plugin-tips">
              <h3>Recommended Plugin Stack for Tech News</h3>
              <ul>
                <li><strong>SEO:</strong> Rank Math or Yoast SEO (with schema markup)</li>
                <li><strong>Speed:</strong> WP Fastest Cache + Imagify/Smush</li>
                <li><strong>Security:</strong> Wordfence Security</li>
                <li><strong>Social:</strong> Shared Counts or Social Warfare</li>
                <li><strong>Analytics:</strong> GA Google Analytics plugin</li>
              </ul>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Settings">
          <div class="tab-content">
            <div class="settings-form">
              <h3>Website Information</h3>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Site URL</mat-label>
                <input
                  matInput
                  [(ngModel)]="websiteSettings.siteUrl"
                  placeholder="https://yoursite.com"
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Site Name</mat-label>
                <input
                  matInput
                  [(ngModel)]="websiteSettings.siteName"
                  placeholder="Your Tech Site"
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tagline</mat-label>
                <input matInput [(ngModel)]="websiteSettings.tagline" placeholder="Your tagline" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Site Description (for SEO)</mat-label>
                <textarea matInput [(ngModel)]="websiteSettings.description" rows="3"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Author Name</mat-label>
                <input matInput [(ngModel)]="websiteSettings.author" placeholder="Author name" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Publisher Name</mat-label>
                <input
                  matInput
                  [(ngModel)]="websiteSettings.publisher"
                  placeholder="Publisher name"
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Logo URL</mat-label>
                <input
                  matInput
                  [(ngModel)]="websiteSettings.logoUrl"
                  placeholder="https://yoursite.com/logo.png"
                />
              </mat-form-field>

              <h3>Google Integration</h3>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>GA4 Measurement ID</mat-label>
                <input
                  matInput
                  [(ngModel)]="websiteSettings.analyticsId"
                  placeholder="G-XXXXXXXXXX"
                />
                <mat-hint>Get from Google Analytics → Admin → Data Streams</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Google News Publication Name</mat-label>
                <input
                  matInput
                  [(ngModel)]="websiteSettings.newsPublicationName"
                  placeholder="Your Publication Name"
                />
              </mat-form-field>

              <h3>Social Media</h3>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Twitter/X Handle</mat-label>
                <input
                  matInput
                  [(ngModel)]="websiteSettings.social.twitter"
                  placeholder="@yourhandle"
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Facebook Page</mat-label>
                <input
                  matInput
                  [(ngModel)]="websiteSettings.social.facebook"
                  placeholder="yourpage"
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>YouTube Channel</mat-label>
                <input
                  matInput
                  [(ngModel)]="websiteSettings.social.youtube"
                  placeholder="@yourchannel"
                />
              </mat-form-field>

              <div class="save-section">
                <button mat-raised-button color="primary" (click)="saveWebsiteSettings()">
                  <mat-icon>save</mat-icon>
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Fix Sitemap">
          <div class="tab-content">
            <div class="fix-section">
              <div class="fix-header">
                <h2>🚀 One-Click Sitemap Fix</h2>
                <p>
                  Download and install our custom plugin to enable news sitemap, robots.txt, and
                  schema markup
                </p>
              </div>

              <div class="plugin-install-card">
                <div class="plugin-icon">
                  <mat-icon>code</mat-icon>
                </div>
                <div class="plugin-info">
                  <h3>Dastgeer Tech Sitemap Plugin</h3>
                  <p>This plugin adds:</p>
                  <ul>
                    <li>✅ /news-sitemap.xml - Google News sitemap</li>
                    <li>✅ /main-sitemap.xml - Main sitemap</li>
                    <li>✅ /robots.txt - Search engine instructions</li>
                    <li>✅ NewsArticle schema markup</li>
                    <li>✅ Open Graph meta tags</li>
                  </ul>
                </div>
                <button mat-raised-button color="primary" (click)="downloadWordPressPlugin()">
                  <mat-icon>download</mat-icon>
                  Download Plugin
                </button>
              </div>

              <div class="install-steps">
                <h3>How to Install:</h3>
                <ol>
                  <li><strong>Download</strong> the plugin file above</li>
                  <li>
                    Go to your WordPress admin → <strong>Plugins</strong> → <strong>Add New</strong>
                  </li>
                  <li>Click <strong>Upload Plugin</strong> at the top</li>
                  <li><strong>Choose the file</strong> you downloaded</li>
                  <li>Click <strong>Install Now</strong></li>
                  <li>Click <strong>Activate</strong></li>
                </ol>
              </div>

              <div class="verify-section">
                <h3>After Installation - Test These URLs:</h3>
                <div class="verify-links">
                  <a
                    mat-raised-button
                    href="https://dastgeertech.studio/news-sitemap.xml"
                    target="_blank"
                  >
                    <mat-icon>open_in_new</mat-icon>
                    news-sitemap.xml
                  </a>
                  <a
                    mat-raised-button
                    href="https://dastgeertech.studio/main-sitemap.xml"
                    target="_blank"
                  >
                    <mat-icon>open_in_new</mat-icon>
                    main-sitemap.xml
                  </a>
                  <a
                    mat-raised-button
                    href="https://dastgeertech.studio/robots.txt"
                    target="_blank"
                  >
                    <mat-icon>open_in_new</mat-icon>
                    robots.txt
                  </a>
                </div>
              </div>

              <div class="alternative-methods">
                <h3>Alternative: Manual Code (Advanced)</h3>
                <mat-accordion>
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title> Add to functions.php </mat-panel-title>
                    </mat-expansion-panel-header>
                    <div class="code-block">
                      <pre>{{ wordpressSitemapCode }}</pre>
                    </div>
                    <button mat-stroked-button (click)="copyCode()">
                      <mat-icon>content_copy</mat-icon>
                      Copy Code
                    </button>
                  </mat-expansion-panel>
                </mat-accordion>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .seo-dashboard {
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .dashboard-header {
        margin-bottom: 24px;

        h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        p {
          color: #a0a0b8;
          margin: 8px 0 0;
        }
      }

      .tab-content {
        padding: 24px 0;
      }

      .audit-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }

      .audit-card {
        display: flex;
        gap: 16px;
        padding: 20px;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        border-left: 4px solid;
        transition: transform 0.2s ease;

        &:hover {
          transform: translateY(-2px);
        }

        &.success {
          border-left-color: #00d9a5;
          .audit-icon mat-icon {
            color: #00d9a5;
          }
        }

        &.warning {
          border-left-color: #ffc107;
          .audit-icon mat-icon {
            color: #ffc107;
          }
        }

        &.critical {
          border-left-color: #ff6b6b;
          .audit-icon mat-icon {
            color: #ff6b6b;
          }
        }

        .audit-icon {
          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
          }
        }

        .audit-content {
          flex: 1;

          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            margin: 0 0 8px;
          }

          p {
            font-size: 13px;
            color: #a0a0b8;
            margin: 8px 0 0;
            line-height: 1.5;
          }
        }
      }

      .status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;

        &.success {
          background: rgba(0, 217, 165, 0.15);
          color: #00d9a5;
        }

        &.warning {
          background: rgba(255, 193, 7, 0.15);
          color: #ffc107;
        }

        &.critical {
          background: rgba(255, 107, 107, 0.15);
          color: #ff6b6b;
        }
      }

      .files-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }

      .file-card {
        padding: 24px;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        text-align: center;

        .file-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 12px;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: #e94560;
          }

          h3 {
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
            margin: 0;
          }
        }

        p {
          color: #a0a0b8;
          font-size: 13px;
          margin: 0 0 16px;
        }
      }

      .plugin-card {
        border: 2px solid #00d9ff;
        background: linear-gradient(135deg, #1a2a3a 0%, #1a1a2e 100%);

        .file-header mat-icon {
          color: #00d9ff;
        }
      }

      .instructions-section {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        padding: 24px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
        }

        ol {
          margin: 0;
          padding-left: 20px;
          color: #a0a0b8;

          li {
            margin-bottom: 8px;
            line-height: 1.6;
          }

          a {
            color: #e94560;
          }
        }
      }

      .news-setup {
        .setup-header {
          text-align: center;
          margin-bottom: 32px;

          h2 {
            font-size: 24px;
            color: #ffffff;
            margin: 0 0 8px;
          }

          p {
            color: #a0a0b8;
            margin: 0;
          }
        }
      }

      .setup-steps {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }

      .step-card {
        display: flex;
        gap: 16px;
        padding: 20px;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;

        .step-number {
          width: 40px;
          height: 40px;
          background: rgba(233, 69, 96, 0.2);
          color: #e94560;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;

          h4 {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            margin: 0 0 8px;
          }

          p {
            font-size: 13px;
            color: #a0a0b8;
            margin: 0 0 12px;
          }

          a {
            color: #e94560;
          }
        }

        &.completed .step-number {
          background: rgba(0, 217, 165, 0.2);
          color: #00d9a5;
        }

        .step-status {
          &.success {
            color: #00d9a5;
            font-size: 12px;
            font-weight: 600;
          }
        }
      }

      .requirements-section {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        padding: 24px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
        }
      }

      .requirements-list {
        display: grid;
        gap: 12px;
      }

      .requirement-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(0, 217, 165, 0.1);
        border-radius: 8px;

        mat-icon {
          color: #00d9a5;
        }

        span {
          color: #ffffff;
          font-size: 14px;
        }
      }

      .plugins-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .plugin-card {
        display: flex;
        gap: 16px;
        padding: 20px;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;

        .plugin-icon {
          width: 48px;
          height: 48px;
          background: rgba(108, 92, 231, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          mat-icon {
            color: #a29bfe;
          }
        }

        .plugin-content {
          flex: 1;

          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            margin: 0 0 8px;
          }

          p {
            font-size: 13px;
            color: #a0a0b8;
            margin: 0 0 12px;
          }

          a {
            color: #e94560;
          }
        }
      }

      .plugin-tips {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        padding: 24px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
        }

        ul {
          margin: 0;
          padding-left: 20px;
          color: #a0a0b8;

          li {
            margin-bottom: 8px;
            line-height: 1.6;

            strong {
              color: #ffffff;
            }
          }
        }
      }

      .settings-form {
        max-width: 600px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 24px 0 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .full-width {
          width: 100%;
        }

        mat-hint {
          font-size: 12px;
          color: #a0a0b8;
        }
      }

      .save-section {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);

        button {
          background: linear-gradient(135deg, #00d9a5 0%, #00b894 100%);
        }
      }

      mat-icon {
        vertical-align: middle;
      }

      .fix-section {
        .fix-header {
          text-align: center;
          margin-bottom: 32px;
          padding: 24px;
          background: linear-gradient(
            135deg,
            rgba(233, 69, 96, 0.1) 0%,
            rgba(233, 69, 96, 0.05) 100%
          );
          border-radius: 12px;
          border: 1px solid rgba(233, 69, 96, 0.2);

          h2 {
            font-size: 24px;
            color: #ffffff;
            margin: 0 0 8px;
          }

          p {
            color: #a0a0b8;
            margin: 0;
          }
        }
      }

      .fix-method {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 20px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 12px;
        }

        p {
          color: #a0a0b8;
          margin: 0 0 16px;
          line-height: 1.6;
        }

        ol,
        ul {
          margin: 0 0 16px;
          padding-left: 24px;
          color: #a0a0b8;

          li {
            margin-bottom: 8px;
            line-height: 1.6;
          }

          code {
            background: rgba(0, 217, 165, 0.1);
            color: #00d9a5;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 13px;
          }

          strong {
            color: #ffffff;
          }
        }
      }

      .code-block {
        background: #0d0d15;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        overflow-x: auto;

        pre {
          margin: 0;
          color: #a0a0b8;
          font-size: 12px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-all;
        }
      }

      .fix-status {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        padding: 24px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
        }
      }

      .verify-links {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;

        a {
          color: #e94560;
        }
      }

      .plugin-install-card {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 24px;
        background: linear-gradient(
          135deg,
          rgba(0, 217, 165, 0.1) 0%,
          rgba(0, 184, 148, 0.05) 100%
        );
        border: 2px solid rgba(0, 217, 165, 0.3);
        border-radius: 16px;
        margin-bottom: 24px;

        .plugin-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #00d9a5 0%, #00b894 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: white;
          }
        }

        .plugin-info {
          flex: 1;

          h3 {
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
            margin: 0 0 8px;
          }

          p {
            color: #a0a0b8;
            margin: 0 0 8px;
            font-size: 14px;
          }

          ul {
            margin: 0;
            padding-left: 16px;
            color: #00d9a5;
            font-size: 13px;

            li {
              margin-bottom: 4px;
            }
          }
        }
      }

      .install-steps {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
        }

        ol {
          margin: 0;
          padding-left: 24px;
          color: #a0a0b8;

          li {
            margin-bottom: 12px;
            line-height: 1.6;
            font-size: 14px;

            strong {
              color: #ffffff;
            }
          }
        }
      }

      .verify-section {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
        }

        .verify-links {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;

          a {
            background: rgba(0, 217, 165, 0.1);
            color: #00d9a5;
            border: 1px solid rgba(0, 217, 165, 0.3);
          }
        }
      }

      .alternative-methods {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        padding: 24px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
        }

        .code-block {
          margin-bottom: 12px;
        }
      }
    `,
  ],
})
export class SeoDashboardComponent implements OnInit {
  seoResults = signal<SeoCheckResult[]>([]);
  siteUrl = 'https://dastgeertech.studio';

  websiteSettings = {
    siteUrl: 'https://dastgeertech.studio',
    siteName: 'Dastgeer Tech',
    tagline: 'Your Daily Source for Technology News',
    description:
      'Dastgeer Tech brings you the latest technology news, in-depth reviews, and expert insights.',
    author: 'Dastgeer Tech Editorial Team',
    publisher: 'Dastgeer Tech',
    logoUrl: '',
    faviconUrl: '',
    analyticsId: '',
    newsPublicationName: 'Dastgeer Tech',
    social: {
      twitter: '@dastgeertech',
      facebook: 'dastgeertech',
      instagram: 'dastgeertech',
      linkedin: 'dastgeertech',
      youtube: '@dastgeertech',
    },
  };

  recommendedPlugins = [
    {
      name: 'Rank Math SEO',
      purpose:
        'Advanced SEO with built-in schema markup, XML sitemaps, and AI-powered optimization',
      url: 'https://wordpress.org/plugins/seo-by-rank-math/',
    },
    {
      name: 'WP Fastest Cache',
      purpose: 'Fast page loading with caching and minification',
      url: 'https://wordpress.org/plugins/wp-fastest-cache/',
    },
    {
      name: 'Imagify',
      purpose: 'Automatic image compression and optimization',
      url: 'https://wordpress.org/plugins/imagify/',
    },
    {
      name: 'Wordfence Security',
      purpose: 'Firewall and malware scanning protection',
      url: 'https://wordpress.org/plugins/wordfence/',
    },
    {
      name: 'Smush',
      purpose: 'Lazy loading and image optimization',
      url: 'https://wordpress.org/plugins/wp-smushit/',
    },
    {
      name: 'GA Google Analytics',
      purpose: 'Easy Google Analytics 4 integration',
      url: 'https://wordpress.org/plugins/ga-google-analytics/',
    },
  ];

  googleNewsRequirements = [
    'Publish original news content daily',
    'Use publication dates in article headers',
    'Include author names in all articles',
    'Add proper NewsArticle schema markup',
    'Submit news sitemap to Google Search Console',
    'Ensure site is publicly accessible',
    'Follow Google News content policies',
    'Use proper article categorization',
    'Maintain consistent publishing schedule',
    'Build quality backlinks from news sources',
  ];

  constructor(
    private seoService: WebsiteSeoService,
    private wordpressService: WordPressService,
    private schemaService: SchemaMarkupService,
    private sitemapService: SitemapService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.seoResults.set(this.seoService.performSeoAudit());
    this.loadSettings();
    this.siteUrl = this.seoService.getSiteUrl();
  }

  private loadSettings(): void {
    const saved = this.seoService.getSettings();
    if (saved.website) {
      this.websiteSettings = { ...this.websiteSettings, ...saved.website };
    }
    if (saved.google) {
      this.websiteSettings.analyticsId = saved.google.analyticsId || '';
      this.websiteSettings.newsPublicationName =
        saved.google.newsPublicationName || 'Dastgeer Tech';
    }
  }

  saveWebsiteSettings(): void {
    this.seoService.saveSettings({
      website: this.websiteSettings,
      google: {
        searchConsoleVerified: false,
        analyticsId: this.websiteSettings.analyticsId,
        adsenseId: '',
        newsPublicationName: this.websiteSettings.newsPublicationName,
      },
    });

    this.schemaService.setSiteInfo({
      name: this.websiteSettings.siteName,
      url: this.websiteSettings.siteUrl,
      logo: this.websiteSettings.logoUrl,
      publisher: this.websiteSettings.publisher,
      author: this.websiteSettings.author,
    });

    this.snackBar.open('Website settings saved!', 'Close', { duration: 3000 });
  }

  downloadRobotsTxt(): void {
    const content = this.seoService.generateRobotsTxt();
    this.seoService.downloadFile(content, 'robots.txt', 'text/plain');
    this.snackBar.open('robots.txt downloaded!', 'Close', { duration: 3000 });
  }

  downloadSitemap(): void {
    const posts = this.wordpressService.getPosts({ per_page: 100, status: 'publish' });
    posts.subscribe({
      next: (postList) => {
        const sitemapPosts = postList.map((p: any) => ({
          slug: p.slug || '',
          lastmod: p.modified ? new Date(p.modified) : undefined,
          priority: 0.7,
        }));
        const content = this.seoService.generateSitemapXml(sitemapPosts);
        this.seoService.downloadFile(content, 'sitemap.xml', 'application/xml');
        this.snackBar.open('sitemap.xml downloaded!', 'Close', { duration: 3000 });
      },
      error: () => {
        const content = this.seoService.generateSitemapXml([]);
        this.seoService.downloadFile(content, 'sitemap.xml', 'application/xml');
        this.snackBar.open('sitemap.xml downloaded!', 'Close', { duration: 3000 });
      },
    });
  }

  downloadNewsSitemap(): void {
    const posts = this.wordpressService.getPosts({ per_page: 1000, status: 'publish' });
    posts.subscribe({
      next: (postList) => {
        const newsPosts = postList.map((p: any) => ({
          slug: p.slug || '',
          title: typeof p.title === 'string' ? p.title : p.title.rendered,
          publishDate: p.date ? new Date(p.date) : new Date(),
        }));
        const content = this.seoService.generateNewsSitemap(newsPosts);
        this.seoService.downloadFile(content, 'news-sitemap.xml', 'application/xml');
        this.snackBar.open('news-sitemap.xml downloaded!', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to fetch posts', 'Close', { duration: 3000 });
      },
    });
  }

  downloadMetaTags(): void {
    const content = this.seoService.generateOpenGraphTags();
    this.seoService.downloadFile(content, 'meta-tags.txt', 'text/plain');
    this.snackBar.open('Meta tags downloaded!', 'Close', { duration: 3000 });
  }

  wordpressSitemapCode = `// ADD TO functions.php - Enables proper sitemap URLs

// Custom News Sitemap
function dastgeer_news_sitemap() {
    $posts = get_posts(array(
        'numberposts' => 1000,
        'post_status' => 'publish',
        'post_type' => 'post'
    ));
    
    header('Content-Type: application/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">';
    
    foreach($posts as $post) {
        setup_postdata($post);
        $pubDate = get_the_date('Y-m-d');
        echo '<url>';
        echo '<loc>'.get_permalink().'</loc>';
        echo '<news:news>';
        echo '<news:publication>';
        echo '<news:name>Dastgeer Tech</news:name>';
        echo '<news:language>en</news:language>';
        echo '</news:publication>';
        echo '<news:publication_date>'.$pubDate.'</news:publication_date>';
        echo '<news:title>'.htmlspecialchars(get_the_title()).'</news:title>';
        echo '</news:news>';
        echo '</url>';
    }
    
    echo '</urlset>';
    wp_reset_postdata();
    die();
}
add_action('init', function() {
    add_rewrite_rule('news-sitemap\\.xml$', 'index.php?news_sitemap=1', 'top');
});

add_filter('query_vars', function($vars) {
    $vars[] = 'news_sitemap';
    return $vars;
});

add_action('template_redirect', function() {
    if(get_query_var('news_sitemap')) {
        dastgeer_news_sitemap();
    }
});

// Custom Robots.txt
add_action('init', function() {
    add_rewrite_rule('robots\\.txt$', 'index.php?robots=1', 'top');
});

add_filter('query_vars', function($vars) {
    $vars[] = 'robots';
    return $vars;
});

add_action('template_redirect', function() {
    if(get_query_var('robots')) {
        header('Content-Type: text/plain; charset=utf-8');
        echo '# robots.txt
User-agent: *
Allow: /
Disallow: /wp-admin/
Sitemap: https://dastgeertech.studio/news-sitemap.xml';
        die();
    }
});

// Flush rules on activation
register_activation_hook(__FILE__, function() {
    flush_rewrite_rules();
});`;

  copyCode(): void {
    navigator.clipboard.writeText(this.wordpressSitemapCode).then(() => {
      this.snackBar.open('Code copied! Paste it in your theme functions.php', 'Close', {
        duration: 5000,
      });
    });
  }

  downloadWordPressPlugin(): void {
    const link = document.createElement('a');
    link.href = '/assets/wordpress-plugins/dastgeer-seo-premium.zip';
    link.download = 'dastgeer-seo-premium.zip';
    link.click();

    this.snackBar.open(
      'Plugin downloaded! Upload to WordPress: Plugins → Add New → Upload',
      'Close',
      { duration: 8000 },
    );
  }
}
