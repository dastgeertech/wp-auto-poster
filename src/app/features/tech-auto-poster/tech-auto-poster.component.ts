import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { interval, Subscription } from 'rxjs';
import { TechTopicService } from '../../core/services/tech-topic.service';
import { ContentGeneratorService } from '../../core/services/content-generator.service';
import { SeoAnalyzerService } from '../../core/services/seo-analyzer.service';
import { SchemaMarkupService } from '../../core/services/schema-markup.service';
import { ImageService } from '../../core/services/image.service';
import { WordPressService } from '../../core/services/wordpress.service';
import { WordPressPost } from '../../core/models';
import {
  TechTopic,
  TechAutoPostConfig,
  TechAutoPostLog,
  DEFAULT_TECH_AUTO_POST_CONFIG,
} from '../../core/models';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-tech-auto-poster',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="tech-auto-poster">
      <div class="poster-header">
        <div class="header-content">
          <h1>Tech Auto Poster</h1>
          <p>Automatically generate and post trending tech articles daily</p>
        </div>
        <div class="header-actions">
          <button
            mat-raised-button
            color="primary"
            (click)="generateAndPostNow()"
            [disabled]="isProcessing() || !canPost()"
          >
            <mat-icon>bolt</mat-icon>
            Post Now
          </button>
        </div>
      </div>

      <div class="poster-grid">
        <div class="config-section">
          <div class="section-header">
            <h2>Configuration</h2>
            <mat-slide-toggle [(ngModel)]="config.enabled" (change)="saveConfig()">
              {{ config.enabled ? 'Enabled' : 'Disabled' }}
            </mat-slide-toggle>
          </div>

          <div class="config-grid">
            <mat-form-field appearance="outline">
              <mat-label>Daily Post Limit</mat-label>
              <mat-select [(ngModel)]="config.dailyLimit" (selectionChange)="saveConfig()">
                <mat-option [value]="1">1 post per day</mat-option>
                <mat-option [value]="2">2 posts per day</mat-option>
                <mat-option [value]="3">3 posts per day</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Post Time</mat-label>
              <input matInput type="time" [(ngModel)]="config.postTime" (change)="saveConfig()" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Timezone</mat-label>
              <mat-select [(ngModel)]="config.timezone" (selectionChange)="saveConfig()">
                <mat-option value="UTC">UTC</mat-option>
                <mat-option value="America/New_York">Eastern Time</mat-option>
                <mat-option value="America/Los_Angeles">Pacific Time</mat-option>
                <mat-option value="Europe/London">London</mat-option>
                <mat-option value="Asia/Dubai">Dubai</mat-option>
                <mat-option value="Asia/Kolkata">India</mat-option>
                <mat-option value="Asia/Singapore">Singapore</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>SEO Score Target</mat-label>
              <mat-select [(ngModel)]="config.seoScoreTarget" (selectionChange)="saveConfig()">
                <mat-option [value]="70">70% (Minimum)</mat-option>
                <mat-option [value]="80">80% (Good)</mat-option>
                <mat-option [value]="90">90% (Excellent)</mat-option>
                <mat-option [value]="100">100% (Perfect)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="toggle-options">
            <mat-slide-toggle [(ngModel)]="config.autoAddImages" (change)="saveConfig()">
              Auto-add featured images
            </mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="config.includeSchemaMarkup" (change)="saveConfig()">
              Include Google News schema markup
            </mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="config.submitToNewsSitemap" (change)="saveConfig()">
              Auto-submit to News Sitemap
            </mat-slide-toggle>
          </div>
        </div>

        <div class="stats-section">
          <div class="stat-card">
            <mat-icon>today</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ todayCount() }}</span>
              <span class="stat-label">Posts Today</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>schedule</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ nextPostTime() }}</span>
              <span class="stat-label">Next Post</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>trending_up</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ totalPosts() }}</span>
              <span class="stat-label">Total Posts</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>analytics</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ avgSeoScore() }}%</span>
              <span class="stat-label">Avg SEO</span>
            </div>
          </div>
        </div>

        <div class="topics-section">
          <div class="section-header">
            <h2>Trending Topics</h2>
            <div class="topic-actions">
              <span class="topic-count">{{ availableTopics().length }} available</span>
              <button
                mat-stroked-button
                (click)="forceRefreshTopics()"
                matTooltip="Get new trending topics"
              >
                <mat-icon>refresh</mat-icon>
                Refresh Topics
              </button>
            </div>
          </div>

          <div class="topics-grid">
            @for (topic of availableTopics(); track topic.id) {
              <div
                class="topic-card"
                [class.selected]="selectedTopic()?.id === topic.id"
                (click)="selectTopic(topic)"
              >
                <div class="topic-category">{{ topic.category }}</div>
                <div class="topic-keyword">{{ topic.keyword }}</div>
                <div class="topic-meta">
                  <span class="trend-score" [class.high]="topic.trendScore >= 90">
                    <mat-icon>trending_up</mat-icon>
                    {{ topic.trendScore }}
                  </span>
                  <span class="viral-badge" [class]="topic.viralPotential">
                    {{ topic.viralPotential }}
                  </span>
                </div>
              </div>
            }
          </div>
        </div>

        @if (selectedTopic()) {
          <div class="preview-section">
            <div class="section-header">
              <h2>Content Preview</h2>
              <button mat-icon-button (click)="clearPreview()" matTooltip="Close preview">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            @if (isGenerating()) {
              <div class="generating-state">
                <mat-spinner diameter="40"></mat-spinner>
                <span>Generating viral content...</span>
              </div>
            } @else if (generatedContent()) {
              <div class="content-preview">
                <div class="preview-meta">
                  <div class="preview-item">
                    <span class="label">Title:</span>
                    <span class="value">{{ generatedContent()?.title }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="label">Focus Keyword:</span>
                    <span class="value">{{ generatedContent()?.focusKeyword }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="label">SEO Score:</span>
                    <span
                      class="value score"
                      [class.good]="(seoScore() || 0) >= config.seoScoreTarget"
                    >
                      {{ seoScore() }}%
                    </span>
                  </div>
                  <div class="preview-item">
                    <span class="label">Word Count:</span>
                    <span class="value">{{ wordCount() }}</span>
                  </div>
                </div>

                <div class="preview-content" [innerHTML]="generatedContent()?.content"></div>

                <div class="preview-tags">
                  <span class="label">Suggested Tags:</span>
                  <mat-chip-listbox>
                    @for (tag of generatedContent()?.suggestedTags; track tag) {
                      <mat-chip>{{ tag }}</mat-chip>
                    }
                  </mat-chip-listbox>
                </div>

                <div class="preview-actions">
                  <button mat-stroked-button (click)="regenerateContent()">
                    <mat-icon>refresh</mat-icon>
                    Regenerate
                  </button>
                  <button mat-raised-button color="primary" (click)="publishNow()">
                    <mat-icon>publish</mat-icon>
                    Publish Now
                  </button>
                </div>
              </div>
            } @else {
              <div class="empty-preview">
                <mat-icon>article</mat-icon>
                <span>Select a topic and click "Generate Preview" to see content</span>
                <button mat-stroked-button (click)="generatePreview()">
                  <mat-icon>preview</mat-icon>
                  Generate Preview
                </button>
              </div>
            }
          </div>
        }

        <div class="logs-section">
          <div class="section-header">
            <h2>Post History</h2>
            <div class="log-actions">
              <span class="topics-counter"
                >{{ techTopicService.getPermanentlyUsedTopicsCount() }}/{{
                  techTopicService.getTotalTopicsCount()
                }}
                topics used</span
              >
              <button
                mat-stroked-button
                color="warn"
                (click)="resetTopics()"
                matTooltip="Reset all used topics to use them again"
              >
                Reset Topics
              </button>
              <button mat-stroked-button (click)="clearLogs()">Clear History</button>
            </div>
          </div>

          <div class="logs-list">
            @for (log of postLogs(); track log.id) {
              <div class="log-card" [class]="log.status">
                <div class="log-status">
                  <mat-icon [class]="log.status">
                    @switch (log.status) {
                      @case ('completed') {
                        check_circle
                      }
                      @case ('failed') {
                        error
                      }
                      @case ('generating') {
                        auto_awesome
                      }
                      @case ('optimizing') {
                        tune
                      }
                      @case ('publishing') {
                        cloud_upload
                      }
                      @default {
                        schedule
                      }
                    }
                  </mat-icon>
                </div>
                <div class="log-content">
                  <div class="log-title">{{ log.title || log.topic }}</div>
                  <div class="log-meta">
                    <span class="log-time">{{ formatTime(log.createdAt) }}</span>
                    @if (log.seoScore) {
                      <span class="log-seo">SEO: {{ log.seoScore }}%</span>
                    }
                    @if (log.postUrl) {
                      <a [href]="log.postUrl" target="_blank">View Post</a>
                    }
                    @if (log.error) {
                      <span class="log-error">{{ log.error }}</span>
                    }
                  </div>
                </div>
                <div class="log-badge" [class]="log.status">
                  {{ log.status }}
                </div>
              </div>
            } @empty {
              <div class="empty-logs">
                <mat-icon>history</mat-icon>
                <span>No posts yet. Start posting to see history here.</span>
              </div>
            }
          </div>
        </div>

        <div class="google-news-section">
          <div class="section-header">
            <h2>Google News Setup</h2>
          </div>

          <div class="setup-steps">
            <div class="setup-step completed">
              <mat-icon>check_circle</mat-icon>
              <div class="step-content">
                <span class="step-title">Schema Markup Enabled</span>
                <span class="step-desc">NewsArticle structured data automatically added</span>
              </div>
            </div>
            <div class="setup-step completed">
              <mat-icon>check_circle</mat-icon>
              <div class="step-content">
                <span class="step-title">News Sitemap Ready</span>
                <span class="step-desc">Auto-generates news-specific sitemap</span>
              </div>
            </div>
            <div class="setup-step">
              <mat-icon>web</mat-icon>
              <div class="step-content">
                <span class="step-title">Verify in Google Search Console</span>
                <span class="step-desc">Submit your news sitemap at search.google.com</span>
              </div>
            </div>
            <div class="setup-step">
              <mat-icon>description</mat-icon>
              <div class="step-content">
                <span class="step-title">Google News Policies</span>
                <span class="step-desc">Ensure content meets Google News content guidelines</span>
              </div>
            </div>
          </div>

          <div class="news-tips">
            <h3>Tips for Google News Indexing</h3>
            <ul>
              <li>Post consistently - daily tech news performs best</li>
              <li>Use proper headlines - be clear and descriptive</li>
              <li>Add author names and publication dates</li>
              <li>Use original images with proper alt text</li>
              <li>Avoid clickbait - focus on quality journalism</li>
              <li>Build backlinks from reputable tech sites</li>
            </ul>
          </div>

          <button mat-stroked-button (click)="generateNewsSitemap()">
            <mat-icon>code</mat-icon>
            Generate News Sitemap XML
          </button>
        </div>
      </div>

      @if (isProcessing()) {
        <div class="processing-overlay">
          <mat-spinner diameter="60"></mat-spinner>
          <span class="processing-status">{{ processingStatus() }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .tech-auto-poster {
        animation: fadeIn 0.3s ease;
        position: relative;
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

      .poster-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;

        h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        p {
          color: #a0a0b8;
          margin: 4px 0 0;
          font-size: 14px;
        }
      }

      .poster-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
      }

      .config-section,
      .stats-section,
      .topics-section,
      .preview-section,
      .logs-section,
      .google-news-section {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        border: 1px solid rgba(233, 69, 96, 0.1);
        padding: 20px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }
      }

      .topic-count {
        font-size: 12px;
        color: #a0a0b8;
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 10px;
        border-radius: 12px;
      }

      .topic-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .config-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 16px;

        mat-form-field {
          width: 100%;
        }
      }

      .toggle-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .stats-section {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          color: #e94560;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }

        .stat-label {
          font-size: 11px;
          color: #a0a0b8;
        }
      }

      .topics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
        max-height: 300px;
        overflow-y: auto;
      }

      .topic-card {
        padding: 14px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        &.selected {
          border-color: #e94560;
          background: rgba(233, 69, 96, 0.1);
        }

        .topic-category {
          font-size: 10px;
          color: #e94560;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .topic-keyword {
          font-size: 13px;
          color: #ffffff;
          font-weight: 500;
          margin-bottom: 10px;
          line-height: 1.4;
        }

        .topic-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .trend-score {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #ffc107;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }

          &.high {
            color: #00d9a5;
          }
        }

        .viral-badge {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 600;

          &.high {
            background: rgba(0, 217, 165, 0.15);
            color: #00d9a5;
          }

          &.medium {
            background: rgba(255, 193, 7, 0.15);
            color: #ffc107;
          }

          &.low {
            background: rgba(160, 160, 184, 0.15);
            color: #a0a0b8;
          }
        }
      }

      .generating-state,
      .empty-preview,
      .empty-logs {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        gap: 16px;
        color: #a0a0b8;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          opacity: 0.5;
        }
      }

      .content-preview {
        .preview-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .preview-item {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .label {
            font-size: 10px;
            color: #a0a0b8;
            text-transform: uppercase;
          }

          .value {
            font-size: 13px;
            color: #ffffff;

            &.score {
              color: #ffc107;
              &.good {
                color: #00d9a5;
              }
            }
          }
        }

        .preview-content {
          max-height: 400px;
          overflow-y: auto;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 13px;
          line-height: 1.6;
          color: #d0d0e0;

          :deep(h2) {
            color: #ffffff;
            font-size: 16px;
            margin: 16px 0 8px;
          }

          :deep(p) {
            margin: 0 0 12px;
          }

          :deep(ul) {
            margin: 0 0 12px;
            padding-left: 20px;
          }
        }

        .preview-tags {
          margin-bottom: 16px;

          .label {
            font-size: 12px;
            color: #a0a0b8;
            display: block;
            margin-bottom: 8px;
          }
        }

        .preview-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
      }

      .logs-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
      }

      .log-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .topics-counter {
        font-size: 12px;
        color: #a0a0b8;
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 10px;
        border-radius: 12px;
      }

      .log-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        border-left: 3px solid #a0a0b8;

        &.completed {
          border-left-color: #00d9a5;
        }
        &.failed {
          border-left-color: #ff6b6b;
        }
        &.generating,
        &.optimizing,
        &.publishing {
          border-left-color: #6c5ce7;
        }

        .log-status mat-icon {
          &.completed {
            color: #00d9a5;
          }
          &.failed {
            color: #ff6b6b;
          }
          &.generating,
          &.optimizing,
          &.publishing {
            color: #6c5ce7;
          }
          color: #a0a0b8;
        }

        .log-content {
          flex: 1;
          min-width: 0;
        }

        .log-title {
          font-size: 13px;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .log-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: #a0a0b8;
          margin-top: 4px;

          a {
            color: #e94560;
          }
          .log-error {
            color: #ff6b6b;
          }
        }

        .log-badge {
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 600;

          &.completed {
            background: rgba(0, 217, 165, 0.15);
            color: #00d9a5;
          }
          &.failed {
            background: rgba(255, 107, 107, 0.15);
            color: #ff6b6b;
          }
          &.generating,
          &.optimizing,
          &.publishing {
            background: rgba(108, 92, 231, 0.15);
            color: #a29bfe;
          }
          &.pending {
            background: rgba(160, 160, 184, 0.15);
            color: #a0a0b8;
          }
        }
      }

      .setup-steps {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }

      .setup-step {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;

        mat-icon {
          color: #a0a0b8;
        }

        &.completed mat-icon {
          color: #00d9a5;
        }

        .step-content {
          display: flex;
          flex-direction: column;
        }

        .step-title {
          font-size: 13px;
          color: #ffffff;
        }

        .step-desc {
          font-size: 11px;
          color: #a0a0b8;
        }
      }

      .news-tips {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;

        h3 {
          font-size: 14px;
          color: #ffffff;
          margin: 0 0 12px;
        }

        ul {
          margin: 0;
          padding-left: 20px;
          color: #a0a0b8;
          font-size: 12px;
          line-height: 1.8;
        }
      }

      .processing-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        z-index: 1000;

        .processing-status {
          color: #ffffff;
          font-size: 16px;
        }
      }

      @media (max-width: 768px) {
        .poster-grid {
          grid-template-columns: 1fr;
        }

        .config-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TechAutoPosterComponent implements OnInit, OnDestroy {
  private checkInterval: Subscription | null = null;

  config: TechAutoPostConfig = { ...DEFAULT_TECH_AUTO_POST_CONFIG };
  topics = signal<TechTopic[]>([]);
  postLogs = signal<TechAutoPostLog[]>([]);
  selectedTopic = signal<TechTopic | null>(null);
  generatedContent = signal<any>(null);
  isGenerating = signal(false);
  isProcessing = signal(false);
  processingStatus = signal('');
  seoScore = signal(0);
  wordCount = signal(0);

  availableTopics = computed(() => {
    const today = new Date().toDateString();
    const usedToday = this.postLogs()
      .filter(
        (log) => new Date(log.createdAt).toDateString() === today && log.status === 'completed',
      )
      .map((log) => log.topic);

    return this.topics().filter((t) => {
      // Filter out topics used today
      if (usedToday.includes(t.keyword)) return false;
      return true;
    });
  });

  todayCount = computed(() => {
    return this.postLogs().filter((log) => {
      const logDate = new Date(log.createdAt).toDateString();
      const today = new Date().toDateString();
      return logDate === today && log.status === 'completed';
    }).length;
  });

  totalPosts = computed(() => {
    return this.postLogs().filter((log) => log.status === 'completed').length;
  });

  avgSeoScore = computed(() => {
    const completed = this.postLogs().filter((log) => log.seoScore > 0);
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, log) => sum + log.seoScore, 0);
    return Math.round(total / completed.length);
  });

  nextPostTime = computed(() => {
    const [hours, minutes] = this.config.postTime.split(':');
    const now = new Date();
    const next = new Date();
    next.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  });

  canPost = computed(() => {
    return this.todayCount() < this.config.dailyLimit;
  });

  constructor(
    public techTopicService: TechTopicService,
    private contentGenerator: ContentGeneratorService,
    private seoAnalyzer: SeoAnalyzerService,
    private schemaService: SchemaMarkupService,
    private imageService: ImageService,
    private wordpressService: WordPressService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
    this.loadTopics();
    this.loadLogs();
    this.startAutoPoster();
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      this.checkInterval.unsubscribe();
    }
  }

  private loadConfig(): void {
    this.config = this.techTopicService.getConfig();
  }

  private loadTopics(): void {
    this.topics.set(this.techTopicService.getTopics());
  }

  private loadLogs(): void {
    this.postLogs.set(this.techTopicService.getLogs());
  }

  saveConfig(): void {
    this.techTopicService.saveConfig(this.config);
    this.snackBar.open('Settings saved', 'Close', { duration: 2000 });
  }

  selectTopic(topic: TechTopic): void {
    this.selectedTopic.set(topic);
    this.generatedContent.set(null);
  }

  clearPreview(): void {
    this.selectedTopic.set(null);
    this.generatedContent.set(null);
  }

  generatePreview(): void {
    const topic = this.selectedTopic();
    if (!topic) return;
    this.generateContent(topic.keyword);
  }

  regenerateContent(): void {
    const topic = this.selectedTopic();
    if (!topic) return;
    this.generateContent(topic.keyword);
  }

  private generateContent(keyword: string): void {
    this.isGenerating.set(true);
    this.generatedContent.set(null);

    this.contentGenerator.generateViralTechContent(keyword, 1500).subscribe({
      next: (content) => {
        const slug = keyword
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-');

        content.content = this.addImagePlaceholders(content.content, keyword);

        const analysis = this.seoAnalyzer.analyzeSeo(
          content.content,
          content.title,
          keyword,
          slug,
          content.metaDescription,
        );

        this.seoScore.set(analysis.score);
        this.wordCount.set(analysis.contentLength);

        if (this.config.includeSchemaMarkup) {
          const schemas = this.schemaService.generateArticleSchemas({
            title: content.title,
            content: content.content,
            publishDate: new Date(),
            slug: slug,
            category: 'Technology',
          });
          content.schemaMarkup = schemas;
        }

        this.generatedContent.set(content);
        this.isGenerating.set(false);
      },
      error: (err: any) => {
        this.isGenerating.set(false);
        this.snackBar.open('Failed to generate content: ' + err.message, 'Close', {
          duration: 5000,
        });
      },
    });
  }

  generateAndPostNow(): void {
    if (!this.canPost()) {
      this.snackBar.open('Daily post limit reached', 'Close', { duration: 3000 });
      return;
    }

    const topic = this.techTopicService.getNextTopic();

    if (!topic) {
      this.snackBar.open(
        `All topics exhausted! You have used all ${this.techTopicService.getTotalTopicsCount()} topics. Please add new topics or reset the topic list.`,
        'Close',
        { duration: 8000 },
      );
      return;
    }

    this.selectedTopic.set(topic);

    const logId = uuidv4();
    const log: TechAutoPostLog = {
      id: logId,
      topic: topic.keyword,
      title: '',
      status: 'generating',
      seoScore: 0,
      createdAt: new Date(),
    };
    this.techTopicService.addLog(log);
    this.loadLogs();

    this.executeAutoPost(logId, topic.keyword);
  }

  private executeAutoPost(logId: string, keyword: string): void {
    this.isProcessing.set(true);
    this.processingStatus.set('Generating viral content...');
    this.techTopicService.updateLog(logId, { status: 'generating' });

    this.contentGenerator.generateViralTechContent(keyword, 1500).subscribe({
      next: (content) => {
        this.processingStatus.set('Adding images with SEO optimization...');
        this.techTopicService.updateLog(logId, { status: 'optimizing', title: content.title });

        const slug = keyword
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-');

        content.content = this.addImagePlaceholders(content.content, keyword);

        const analysis = this.seoAnalyzer.analyzeSeo(
          content.content,
          content.title,
          keyword,
          slug,
          content.metaDescription,
        );

        this.processingStatus.set('Uploading featured image...');
        this.techTopicService.updateLog(logId, { status: 'optimizing', seoScore: analysis.score });

        this.addFeaturedImage(content, keyword)
          .then((mediaId) => {
            this.processingStatus.set('Publishing to WordPress...');
            this.techTopicService.updateLog(logId, { status: 'publishing' });

            let postContent = content.content;

            if (this.config.includeSchemaMarkup && content.schemaMarkup) {
              const schemaJsonLd = `<script type="application/ld+json">${content.schemaMarkup.newsArticle}</script>`;
              postContent = schemaJsonLd + postContent;
            }

            const post = {
              title: content.title,
              content: postContent,
              status: 'publish' as const,
              categories: this.config.categories.length > 0 ? this.config.categories : [1],
              tags: this.config.tags.length > 0 ? this.config.tags : [],
              featured_media: mediaId || undefined,
              meta: {
                _rank_math_focus_keyword: keyword,
                _rank_math_seo_score: analysis.score.toString(),
                _rank_math_description: content.metaDescription,
              },
              slug: slug,
              excerpt: content.metaDescription,
            };

            this.wordpressService.createPost(post).subscribe({
              next: (published: any) => {
                const postUrl =
                  published.guid?.rendered ||
                  `${this.wordpressService.getSettings()?.wordpress?.apiUrl}/${slug}`;
                this.techTopicService.updateLog(logId, {
                  status: 'completed',
                  seoScore: analysis.score,
                  postId: published.id,
                  postUrl: postUrl,
                  publishedAt: new Date(),
                });

                this.isProcessing.set(false);
                this.loadLogs();
                this.snackBar.open(`Posted successfully! SEO Score: ${analysis.score}%`, 'View', {
                  duration: 5000,
                });
              },
              error: (err: any) => {
                this.techTopicService.updateLog(logId, {
                  status: 'failed',
                  error: err.message,
                });
                this.isProcessing.set(false);
                this.loadLogs();
                this.snackBar.open('Failed to publish: ' + err.message, 'Close', {
                  duration: 5000,
                });
              },
            });
          })
          .catch(() => {
            this.processingStatus.set('Publishing without image...');
            const post = {
              title: content.title,
              content: content.content,
              status: 'publish' as const,
              categories: this.config.categories.length > 0 ? this.config.categories : [1],
              tags: this.config.tags.length > 0 ? this.config.tags : [],
              meta: {
                _rank_math_focus_keyword: keyword,
                _rank_math_seo_score: analysis.score.toString(),
                _rank_math_description: content.metaDescription,
              },
              slug: slug,
              excerpt: content.metaDescription,
            };

            this.wordpressService.createPost(post).subscribe({
              next: (published: any) => {
                const postUrl =
                  published.guid?.rendered ||
                  `${this.wordpressService.getSettings()?.wordpress?.apiUrl}/${slug}`;
                this.techTopicService.updateLog(logId, {
                  status: 'completed',
                  seoScore: analysis.score,
                  postId: published.id,
                  postUrl: postUrl,
                  publishedAt: new Date(),
                });
                this.isProcessing.set(false);
                this.loadLogs();
                this.snackBar.open(`Posted! SEO Score: ${analysis.score}%`, 'View', {
                  duration: 5000,
                });
              },
              error: (err: any) => {
                this.techTopicService.updateLog(logId, { status: 'failed', error: err.message });
                this.isProcessing.set(false);
                this.loadLogs();
                this.snackBar.open('Failed: ' + err.message, 'Close', { duration: 5000 });
              },
            });
          });
      },
      error: (err: any) => {
        this.techTopicService.updateLog(logId, { status: 'failed', error: err.message });
        this.isProcessing.set(false);
        this.loadLogs();
        this.snackBar.open('Generation failed: ' + err.message, 'Close', { duration: 5000 });
      },
    });
  }

  publishNow(): void {
    const content = this.generatedContent();
    if (!content) return;

    const topic = this.selectedTopic();
    const keyword = topic?.keyword || '';
    const logId = uuidv4();

    const log: TechAutoPostLog = {
      id: logId,
      topic: keyword,
      title: content.title,
      status: 'publishing',
      seoScore: this.seoScore(),
      createdAt: new Date(),
    };

    this.techTopicService.addLog(log);
    this.isProcessing.set(true);
    this.processingStatus.set('Publishing...');

    const slug = keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    let postContent = content.content;
    if (this.config.includeSchemaMarkup && content.schemaMarkup) {
      const schemaJsonLd = `<script type="application/ld+json">${content.schemaMarkup.newsArticle}</script>`;
      postContent = schemaJsonLd + postContent;
    }

    const post = {
      title: content.title,
      content: postContent,
      status: 'publish' as const,
      categories: this.config.categories.length > 0 ? this.config.categories : [1],
      tags: this.config.tags.length > 0 ? this.config.tags : [],
      meta: {
        _rank_math_focus_keyword: keyword,
        _rank_math_seo_score: this.seoScore().toString(),
        _rank_math_description: content.metaDescription,
      },
      slug: slug,
      excerpt: content.metaDescription,
    };

    this.wordpressService.createPost(post).subscribe({
      next: (published: any) => {
        const postUrl =
          published.guid?.rendered ||
          `${this.wordpressService.getSettings()?.wordpress?.apiUrl}/${slug}`;
        this.techTopicService.updateLog(logId, {
          status: 'completed',
          postId: published.id,
          postUrl: postUrl,
          publishedAt: new Date(),
        });
        this.isProcessing.set(false);
        this.loadLogs();
        this.generatedContent.set(null);
        this.selectedTopic.set(null);
        this.snackBar.open('Published successfully!', 'View', { duration: 5000 });
      },
      error: (err: any) => {
        this.techTopicService.updateLog(logId, { status: 'failed', error: err.message });
        this.isProcessing.set(false);
        this.loadLogs();
        this.snackBar.open('Failed: ' + err.message, 'Close', { duration: 5000 });
      },
    });
  }

  private async addFeaturedImage(content: any, keyword: string): Promise<number | null> {
    if (!this.config.autoAddImages) return null;

    try {
      const images = await this.imageService.searchImages(keyword, 1).toPromise();
      if (images && images.length > 0) {
        const media = await this.wordpressService
          .uploadImageFromUrl(images[0].url, keyword)
          .toPromise();
        return media?.id || null;
      }
    } catch (e) {
      console.log('Failed to add featured image');
    }
    return null;
  }

  private startAutoPoster(): void {
    if (this.checkInterval) {
      this.checkInterval.unsubscribe();
    }

    if (!this.config.enabled) return;

    const lastAutoPostKey = 'last_auto_post_time';
    const lastAutoPost = localStorage.getItem(lastAutoPostKey);
    const today = new Date().toDateString();

    if (lastAutoPost) {
      const lastPostDate = new Date(lastAutoPost).toDateString();
      if (lastPostDate === today) {
        console.log('Auto-post already done today, skipping...');
        return;
      }
    }

    this.checkInterval = interval(60000).subscribe(() => {
      if (!this.config.enabled) return;

      const now = new Date();
      const [hours, minutes] = this.config.postTime.split(':').map(Number);
      const scheduleTime = new Date();
      scheduleTime.setHours(hours, minutes, 0, 0);

      const currentTime = now.getTime();
      const targetTime = scheduleTime.getTime();
      const timeDiff = Math.abs(currentTime - targetTime);

      if (timeDiff < 60000 && this.canPost()) {
        const todayCheck = new Date().toDateString();
        const lastPostCheck = localStorage.getItem(lastAutoPostKey);

        if (!lastPostCheck || new Date(lastPostCheck).toDateString() !== todayCheck) {
          console.log('Triggering auto-post...');
          localStorage.setItem(lastAutoPostKey, new Date().toISOString());
          this.generateAndPostNow();
        }
      }
    });
  }

  forceRefreshTopics(): void {
    this.techTopicService.forceRefreshTopics();
    this.loadTopics();
    this.snackBar.open('Topics refreshed with new trending articles!', 'Close', { duration: 3000 });
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  clearLogs(): void {
    if (confirm('Clear all post history?')) {
      localStorage.removeItem('tech_auto_post_logs');
      this.loadLogs();
    }
  }

  resetTopics(): void {
    if (
      confirm(
        'Reset all used topics? This will allow all topics to be used again for posting. This does NOT affect already published posts.',
      )
    ) {
      this.techTopicService.resetPermanentlyUsedTopics();
      this.snackBar.open(
        `Topics reset! All ${this.techTopicService.getTotalTopicsCount()} topics are now available.`,
        'Close',
        { duration: 5000 },
      );
    }
  }

  generateNewsSitemap(): void {
    const completedLogs = this.postLogs()
      .filter((log) => log.status === 'completed' && log.postUrl)
      .slice(0, 1000);

    if (completedLogs.length === 0) {
      this.snackBar.open('No published posts to include in sitemap', 'Close', { duration: 3000 });
      return;
    }

    const sitemap = this.schemaService.generateNewsSitemap(
      completedLogs.map((log) => ({
        slug: log.topic
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-'),
        publishDate: new Date(log.publishedAt || log.createdAt),
        category: 'Technology',
      })),
    );

    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'news-sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);

    this.snackBar.open('News sitemap downloaded!', 'Close', { duration: 3000 });
  }

  private addImagePlaceholders(content: string, keyword: string): string {
    // Images disabled - return content as-is
    return content;
  }
}
