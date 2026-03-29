import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ContentEnhancementService,
  TONES,
  SUPPORTED_LANGUAGES,
  EnhancementOptions,
} from '../../core/services/content-enhancement.service';
import { CacheService } from '../../core/services/cache.service';

@Component({
  selector: 'app-content-tools',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="content-tools">
      <div class="tools-header">
        <h2><mat-icon>tune</mat-icon> Content Tools</h2>
        <p>AI-powered content enhancement, summarization, rewriting, and translation</p>
      </div>

      <mat-tab-group class="tools-tabs" animationDuration="300ms">
        <!-- Enhance Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>auto_fix_high</mat-icon>
            <span>Enhance</span>
          </ng-template>

          <div class="tab-content">
            <div class="enhance-panel">
              <div class="input-section">
                <h3>Original Content</h3>
                <textarea
                  [(ngModel)]="enhanceContent"
                  placeholder="Paste your content here to enhance..."
                  rows="8"
                ></textarea>

                <div class="enhance-options">
                  <h4>Enhancement Options</h4>
                  <div class="options-grid">
                    <mat-slide-toggle [(ngModel)]="enhanceOptions.improveReadability">
                      Improve Readability
                    </mat-slide-toggle>
                    <mat-slide-toggle [(ngModel)]="enhanceOptions.fixGrammar">
                      Fix Grammar
                    </mat-slide-toggle>
                    <mat-slide-toggle [(ngModel)]="enhanceOptions.addExamples">
                      Add Examples
                    </mat-slide-toggle>
                    <mat-slide-toggle [(ngModel)]="enhanceOptions.addHeadings">
                      Add Headings
                    </mat-slide-toggle>
                    <mat-slide-toggle [(ngModel)]="enhanceOptions.shortenContent">
                      Shorten Content
                    </mat-slide-toggle>
                    <mat-slide-toggle [(ngModel)]="enhanceOptions.expandContent">
                      Expand Content
                    </mat-slide-toggle>
                  </div>
                </div>

                <div class="tone-section">
                  <h4>Tone</h4>
                  <mat-chip-listbox [(ngModel)]="selectedTone" class="tone-chips">
                    @for (tone of tones; track tone.id) {
                      <mat-chip-option [value]="tone.id" [matTooltip]="tone.description">
                        {{ tone.name }}
                      </mat-chip-option>
                    }
                  </mat-chip-listbox>
                </div>

                <button
                  mat-flat-button
                  class="action-btn"
                  (click)="enhanceContentFn()"
                  [disabled]="!enhanceContent || isEnhancing()"
                >
                  @if (isEnhancing()) {
                    <mat-spinner diameter="20"></mat-spinner>
                    Enhancing...
                  } @else {
                    <mat-icon>auto_fix_high</mat-icon>
                    Enhance Content
                  }
                </button>
              </div>

              @if (enhancedResult()) {
                <div class="result-section">
                  <h3>Enhanced Content</h3>
                  <div class="stats-bar">
                    <span class="stat">
                      <mat-icon>text_fields</mat-icon>
                      {{ enhancedResult()!.stats.originalLength }} →
                      {{ enhancedResult()!.stats.enhancedLength }} chars
                    </span>
                    <span class="stat">
                      <mat-icon>speed</mat-icon>
                      Readability: {{ enhancedResult()!.stats.readabilityScore }}%
                    </span>
                  </div>
                  <div class="result-content">
                    <pre>{{ enhancedResult()!.enhanced }}</pre>
                  </div>
                  @if (enhancedResult()!.changes.length > 0) {
                    <div class="changes-list">
                      <h4>Changes Made:</h4>
                      @for (change of enhancedResult()!.changes; track change.type) {
                        <div class="change-item">
                          <mat-icon>{{ getChangeIcon(change.type) }}</mat-icon>
                          {{ change.description }}
                        </div>
                      }
                    </div>
                  }
                  <button mat-stroked-button (click)="copyEnhanced()">
                    <mat-icon>content_copy</mat-icon> Copy
                  </button>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Summarize Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>short_text</mat-icon>
            <span>Summarize</span>
          </ng-template>

          <div class="tab-content">
            <div class="summarize-panel">
              <div class="input-section">
                <h3>Content to Summarize</h3>
                <textarea
                  [(ngModel)]="summarizeContent"
                  placeholder="Paste long content here..."
                  rows="8"
                ></textarea>

                <div class="summary-options">
                  <mat-form-field appearance="outline">
                    <mat-label>Summary Length</mat-label>
                    <mat-select [(ngModel)]="summaryLength">
                      <mat-option value="100">Short (~100 words)</mat-option>
                      <mat-option value="200">Medium (~200 words)</mat-option>
                      <mat-option value="500">Long (~500 words)</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <button
                  mat-flat-button
                  class="action-btn"
                  (click)="summarizeContentFn()"
                  [disabled]="!summarizeContent || isSummarizing()"
                >
                  @if (isSummarizing()) {
                    <mat-spinner diameter="20"></mat-spinner>
                    Summarizing...
                  } @else {
                    <mat-icon>short_text</mat-icon>
                    Summarize
                  }
                </button>
              </div>

              @if (summaryResult()) {
                <div class="result-section">
                  <h3>Summary</h3>
                  <div class="word-count-stats">
                    <div class="stat-card">
                      <span class="stat-value">{{ summaryResult()!.wordCount.original }}</span>
                      <span class="stat-label">Original Words</span>
                    </div>
                    <div class="stat-card">
                      <span class="stat-value">{{ summaryResult()!.wordCount.summary }}</span>
                      <span class="stat-label">Summary Words</span>
                    </div>
                    <div class="stat-card highlight">
                      <span class="stat-value">{{ summaryResult()!.wordCount.reduction }}%</span>
                      <span class="stat-label">Reduction</span>
                    </div>
                  </div>
                  <div class="result-content">
                    <pre>{{ summaryResult()!.summary }}</pre>
                  </div>
                  @if (summaryResult()!.keyPoints.length > 0) {
                    <div class="key-points">
                      <h4>Key Points:</h4>
                      <ul>
                        @for (point of summaryResult()!.keyPoints; track point) {
                          <li>{{ point }}</li>
                        }
                      </ul>
                    </div>
                  }
                  <button mat-stroked-button (click)="copySummary()">
                    <mat-icon>content_copy</mat-icon> Copy
                  </button>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Rewrite Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>edit</mat-icon>
            <span>Rewrite</span>
          </ng-template>

          <div class="tab-content">
            <div class="rewrite-panel">
              <div class="input-section">
                <h3>Content to Rewrite</h3>
                <textarea
                  [(ngModel)]="rewriteContent"
                  placeholder="Enter content to rewrite with a different tone..."
                  rows="8"
                ></textarea>

                <div class="rewrite-tone-section">
                  <h4>Select Target Tone</h4>
                  <div class="tone-cards">
                    @for (tone of tones; track tone.id) {
                      <div
                        class="tone-card"
                        [class.selected]="rewriteTone === tone.id"
                        (click)="rewriteTone = tone.id"
                      >
                        <mat-icon>{{ getToneIcon(tone.id) }}</mat-icon>
                        <span class="tone-name">{{ tone.name }}</span>
                        <span class="tone-desc">{{ tone.description }}</span>
                      </div>
                    }
                  </div>
                </div>

                <button
                  mat-flat-button
                  class="action-btn"
                  (click)="rewriteContentFn()"
                  [disabled]="!rewriteContent || !rewriteTone || isRewriting()"
                >
                  @if (isRewriting()) {
                    <mat-spinner diameter="20"></mat-spinner>
                    Rewriting...
                  } @else {
                    <mat-icon>edit</mat-icon>
                    Rewrite as {{ getToneName(rewriteTone) }}
                  }
                </button>
              </div>

              @if (rewriteResult()) {
                <div class="result-section">
                  <h3>
                    Rewritten Content <span class="tone-badge">{{ rewriteTone }}</span>
                  </h3>
                  <div class="result-content">
                    <pre>{{ rewriteResult()!.rewritten }}</pre>
                  </div>
                  <button mat-stroked-button (click)="copyRewritten()">
                    <mat-icon>content_copy</mat-icon> Copy
                  </button>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Translate Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>translate</mat-icon>
            <span>Translate</span>
          </ng-template>

          <div class="tab-content">
            <div class="translate-panel">
              <div class="input-section">
                <h3>Content to Translate</h3>
                <textarea
                  [(ngModel)]="translateContent"
                  placeholder="Enter content to translate..."
                  rows="6"
                ></textarea>

                <div class="translation-options">
                  <mat-form-field appearance="outline">
                    <mat-label>Source Language</mat-label>
                    <mat-select [(ngModel)]="sourceLanguage">
                      @for (lang of languages; track lang.code) {
                        <mat-option [value]="lang.code">{{ lang.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-icon class="arrow-icon">arrow_forward</mat-icon>

                  <mat-form-field appearance="outline">
                    <mat-label>Target Language</mat-label>
                    <mat-select [(ngModel)]="targetLanguage">
                      @for (lang of languages; track lang.code) {
                        <mat-option [value]="lang.code">{{ lang.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <button
                  mat-flat-button
                  class="action-btn"
                  (click)="translateContentFn()"
                  [disabled]="
                    !translateContent || !sourceLanguage || !targetLanguage || isTranslating()
                  "
                >
                  @if (isTranslating()) {
                    <mat-spinner diameter="20"></mat-spinner>
                    Translating...
                  } @else {
                    <mat-icon>translate</mat-icon>
                    Translate
                  }
                </button>
              </div>

              @if (translationResult()) {
                <div class="result-section">
                  <h3>
                    Translation ({{ getLanguageName(sourceLanguage) }} →
                    {{ getLanguageName(targetLanguage) }})
                  </h3>
                  <div class="result-content">
                    <pre>{{ translationResult()!.translated }}</pre>
                  </div>
                  <button mat-stroked-button (click)="copyTranslation()">
                    <mat-icon>content_copy</mat-icon> Copy
                  </button>
                </div>
              }
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .content-tools {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .tools-header {
        margin-bottom: 24px;

        h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 8px;
          font-size: 24px;
          color: #ffffff;

          mat-icon {
            color: #e94560;
          }
        }

        p {
          margin: 0;
          color: #a0a0b8;
          font-size: 14px;
        }
      }

      .tools-tabs {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;

        ::ng-deep {
          .mat-mdc-tab-labels {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 4px;
          }

          .mat-mdc-tab {
            min-width: 120px;
          }
        }
      }

      .tab-content {
        padding: 20px 0;
      }

      .enhance-panel,
      .summarize-panel,
      .rewrite-panel,
      .translate-panel {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }

      .input-section,
      .result-section {
        h3 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #ffffff;
        }
      }

      textarea {
        width: 100%;
        padding: 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #ffffff;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        min-height: 150px;

        &:focus {
          outline: none;
          border-color: #e94560;
        }

        &::placeholder {
          color: #666;
        }
      }

      .enhance-options,
      .summary-options,
      .rewrite-tone-section,
      .translation-options {
        margin: 20px 0;

        h4 {
          margin: 0 0 12px;
          font-size: 14px;
          color: #a0a0b8;
        }
      }

      .options-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        mat-slide-toggle {
          margin-bottom: 8px;
        }
      }

      .tone-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tone-cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .tone-card {
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 2px solid transparent;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;

        &:hover {
          border-color: rgba(233, 69, 96, 0.3);
        }

        &.selected {
          border-color: #e94560;
          background: rgba(233, 69, 96, 0.1);
        }

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          color: #e94560;
          margin-bottom: 8px;
        }

        .tone-name {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .tone-desc {
          display: block;
          font-size: 11px;
          color: #666;
        }
      }

      .translation-options {
        display: flex;
        align-items: center;
        gap: 16px;

        mat-form-field {
          flex: 1;
        }

        .arrow-icon {
          color: #e94560;
        }
      }

      .action-btn {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        color: white;
        font-size: 14px;
        font-weight: 600;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
        margin-top: 16px;

        &:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        mat-spinner {
          margin-right: 8px;
        }
      }

      .result-section {
        .stats-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;

          .stat {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #a0a0b8;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
              color: #00d9a5;
            }
          }
        }
      }

      .result-content {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;

        pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-size: 13px;
          color: #ffffff;
          font-family: inherit;
        }
      }

      .changes-list {
        margin-top: 16px;

        h4 {
          margin: 0 0 12px;
          font-size: 13px;
          color: #a0a0b8;
        }

        .change-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(0, 217, 165, 0.1);
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 12px;
          color: #00d9a5;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }

      .key-points {
        margin-top: 16px;

        h4 {
          margin: 0 0 12px;
          font-size: 13px;
          color: #a0a0b8;
        }

        ul {
          margin: 0;
          padding-left: 20px;

          li {
            padding: 6px 0;
            font-size: 13px;
            color: #ffffff;
          }
        }
      }

      .word-count-stats {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;

        .stat-card {
          flex: 1;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          text-align: center;

          &.highlight {
            background: rgba(0, 217, 165, 0.1);
          }

          .stat-value {
            display: block;
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
          }

          .stat-label {
            display: block;
            font-size: 11px;
            color: #666;
            margin-top: 4px;
          }
        }
      }

      .tone-badge {
        background: rgba(233, 69, 96, 0.2);
        color: #e94560;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        margin-left: 8px;
      }

      button[mat-stroked-button] {
        margin-top: 16px;
        color: #e94560;
        border-color: #e94560;
      }

      @media (max-width: 900px) {
        .enhance-panel,
        .summarize-panel,
        .rewrite-panel,
        .translate-panel {
          grid-template-columns: 1fr;
        }

        .tone-cards {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class ContentToolsComponent {
  tones = TONES;
  languages = SUPPORTED_LANGUAGES;

  enhanceContent = '';
  summarizeContent = '';
  rewriteContent = '';
  translateContent = '';

  enhanceOptions: EnhancementOptions = {
    improveReadability: true,
    addHeadings: true,
  };

  selectedTone = 'professional';
  rewriteTone = 'professional';
  summaryLength = '200';
  sourceLanguage = 'en';
  targetLanguage = 'es';

  isEnhancing = signal(false);
  isSummarizing = signal(false);
  isRewriting = signal(false);
  isTranslating = signal(false);

  enhancedResult = signal<any>(null);
  summaryResult = signal<any>(null);
  rewriteResult = signal<any>(null);
  translationResult = signal<any>(null);

  constructor(
    private contentEnhancement: ContentEnhancementService,
    private cache: CacheService,
    private snackBar: MatSnackBar,
  ) {}

  enhanceContentFn(): void {
    if (!this.enhanceContent) return;

    const cacheKey = this.cache.generateContentKey(
      'enhance_' + this.enhanceContent.substring(0, 50),
      'en',
    );

    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.enhancedResult.set(cached);
      this.snackBar.open('Loaded from cache', 'Close', { duration: 2000 });
      return;
    }

    this.isEnhancing.set(true);

    let options: EnhancementOptions = { ...this.enhanceOptions };
    if (this.selectedTone === 'professional') options.professionalTone = true;
    if (this.selectedTone === 'friendly') options.friendlyTone = true;
    if (this.selectedTone === 'technical') options.technicalTone = true;
    if (this.selectedTone === 'simple') options.simplifyLanguage = true;

    this.contentEnhancement.enhanceContent(this.enhanceContent, options).subscribe({
      next: (result) => {
        this.enhancedResult.set(result);
        this.cache.set(cacheKey, result);
        this.isEnhancing.set(false);
      },
      error: () => {
        this.isEnhancing.set(false);
        this.snackBar.open('Enhancement failed', 'Close', { duration: 2000 });
      },
    });
  }

  summarizeContentFn(): void {
    if (!this.summarizeContent) return;

    this.isSummarizing.set(true);

    this.contentEnhancement
      .summarizeContent(this.summarizeContent, parseInt(this.summaryLength))
      .subscribe({
        next: (result) => {
          this.summaryResult.set(result);
          this.isSummarizing.set(false);
        },
        error: () => {
          this.isSummarizing.set(false);
          this.snackBar.open('Summarization failed', 'Close', { duration: 2000 });
        },
      });
  }

  rewriteContentFn(): void {
    if (!this.rewriteContent || !this.rewriteTone) return;

    this.isRewriting.set(true);

    this.contentEnhancement.rewriteContent(this.rewriteContent, this.rewriteTone).subscribe({
      next: (result) => {
        this.rewriteResult.set(result);
        this.isRewriting.set(false);
      },
      error: () => {
        this.isRewriting.set(false);
        this.snackBar.open('Rewrite failed', 'Close', { duration: 2000 });
      },
    });
  }

  translateContentFn(): void {
    if (!this.translateContent || !this.sourceLanguage || !this.targetLanguage) return;

    this.isTranslating.set(true);

    this.contentEnhancement
      .translateContent(this.translateContent, this.sourceLanguage, this.targetLanguage)
      .subscribe({
        next: (result) => {
          this.translationResult.set(result);
          this.isTranslating.set(false);
        },
        error: () => {
          this.isTranslating.set(false);
          this.snackBar.open('Translation failed', 'Close', { duration: 2000 });
        },
      });
  }

  copyEnhanced(): void {
    navigator.clipboard.writeText(this.enhancedResult()?.enhanced || '');
    this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
  }

  copySummary(): void {
    navigator.clipboard.writeText(this.summaryResult()?.summary || '');
    this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
  }

  copyRewritten(): void {
    navigator.clipboard.writeText(this.rewriteResult()?.rewritten || '');
    this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
  }

  copyTranslation(): void {
    navigator.clipboard.writeText(this.translationResult()?.translated || '');
    this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
  }

  getChangeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      length: 'compare_arrows',
      structure: 'segment',
      emphasis: 'format_bold',
      general: 'check_circle',
      enhancement: 'auto_fix_high',
    };
    return icons[type] || 'info';
  }

  getToneIcon(toneId: string): string {
    const icons: { [key: string]: string } = {
      professional: 'business',
      friendly: 'mood',
      technical: 'engineering',
      simple: 'school',
      persuasive: 'campaign',
      educational: 'psychology',
      humorous: 'mood',
      urgent: 'priority_high',
    };
    return icons[toneId] || 'chat';
  }

  getToneName(toneId: string): string {
    const tone = this.tones.find((t) => t.id === toneId);
    return tone?.name || toneId;
  }

  getLanguageName(code: string): string {
    const lang = this.languages.find((l) => l.code === code);
    return lang?.name || code;
  }
}
