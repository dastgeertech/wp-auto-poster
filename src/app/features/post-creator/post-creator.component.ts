import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { WordPressService } from '../../core/services/wordpress.service';
import { ContentGeneratorService } from '../../core/services/content-generator.service';
import { SeoAnalyzerService } from '../../core/services/seo-analyzer.service';
import {
  ArticleAnalyzerService,
  AnalysisReport,
} from '../../core/services/article-analyzer.service';
import { ImageService } from '../../core/services/image.service';
import { SchedulerService } from '../../core/services/scheduler.service';
import {
  WordPressPost,
  WordPressCategory,
  WordPressTag,
  SeoAnalysis,
  ContentOptions,
  GeneratedContent,
  StockImage,
} from '../../core/models';

@Component({
  selector: 'app-post-creator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTabsModule,
    MatChipsModule,
    MatSliderModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="post-creator">
      <div class="creator-grid">
        <div class="creator-main">
          <div class="section">
            <div class="section-header">
              <h3>Content Generation</h3>
            </div>

            <div class="keyword-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Focus Keyword</mat-label>
                <input matInput [(ngModel)]="focusKeyword" placeholder="Enter your main keyword" />
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <div class="options-row">
                <mat-form-field appearance="outline">
                  <mat-label>Tone</mat-label>
                  <mat-select [(ngModel)]="contentTone">
                    <mat-option value="professional">Professional</mat-option>
                    <mat-option value="casual">Casual</mat-option>
                    <mat-option value="educational">Educational</mat-option>
                    <mat-option value="persuasive">Persuasive</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Template</mat-label>
                  <mat-select [(ngModel)]="contentTemplate">
                    <mat-option value="article">Article</mat-option>
                    <mat-option value="listicle">Listicle</mat-option>
                    <mat-option value="howto">How-To Guide</mat-option>
                    <mat-option value="review">Review</mat-option>
                    <mat-option value="news">News</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Word Count</mat-label>
                  <mat-select [(ngModel)]="wordCount">
                    <mat-option [value]="500">500 words</mat-option>
                    <mat-option [value]="800">800 words</mat-option>
                    <mat-option [value]="1000">1000 words</mat-option>
                    <mat-option [value]="1500">1500 words</mat-option>
                    <mat-option [value]="2000">2000 words</mat-option>
                    <mat-option [value]="3000">3000 words</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="auto-options">
                <mat-checkbox [(ngModel)]="autoFeatureImage">Auto set feature image</mat-checkbox>
                <mat-checkbox [(ngModel)]="autoContentImages"
                  >Auto add images in content</mat-checkbox
                >
                <mat-checkbox [(ngModel)]="autoPublish">Auto publish after generation</mat-checkbox>
                <mat-checkbox [(ngModel)]="useLiveData">Use Live Data (Latest Info)</mat-checkbox>
              </div>

              <div class="ai-model-indicator">
                <mat-icon>smart_toy</mat-icon>
                <span
                  >Using: <strong>{{ getActiveModelName() }}</strong></span
                >
                @if (isOllamaAvailable()) {
                  <span class="local-badge">LOCAL</span>
                }
              </div>

              <button
                mat-flat-button
                class="generate-btn"
                (click)="generateContent()"
                [disabled]="!focusKeyword || generating()"
              >
                @if (generating()) {
                  <ng-container>
                    <mat-spinner diameter="20"></mat-spinner>
                    <span>{{ useLiveData ? 'Researching & Generating...' : 'Generating...' }}</span>
                  </ng-container>
                } @else {
                  <ng-container>
                    <mat-icon>{{ useLiveData ? 'public' : 'auto_awesome' }}</mat-icon>
                    <span>{{ useLiveData ? 'Generate with Live Data' : 'Generate Content' }}</span>
                  </ng-container>
                }
              </button>

              @if (postTitle && postContent) {
                <button
                  mat-stroked-button
                  class="optimize-btn"
                  (click)="autoOptimizeArticle()"
                  [disabled]="optimizing()"
                >
                  @if (optimizing()) {
                    <ng-container>
                      <mat-spinner diameter="18"></mat-spinner>
                      <span>Analyzing & Optimizing...</span>
                    </ng-container>
                  } @else {
                    <ng-container>
                      <mat-icon>auto_fix_high</mat-icon>
                      <span>Auto Optimize for 100 SEO</span>
                    </ng-container>
                  }
                </button>
              }

              @if (useLiveData) {
                <div class="live-data-info">
                  <mat-icon>info</mat-icon>
                  <span
                    >Live Data mode searches the web for latest 2026 information before
                    generating</span
                  >
                </div>
              }
            </div>
          </div>

          @if (generatedContent()) {
            <div class="section">
              <div class="section-header">
                <h3>Generated Content</h3>
                <div class="content-actions">
                  <button mat-icon-button (click)="regenerateTitle()" matTooltip="Regenerate Title">
                    <mat-icon>refresh</mat-icon>
                  </button>
                </div>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Post Title</mat-label>
                <input matInput [(ngModel)]="postTitle" (ngModelChange)="analyzeSeo()" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Content</mat-label>
                <textarea
                  matInput
                  [(ngModel)]="postContent"
                  rows="20"
                  (ngModelChange)="analyzeSeo()"
                ></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Meta Description</mat-label>
                <input matInput [(ngModel)]="metaDescription" (ngModelChange)="analyzeSeo()" />
                <mat-hint align="end">{{ metaDescription.length }}/160</mat-hint>
              </mat-form-field>
            </div>

            @if (generatedContent()?.images && generatedContent()!.images.length > 0) {
              <div class="section">
                <div class="section-header">
                  <h3>
                    <mat-icon>image</mat-icon>
                    Researched Images ({{ generatedContent()!.images.length }})
                  </h3>
                </div>
                <p class="info-text">Images found from web search for your article</p>
                <div class="researched-images">
                  @for (img of generatedContent()!.images.slice(0, 6); track img) {
                    <div class="researched-image">
                      <img [src]="img" [alt]="focusKeyword" loading="lazy" />
                      <button
                        mat-icon-button
                        class="copy-url"
                        (click)="copyToClipboard(img)"
                        matTooltip="Copy URL"
                      >
                        <mat-icon>link</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            @if (generatedContent()?.specs && generatedContent()!.specs.length > 0) {
              <div class="section">
                <div class="section-header">
                  <h3>
                    <mat-icon>info</mat-icon>
                    Product Specifications
                  </h3>
                </div>
                <div class="specs-grid">
                  @for (spec of generatedContent()!.specs; track $index) {
                    <div class="spec-card">
                      @if (spec.processor) {
                        <div class="spec-item">
                          <mat-icon>memory</mat-icon>
                          <span>{{ spec.processor }}</span>
                        </div>
                      }
                      @if (spec.display) {
                        <div class="spec-item">
                          <mat-icon>tv</mat-icon>
                          <span>{{ spec.display }}</span>
                        </div>
                      }
                      @if (spec.camera) {
                        <div class="spec-item">
                          <mat-icon>camera_alt</mat-icon>
                          <span>{{ spec.camera }}</span>
                        </div>
                      }
                      @if (spec.battery) {
                        <div class="spec-item">
                          <mat-icon>battery_full</mat-icon>
                          <span>{{ spec.battery }}</span>
                        </div>
                      }
                      @if (spec.ram) {
                        <div class="spec-item">
                          <mat-icon>storage</mat-icon>
                          <span>{{ spec.ram }}</span>
                        </div>
                      }
                      @if (spec.storage) {
                        <div class="spec-item">
                          <mat-icon>sd_storage</mat-icon>
                          <span>{{ spec.storage }}</span>
                        </div>
                      }
                      @if (spec.price) {
                        <div class="spec-item">
                          <mat-icon>attach_money</mat-icon>
                          <span>{{ spec.price }}</span>
                        </div>
                      }
                      @if (spec.releaseDate) {
                        <div class="spec-item">
                          <mat-icon>event</mat-icon>
                          <span>{{ spec.releaseDate }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <div class="section">
              <div class="section-header">
                <h3>Featured Image</h3>
                <button
                  mat-flat-button
                  class="search-btn"
                  (click)="searchImages()"
                  [disabled]="!focusKeyword || searchingImages()"
                >
                  @if (searchingImages()) {
                    <mat-spinner diameter="18"></mat-spinner>
                  } @else {
                    <mat-icon>search</mat-icon>
                  }
                  Search Google Images
                </button>
              </div>

              @if (imageResults().length > 0) {
                <div class="image-results-header">
                  <span>{{ imageResults().length }} images found</span>
                </div>
                <div class="image-grid">
                  @for (image of imageResults(); track image.id) {
                    <div
                      class="image-item"
                      [class.selected]="selectedFeatureImage()?.id === image.id"
                      (click)="selectFeatureImage(image)"
                    >
                      <img
                        [src]="image.thumbnailUrl"
                        [alt]="image.altText"
                        (error)="onImageError($event, image)"
                      />
                      <div class="image-overlay">
                        <mat-icon>{{
                          selectedFeatureImage()?.id === image.id ? 'check_circle' : 'add'
                        }}</mat-icon>
                      </div>
                    </div>
                  }
                </div>
              }

              @if (selectedFeatureImage()) {
                <div class="featured-image-preview">
                  <img
                    [src]="selectedFeatureImage()!.url"
                    [alt]="selectedFeatureImage()!.altText"
                    (error)="onImageError($event, selectedFeatureImage())"
                  />
                  <div class="image-info">
                    <span class="image-source"
                      >Selected: {{ selectedFeatureImage()!.photographer }}</span
                    >
                    <button mat-button color="warn" (click)="clearFeatureImage()">
                      <mat-icon>delete</mat-icon> Remove
                    </button>
                  </div>
                </div>
              } @else if (!imageResults().length) {
                <div class="image-placeholder">
                  <mat-icon>image_search</mat-icon>
                  <span>No images yet</span>
                  <p class="placeholder-hint">
                    Click "Search Google Images" to find images for your article
                  </p>
                </div>
              }
            </div>

            <div class="section">
              <div class="section-header">
                <h3>Content Images</h3>
                <button mat-button (click)="addContentImages()" [disabled]="!focusKeyword">
                  <mat-icon>add_photo_alternate</mat-icon>
                  Add to Content
                </button>
              </div>
              @if (contentImages().length > 0) {
                <div class="image-grid">
                  @for (image of contentImages(); track image.id) {
                    <div class="image-item content-image" (click)="insertImageInContent(image)">
                      <img [src]="image.thumbnailUrl" [alt]="image.altText" />
                      <span class="insert-hint">Click to insert</span>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <div class="section">
            <div class="section-header">
              <h3>Post Settings</h3>
            </div>

            <div class="settings-grid">
              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <mat-select [(ngModel)]="selectedCategory">
                  @for (category of categories(); track category.id) {
                    <mat-option [value]="category.id">{{ category.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tags</mat-label>
                <mat-select [(ngModel)]="selectedTags" multiple>
                  @for (tag of tags(); track tag.id) {
                    <mat-option [value]="tag.id">{{ tag.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select [(ngModel)]="postStatus">
                  <mat-option value="draft">Draft</mat-option>
                  <mat-option value="publish">Publish Now</mat-option>
                  <mat-option value="future">Schedule</mat-option>
                </mat-select>
              </mat-form-field>

              @if (postStatus === 'future') {
                <mat-form-field appearance="outline">
                  <mat-label>Schedule Date</mat-label>
                  <input matInput [matDatepicker]="picker" [(ngModel)]="scheduleDate" />
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>
              }
            </div>
          </div>

          <div class="action-buttons">
            <button
              mat-stroked-button
              (click)="saveDraft()"
              [disabled]="!postTitle || publishing()"
            >
              <mat-icon>save</mat-icon>
              Save Draft
            </button>
            <button
              mat-flat-button
              class="publish-btn"
              (click)="publishPost()"
              [disabled]="!postTitle || publishing()"
            >
              @if (publishing()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <mat-icon>{{ postStatus === 'publish' ? 'publish' : 'schedule' }}</mat-icon>
              }
              {{ postStatus === 'publish' ? 'Publish' : 'Schedule' }}
            </button>
          </div>
        </div>

        <div class="creator-sidebar">
          <div class="seo-panel">
            <div class="seo-header">
              <h3>SEO Score</h3>
              <span class="seo-score" [class]="getSeoScoreClass()">{{ seoScore() }}/100</span>
            </div>

            <mat-progress-bar
              mode="determinate"
              [value]="seoScore()"
              [color]="seoScore() >= 80 ? 'primary' : 'warn'"
            ></mat-progress-bar>

            <!-- Google Search Preview -->
            <div class="google-preview">
              <h4><mat-icon>search</mat-icon> Google Preview</h4>
              <div class="preview-card">
                <div class="preview-url">
                  <span class="site-name">yoursite.com</span>
                  <span class="breadcrumb"> / {{ focusKeyword || 'article' }}/</span>
                </div>
                <div class="preview-title">{{ postTitle || 'Your Title Will Appear Here' }}</div>
                <div class="preview-description">
                  {{
                    metaDescription || postTitle
                      ? metaDescription ||
                        postTitle +
                          ' - Learn everything about ' +
                          focusKeyword +
                          ' in this comprehensive guide.'
                      : 'Enter a title and meta description to see preview...'
                  }}
                </div>
              </div>
            </div>

            <!-- SEO Details -->
            <div class="seo-details">
              <h4><mat-icon>tune</mat-icon> SEO Details</h4>
              <div class="detail-item">
                <span class="detail-label">Focus Keyword:</span>
                <span class="detail-value keyword">{{ focusKeyword || 'Not set' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Title Length:</span>
                <span
                  class="detail-value"
                  [class.warning]="postTitle.length > 60 || postTitle.length < 30"
                >
                  {{ postTitle.length }}/60 chars
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Meta Description:</span>
                <span
                  class="detail-value"
                  [class.warning]="metaDescription.length > 160 || metaDescription.length < 120"
                >
                  {{ metaDescription.length }}/160 chars
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Content Words:</span>
                <span class="detail-value">{{ wordCount }} words</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Headings:</span>
                <span class="detail-value">{{ seoAnalysis()?.headingCount || 0 }} found</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Images:</span>
                <span class="detail-value">{{ seoAnalysis()?.hasImages ? 'Yes' : 'No' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Internal Links:</span>
                <span class="detail-value">{{ seoAnalysis()?.internalLinks || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">External Links:</span>
                <span class="detail-value">{{ seoAnalysis()?.externalLinks || 0 }}</span>
              </div>
            </div>

            <!-- Auto Tags Preview -->
            @if (focusKeyword) {
              <div class="auto-tags-preview">
                <h4><mat-icon>label</mat-icon> Auto-generated Tags</h4>
                <div class="tags-list">
                  @for (tag of getSuggestedTags(); track tag) {
                    <span class="tag-chip">{{ tag }}</span>
                  }
                </div>
              </div>
            }

            <div class="seo-checklist">
              <div class="check-item" [class.checked]="seoAnalysis()?.titleHasKeyword">
                <mat-icon>{{
                  seoAnalysis()?.titleHasKeyword ? 'check_circle' : 'radio_button_unchecked'
                }}</mat-icon>
                <span>Keyword in title</span>
              </div>
              <div class="check-item" [class.checked]="seoAnalysis()?.firstParagraphHasKeyword">
                <mat-icon>{{
                  seoAnalysis()?.firstParagraphHasKeyword
                    ? 'check_circle'
                    : 'radio_button_unchecked'
                }}</mat-icon>
                <span>Keyword in first paragraph</span>
              </div>
              <div
                class="check-item"
                [class.checked]="
                  seoAnalysis()?.keywordDensity! >= 1 && seoAnalysis()?.keywordDensity! <= 3
                "
              >
                <mat-icon>{{
                  seoAnalysis()?.keywordDensity! >= 1 && seoAnalysis()?.keywordDensity! <= 3
                    ? 'check_circle'
                    : 'radio_button_unchecked'
                }}</mat-icon>
                <span>Keyword density 1-3%</span>
              </div>
              <div class="check-item" [class.checked]="seoAnalysis()?.contentLength! >= 800">
                <mat-icon>{{
                  seoAnalysis()?.contentLength! >= 800 ? 'check_circle' : 'radio_button_unchecked'
                }}</mat-icon>
                <span>Content 800+ words</span>
              </div>
              <div class="check-item" [class.checked]="seoAnalysis()?.headingCount! >= 2">
                <mat-icon>{{
                  seoAnalysis()?.headingCount! >= 2 ? 'check_circle' : 'radio_button_unchecked'
                }}</mat-icon>
                <span>At least 2 headings</span>
              </div>
              <div class="check-item" [class.checked]="seoAnalysis()?.hasImages">
                <mat-icon>{{
                  seoAnalysis()?.hasImages ? 'check_circle' : 'radio_button_unchecked'
                }}</mat-icon>
                <span>Has images</span>
              </div>
              <div
                class="check-item"
                [class.checked]="
                  (seoAnalysis()?.internalLinks || 0) + (seoAnalysis()?.externalLinks || 0) >= 2
                "
              >
                <mat-icon>{{
                  (seoAnalysis()?.internalLinks || 0) + (seoAnalysis()?.externalLinks || 0) >= 2
                    ? 'check_circle'
                    : 'radio_button_unchecked'
                }}</mat-icon>
                <span>2+ links</span>
              </div>
            </div>

            @if (seoAnalysis()?.suggestions?.length) {
              <div class="seo-suggestions">
                <h4>Suggestions</h4>
                @for (suggestion of seoAnalysis()?.suggestions; track suggestion) {
                  <div class="suggestion">
                    <mat-icon>lightbulb</mat-icon>
                    <span>{{ suggestion }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <div class="readability-panel">
            <h3>Readability</h3>
            <div class="readability-score">
              <span class="score">{{ seoAnalysis()?.readabilityScore || 0 }}</span>
              <span class="label">Flesch Score</span>
            </div>
            <div class="readability-bar">
              <div
                class="readability-fill"
                [style.width.%]="seoAnalysis()?.readabilityScore || 0"
                [class]="getReadabilityClass()"
              ></div>
            </div>
          </div>

          <div class="content-stats">
            <h3>Content Stats</h3>
            <div class="stat-row">
              <span>Word Count</span>
              <span>{{ wordCountActual() }}</span>
            </div>
            <div class="stat-row">
              <span>Paragraphs</span>
              <span>{{ paragraphCount() }}</span>
            </div>
            <div class="stat-row">
              <span>Headings</span>
              <span>{{ seoAnalysis()?.headingCount || 0 }}</span>
            </div>
            <div class="stat-row">
              <span>Keyword Density</span>
              <span>{{ (seoAnalysis()?.keywordDensity || 0).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .post-creator {
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

      .creator-grid {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 24px;
      }

      .creator-main {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .section {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        border: 1px solid rgba(233, 69, 96, 0.1);
        overflow: hidden;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }
      }

      .keyword-section {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .options-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .auto-options {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 12px 16px;
        background: rgba(0, 217, 165, 0.08);
        border: 1px solid rgba(0, 217, 165, 0.2);
        border-radius: 10px;

        mat-checkbox {
          font-size: 13px;
          color: #00d9a5;
        }
      }

      .ai-model-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(66, 133, 244, 0.1);
        border: 1px solid rgba(66, 133, 244, 0.3);
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 13px;
        color: #a0a0b8;

        mat-icon {
          color: #4285f4;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        strong {
          color: #4285f4;
        }

        .local-badge {
          background: #4caf50;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          margin-left: 8px;
        }
      }

      .live-data-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(233, 69, 96, 0.1);
        border: 1px solid rgba(233, 69, 96, 0.3);
        border-radius: 8px;
        margin-top: 12px;
        font-size: 12px;
        color: #ff6b6b;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .full-width {
        width: 100%;
      }

      .generate-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 24px;
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 15px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(233, 69, 96, 0.4);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .optimize-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 20px;
        background: transparent;
        color: #00d9a5;
        border: 2px solid #00d9a5;
        border-radius: 10px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          background: rgba(0, 217, 165, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 217, 165, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        mat-spinner {
          margin-right: 4px;
        }
      }

      .settings-grid {
        padding: 20px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .featured-image-preview {
        position: relative;
        margin: 20px;
        border-radius: 12px;
        overflow: hidden;

        img {
          width: 100%;
          height: 250px;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          top: 8px;
          right: 8px;

          button {
            background: rgba(0, 0, 0, 0.6);
            color: white;
          }
        }
      }

      .image-placeholder {
        margin: 20px;
        padding: 40px;
        background: rgba(255, 255, 255, 0.03);
        border: 2px dashed rgba(233, 69, 96, 0.3);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: #a0a0b8;

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
        }
      }

      .search-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        color: white;
        border: none;
        padding: 8px 16px;

        &:disabled {
          opacity: 0.6;
        }

        mat-spinner {
          margin-right: 4px;
        }
      }

      .researched-images {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
        padding: 16px 20px;

        .researched-image {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #0f0f1a;
          aspect-ratio: 1;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .copy-url {
            position: absolute;
            top: 4px;
            right: 4px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
          }
        }
      }

      .specs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        padding: 16px 20px;

        .spec-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;

          .spec-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 12px;
            font-size: 13px;
            color: #ccc;

            &:last-child {
              margin-bottom: 0;
            }

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
              color: #64b5f6;
            }

            span {
              flex: 1;
              word-break: break-word;
            }
          }
        }
      }

      .image-results-header {
        padding: 12px 20px 8px;
        font-size: 13px;
        color: #00d9a5;
      }

      .featured-image-preview {
        margin: 0 20px 20px;
        border-radius: 12px;
        overflow: hidden;
        background: #0f0f1a;

        img {
          width: 100%;
          max-height: 400px;
          object-fit: contain;
          display: block;
        }

        .image-info {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.3);

          .image-source {
            font-size: 12px;
            color: #00d9a5;
          }
        }
      }

      .placeholder-hint {
        font-size: 12px;
        color: #666;
        margin: 4px 0 0;
      }

      .image-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
        padding: 0 20px 20px;
      }

      .image-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s ease;
        background: #0f0f1a;

        &:hover {
          border-color: #e94560;

          .image-overlay {
            opacity: 1;
          }
        }

        &.selected {
          border-color: #00d9a5;
          box-shadow: 0 0 12px rgba(0, 217, 165, 0.4);

          .image-overlay {
            opacity: 1;
            background: rgba(0, 217, 165, 0.8);
          }
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(233, 69, 96, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;

          mat-icon {
            color: white;
            font-size: 32px;
            width: 32px;
            height: 32px;
          }
        }
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px;

        button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
        }

        .publish-btn {
          background: linear-gradient(135deg, #00d9a5 0%, #00b894 100%);
          color: white;
          border: none;

          &:disabled {
            opacity: 0.6;
          }
        }
      }

      .creator-sidebar {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .seo-panel,
      .readability-panel,
      .content-stats {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        border: 1px solid rgba(233, 69, 96, 0.1);
        padding: 20px;
      }

      .seo-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;

        h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }
      }

      .google-preview {
        margin: 16px 0;
        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          font-size: 13px;
          color: #a0a0b8;
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
        .preview-card {
          background: #fff;
          border-radius: 8px;
          padding: 12px;
          .preview-url {
            font-size: 12px;
            color: #202124;
            margin-bottom: 4px;
            .site-name {
              color: #5f6368;
            }
            .breadcrumb {
              color: #5f6368;
            }
          }
          .preview-title {
            font-size: 18px;
            color: #1a0dab;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: Arial, sans-serif;
          }
          .preview-description {
            font-size: 13px;
            color: #4d5156;
            line-height: 1.4;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            font-family: Arial, sans-serif;
          }
        }
      }

      .seo-details {
        margin: 16px 0;
        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          font-size: 13px;
          color: #a0a0b8;
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 12px;
          .detail-label {
            color: #666;
          }
          .detail-value {
            color: #a0a0b8;
            font-weight: 500;
          }
          .detail-value.keyword {
            color: #4285f4;
          }
          .detail-value.warning {
            color: #ff9800;
          }
        }
      }

      .auto-tags-preview {
        margin: 16px 0;
        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          font-size: 13px;
          color: #a0a0b8;
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          .tag-chip {
            padding: 4px 10px;
            background: rgba(66, 133, 244, 0.2);
            color: #4285f4;
            border-radius: 16px;
            font-size: 11px;
          }
        }
      }

      .seo-score {
        font-family: 'Outfit', sans-serif;
        font-size: 28px;
        font-weight: 700;

        &.good {
          color: #00d9a5;
        }
        &.medium {
          color: #ffc107;
        }
        &.poor {
          color: #ff6b6b;
        }
      }

      .seo-checklist {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .check-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        font-size: 13px;
        color: #a0a0b8;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #a0a0b8;
        }

        &.checked {
          background: rgba(0, 217, 165, 0.1);

          mat-icon {
            color: #00d9a5;
          }

          span {
            color: #00d9a5;
          }
        }
      }

      .seo-suggestions {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);

        h4 {
          font-size: 13px;
          color: #a0a0b8;
          margin: 0 0 12px;
        }
      }

      .suggestion {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px;
        background: rgba(255, 193, 7, 0.1);
        border-radius: 6px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #ffc107;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
      }

      .readability-panel {
        h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
        }
      }

      .readability-score {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 12px;

        .score {
          font-family: 'Outfit', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #ffffff;
        }

        .label {
          font-size: 12px;
          color: #a0a0b8;
        }
      }

      .readability-bar {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;

        .readability-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;

          &.easy {
            background: #00d9a5;
          }
          &.medium {
            background: #ffc107;
          }
          &.hard {
            background: #ff6b6b;
          }
        }
      }

      .content-stats {
        h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
        }
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 13px;

        &:last-child {
          border-bottom: none;
        }

        span:first-child {
          color: #a0a0b8;
        }

        span:last-child {
          color: #ffffff;
          font-weight: 500;
        }
      }

      @media (max-width: 1200px) {
        .creator-grid {
          grid-template-columns: 1fr;
        }

        .creator-sidebar {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .options-row,
        .settings-grid {
          grid-template-columns: 1fr;
        }

        .image-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .creator-sidebar {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PostCreatorComponent implements OnInit {
  focusKeyword = '';
  postTitle = '';
  postContent = '';
  metaDescription = '';
  contentTone: 'professional' | 'casual' | 'educational' | 'persuasive' = 'professional';
  contentTemplate: 'article' | 'listicle' | 'howto' | 'review' | 'news' = 'article';
  wordCount = 1500;
  postStatus: 'draft' | 'publish' | 'future' = 'draft';
  scheduleDate = new Date();
  selectedCategory: number | null = null;
  selectedTags: number[] = [];
  customImageUrl = '';
  autoFeatureImage = true;
  autoContentImages = true;
  autoPublish = false;
  useLiveData = true;

  categories = signal<WordPressCategory[]>([]);
  tags = signal<WordPressTag[]>([]);
  generating = signal(false);
  publishing = signal(false);
  searchingImages = signal(false);
  seoScore = signal(0);
  seoAnalysis = signal<SeoAnalysis | null>(null);
  generatedContent = signal<GeneratedContent | null>(null);
  imageResults = signal<StockImage[]>([]);
  contentImages = signal<StockImage[]>([]);
  selectedFeatureImage = signal<StockImage | null>(null);
  optimizing = signal(false);
  analysisReport = signal<AnalysisReport | null>(null);

  wordCountActual = computed(() => {
    if (!this.postContent) return 0;
    return this.postContent
      .replace(/<[^>]*>/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  });

  paragraphCount = computed(() => {
    if (!this.postContent) return 0;
    return this.postContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  });

  constructor(
    private route: ActivatedRoute,
    private wordpressService: WordPressService,
    private contentGenerator: ContentGeneratorService,
    private seoAnalyzer: SeoAnalyzerService,
    private articleAnalyzer: ArticleAnalyzerService,
    private imageService: ImageService,
    private schedulerService: SchedulerService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Load categories and tags
    this.wordpressService.categories$.subscribe((cats) => this.categories.set(cats));
    this.wordpressService.tags$.subscribe((tags) => this.tags.set(tags));

    // Check for AI generation flag
    this.route.queryParams.subscribe((params) => {
      if (params['ai'] === 'true') {
        // Focus on keyword input
      }
    });
  }

  generateContent(): void {
    if (!this.focusKeyword) return;

    this.generating.set(true);

    const options: ContentOptions = {
      keyword: this.focusKeyword,
      tone: this.contentTone,
      wordCount: this.wordCount,
      template: this.contentTemplate,
      includeImages: true,
    };

    const generator = this.useLiveData
      ? this.contentGenerator.generateContentWithLiveData(options)
      : this.contentGenerator.generateContent(options);

    generator.subscribe({
      next: (content) => {
        this.generatedContent.set(content);
        this.postTitle = content.title;
        this.postContent = content.content;
        this.metaDescription = content.metaDescription;
        this.analyzeSeo();

        this.searchImages();

        this.generating.set(false);
        this.snackBar.open('Content generated successfully!', 'Close', { duration: 3000 });

        if (this.autoFeatureImage || this.autoContentImages) {
          this.imageService
            .searchImages(this.focusKeyword, this.autoContentImages ? 5 : 1)
            .subscribe({
              next: (images) => {
                if (images.length > 0) {
                  if (this.autoFeatureImage) {
                    this.selectedFeatureImage.set(images[0]);
                  }
                  if (this.autoContentImages) {
                    this.contentImages.set(images);
                    this.autoInsertContentImages(images);
                  }
                }
              },
              error: () => {
                console.log('Auto image selection failed');
              },
            });
        }

        if (this.autoPublish) {
          setTimeout(() => {
            this.publishPost();
          }, 2000);
        }
      },
      error: (err) => {
        this.generating.set(false);
        this.snackBar.open(err.message, 'Close', { duration: 5000 });
      },
    });
  }

  regenerateTitle(): void {
    this.contentGenerator.generateTitle(this.focusKeyword).subscribe({
      next: (titles) => {
        const titleList = titles.split('\n').filter((t) => t.trim());
        if (titleList.length > 0) {
          this.postTitle = titleList[Math.floor(Math.random() * titleList.length)];
          this.analyzeSeo();
        }
      },
    });
  }

  searchImages(): void {
    if (!this.focusKeyword) return;

    this.searchingImages.set(true);
    this.imageResults.set([]);

    this.imageService.searchImages(this.focusKeyword, 10).subscribe({
      next: (images) => {
        this.imageResults.set(images);
        this.searchingImages.set(false);
        if (images.length > 0) {
          this.snackBar.open(`Found ${images.length} images!`, 'Close', { duration: 2000 });
        } else {
          this.snackBar.open('No images found. Try a different keyword.', 'Close', {
            duration: 3000,
          });
        }
      },
      error: (err) => {
        this.searchingImages.set(false);
        console.error('Image search error:', err);
        this.snackBar.open('Failed to search images. Check your API settings.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  selectFeatureImage(image: StockImage): void {
    this.selectedFeatureImage.set(image);
  }

  clearFeatureImage(): void {
    this.selectedFeatureImage.set(null);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('URL copied to clipboard!', 'Close', { duration: 2000 });
    });
  }

  addCustomImage(): void {
    if (!this.customImageUrl) return;

    this.imageService.searchByUrl(this.customImageUrl, this.focusKeyword).subscribe({
      next: (image) => {
        this.selectedFeatureImage.set(image);
        this.customImageUrl = '';
        this.snackBar.open('Image added from Google!', 'Close', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to add image', 'Close', { duration: 2000 });
      },
    });
  }

  onImageError(event: Event, image?: StockImage | null): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    if (image) {
      image.thumbnailUrl = '';
    }
  }

  addContentImages(): void {
    if (!this.focusKeyword) return;

    this.imageService.getMultipleImages(this.focusKeyword, 3).subscribe({
      next: (images) => {
        this.contentImages.set(images);
      },
    });
  }

  insertImageInContent(image: StockImage): void {
    const imgHtml = this.imageService.insertImageInContent(image, this.focusKeyword);
    this.postContent += '\n\n' + imgHtml;
    this.analyzeSeo();
  }

  autoInsertContentImages(images: StockImage[]): void {
    const h2Tags = this.postContent.match(/<h2[^>]*>/gi) || [];
    const insertionPoints: number[] = [];

    h2Tags.forEach((tag, index) => {
      if (index > 0 && index < h2Tags.length) {
        const regex = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = this.postContent.match(regex);
        if (matches && matches.length > index) {
          let pos = 0;
          let count = 0;
          let searchPos = 0;
          while (count <= index && (pos = this.postContent.indexOf(tag, searchPos)) !== -1) {
            searchPos = pos + tag.length;
            count++;
          }
          if (pos !== -1) {
            insertionPoints.push(pos);
          }
        }
      }
    });

    let insertedCount = 0;
    insertionPoints.forEach((pos, i) => {
      if (insertedCount < images.length) {
        const image = images[insertedCount % images.length];
        const imgHtml = this.imageService.insertImageInContent(image, this.focusKeyword);
        const beforeTag = this.postContent.substring(0, pos);
        const afterTag = this.postContent.substring(pos);
        this.postContent = beforeTag + imgHtml + '\n\n' + afterTag;
        insertedCount++;
      }
    });

    if (insertedCount === 0 && images.length > 0) {
      const image = images[0];
      const imgHtml = this.imageService.insertImageInContent(image, this.focusKeyword);
      this.postContent += '\n\n' + imgHtml;
    }

    this.analyzeSeo();
  }

  analyzeSeo(): void {
    if (!this.postContent || !this.focusKeyword) {
      this.seoScore.set(0);
      this.seoAnalysis.set(null);
      return;
    }

    const analysis = this.seoAnalyzer.analyzeSeo(
      this.postContent,
      this.postTitle,
      this.focusKeyword,
      '',
    );

    // Add meta description bonus if present and good length
    if (this.metaDescription.length >= 120 && this.metaDescription.length <= 160) {
      if (this.metaDescription.toLowerCase().includes(this.focusKeyword.toLowerCase())) {
        analysis.score = Math.min(100, analysis.score + 10);
      }
    }

    this.seoScore.set(analysis.score);
    this.seoAnalysis.set(analysis);
  }

  autoOptimizeArticle(): void {
    if (!this.postTitle || !this.postContent || !this.focusKeyword) {
      this.snackBar.open('Generate content first to optimize', 'Close', { duration: 3000 });
      return;
    }

    this.optimizing.set(true);
    this.snackBar.open('Analyzing and auto-optimizing your article...', 'Close', {
      duration: 2000,
    });

    setTimeout(() => {
      const result = this.articleAnalyzer.analyzeAndOptimize(
        this.postContent,
        this.postTitle,
        this.focusKeyword,
      );

      this.postTitle = result.title;
      this.postContent = result.content;
      this.metaDescription = result.metaDescription;
      this.analysisReport.set(result.report);

      this.analyzeSeo();

      const improvedScore = this.seoScore();
      this.optimizing.set(false);

      if (improvedScore >= 80) {
        this.snackBar.open(`Optimization complete! SEO Score: ${improvedScore}/100`, 'Close', {
          duration: 4000,
        });
      } else {
        this.snackBar.open(
          `Optimized! Score: ${improvedScore}/100 - More improvements available`,
          'Close',
          { duration: 4000 },
        );
      }
    }, 500);
  }

  getSeoScoreClass(): string {
    const score = this.seoScore();
    if (score >= 80) return 'good';
    if (score >= 60) return 'medium';
    return 'poor';
  }

  getReadabilityClass(): string {
    const score = this.seoAnalysis()?.readabilityScore || 0;
    if (score >= 60) return 'easy';
    if (score >= 30) return 'medium';
    return 'hard';
  }

  getActiveModelName(): string {
    const bestModel = this.contentGenerator.getBestAvailableModel();
    return bestModel.name;
  }

  isOllamaAvailable(): boolean {
    return this.contentGenerator.isOllamaAvailable();
  }

  getSuggestedTags(): string[] {
    if (!this.focusKeyword) return [];
    const tags: string[] = [this.focusKeyword];
    const words = this.focusKeyword.split(/\s+/);
    if (words.length > 1) {
      words.forEach((word) => {
        if (word.length > 3) tags.push(word);
      });
    }
    const suffixes = ['guide', 'tips', '2026', 'how', 'what'];
    suffixes.forEach((suffix) => {
      tags.push(`${this.focusKeyword} ${suffix}`);
    });
    return [...new Set(tags)].slice(0, 6);
  }

  saveDraft(): void {
    this.publishPostInternal('draft');
  }

  publishPost(): void {
    if (this.postStatus === 'future') {
      this.publishPostInternal('future');
    } else {
      this.publishPostInternal(this.postStatus);
    }
  }

  private publishPostInternal(status: 'draft' | 'publish' | 'future'): void {
    if (!this.postTitle || !this.postContent) return;

    this.publishing.set(true);
    this.snackBar.open('Generating image with AI...', 'Close', { duration: 3000 });

    // Generate image using Groq with the focus keyword
    const apiKey = this.imageService.getGroqApiKey();

    if (apiKey && this.focusKeyword) {
      this.imageService.generateAndGetImageUrl(this.focusKeyword, apiKey).subscribe({
        next: (generatedImageUrl) => {
          console.log('Generated image URL:', generatedImageUrl);

          // Upload the generated image to WordPress
          this.wordpressService.uploadImageFromUrl(generatedImageUrl, this.focusKeyword).subscribe({
            next: (media) => {
              console.log('Image uploaded to WordPress:', media.source_url);
              this.uploadedImageUrl = media.source_url;
              this.processAndPublish(status);
            },
            error: (err) => {
              console.error('Failed to upload image:', err);
              this.snackBar.open('Failed to upload image, publishing without image', 'Close', {
                duration: 3000,
              });
              this.uploadedImageUrl = '';
              this.processAndPublish(status);
            },
          });
        },
        error: (err) => {
          console.error('Failed to generate image:', err);
          this.snackBar.open('Failed to generate AI image, publishing without image', 'Close', {
            duration: 3000,
          });
          this.uploadedImageUrl = '';
          this.processAndPublish(status);
        },
      });
    } else {
      this.uploadedImageUrl = '';
      this.processAndPublish(status);
    }
  }

  private uploadedImageUrl: string = '';

  private processAndPublish(status: string): void {
    let updatedContent = this.postContent;

    // Replace placeholder images with the uploaded image URL
    if (this.uploadedImageUrl) {
      const placeholderPattern = /https:\/\/placehold\.co\/[^\s"']+/g;
      updatedContent = updatedContent.replace(placeholderPattern, this.uploadedImageUrl);
    }

    this.doPublishPost(status as 'draft' | 'publish' | 'future', updatedContent);
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private doPublishPost(status: 'draft' | 'publish' | 'future', processedContent: string): void {
    this.publishing.set(true);

    const prepareAndPublish = (post: WordPressPost) => {
      if (status === 'future' && this.scheduleDate) {
        post.date = this.scheduleDate.toISOString();
      }

      if (this.uploadedImageUrl) {
        this.snackBar.open('Uploading featured image to WordPress...', 'Close', { duration: 2000 });
        this.wordpressService
          .uploadImageFromUrl(this.uploadedImageUrl, this.focusKeyword)
          .subscribe({
            next: (media) => {
              post.featured_media = media.id;
              this.createPost(post, status);
            },
            error: () => {
              this.createPost(post, status);
            },
          });
      } else if (this.selectedFeatureImage()) {
        this.snackBar.open('Uploading featured image to WordPress...', 'Close', { duration: 2000 });
        this.wordpressService
          .uploadImageFromUrl(
            this.selectedFeatureImage()!.url,
            this.selectedFeatureImage()!.altText,
          )
          .subscribe({
            next: (media) => {
              post.featured_media = media.id;
              this.createPost(post, status);
            },
            error: () => {
              this.createPost(post, status);
            },
          });
      } else {
        this.createPost(post, status);
      }
    };

    const post: WordPressPost = {
      title: this.postTitle,
      content: processedContent,
      status: status === 'future' ? 'future' : status,
      categories: this.selectedCategory ? [this.selectedCategory] : [1],
      tags: this.selectedTags && this.selectedTags.length > 0 ? this.selectedTags : [],
      meta: {
        _rank_math_focus_keyword: this.focusKeyword,
        _rank_math_title: `${this.postTitle} - ${this.focusKeyword} | Ultimate Guide`,
        _rank_math_description:
          this.metaDescription ||
          `${this.postTitle}. Learn everything about ${this.focusKeyword} in this comprehensive guide.`,
        _rank_math_seo_score: this.seoScore().toString(),
      },
    };

    if (this.selectedTags && this.selectedTags.length === 0 && this.focusKeyword) {
      const generatedTags = this.generateTagsFromKeyword(this.focusKeyword);
      this.wordpressService.createTagsFromKeywords(generatedTags).subscribe({
        next: (tagIds) => {
          post.tags = tagIds;
          this.snackBar.open(
            `Auto-generated ${tagIds.length} tags: ${generatedTags.join(', ')}`,
            'Close',
            { duration: 3000 },
          );
          prepareAndPublish(post);
        },
        error: () => {
          prepareAndPublish(post);
        },
      });
    } else {
      prepareAndPublish(post);
    }
  }

  private generateTagsFromKeyword(keyword: string): string[] {
    const tags: string[] = [keyword];
    const words = keyword.split(/\s+/);
    if (words.length > 1) {
      words.forEach((word) => {
        if (word.length > 3) tags.push(word);
      });
    }
    const suffixes = ['guide', 'tips', '2026', 'how', 'what', 'best', 'free'];
    suffixes.forEach((suffix) => {
      tags.push(`${keyword} ${suffix}`);
    });
    return [...new Set(tags)].slice(0, 8);
  }

  private createPost(post: WordPressPost, status: string): void {
    this.wordpressService.createPost(post).subscribe({
      next: () => {
        this.publishing.set(false);
        this.snackBar.open(
          status === 'draft'
            ? 'Draft saved!'
            : status === 'future'
              ? 'Post scheduled!'
              : 'Post published!',
          'Close',
          { duration: 3000 },
        );
        this.resetForm();
      },
      error: (err) => {
        this.publishing.set(false);
        this.snackBar.open('Failed to publish post: ' + err.message, 'Close', { duration: 5000 });
      },
    });
  }

  private resetForm(): void {
    this.postTitle = '';
    this.postContent = '';
    this.metaDescription = '';
    this.focusKeyword = '';
    this.selectedFeatureImage.set(null);
    this.imageResults.set([]);
    this.contentImages.set([]);
    this.seoScore.set(0);
    this.seoAnalysis.set(null);
    this.generatedContent.set(null);
  }
}
