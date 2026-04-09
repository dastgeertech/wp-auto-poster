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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WordPressService } from '../../core/services/wordpress.service';
import { ContentGeneratorService } from '../../core/services/content-generator.service';
import { ImageService } from '../../core/services/image.service';
import { SchedulerService } from '../../core/services/scheduler.service';
import { ExportImportService } from '../../core/services/export-import.service';
import { CacheService } from '../../core/services/cache.service';
import { AppSettings } from '../../core/models';

@Component({
  selector: 'app-settings',
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
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="settings">
      <div class="settings-grid">
        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon wordpress">
              <mat-icon>language</mat-icon>
            </div>
            <div class="section-info">
              <h3>WordPress Connection</h3>
              <p>Connect to your WordPress website</p>
            </div>
          </div>

          <div class="section-content">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>WordPress API URL</mat-label>
              <input
                matInput
                [(ngModel)]="settings.wordpress.apiUrl"
                placeholder="https://yourwebsite.com"
              />
              <mat-hint>Your WordPress site URL (without trailing slash)</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput [(ngModel)]="settings.wordpress.username" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Application Password</mat-label>
              <input matInput [(ngModel)]="settings.wordpress.appPassword" type="password" />
              <mat-hint>Generate from WordPress User Profile → Security</mat-hint>
            </mat-form-field>

            <div class="connection-test">
              <button
                mat-flat-button
                class="test-btn"
                (click)="testWordPressConnection()"
                [disabled]="testingWp()"
              >
                @if (testingWp()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>wifi_tethering</mat-icon>
                }
                Test Connection
              </button>
              @if (wpStatus()) {
                <span class="status" [class]="wpStatus()">
                  {{ wpStatus() === 'success' ? 'Connected!' : 'Failed' }}
                </span>
              }
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon ai">
              <mat-icon>psychology</mat-icon>
            </div>
            <div class="section-info">
              <h3>AI Configuration</h3>
              <p>Generate human-like articles automatically</p>
            </div>
          </div>

          <div class="section-content">
            <div class="info-box" style="background: #1a3a5c; border-color: #4285f4;">
              <mat-icon style="color: #4285f4;">auto_awesome</mat-icon>
              <p>
                <strong style="color: #4285f4;">Google Gemini - Recommended!</strong><br />
                Uses <strong>Gemini 2.0 Flash</strong> which has the best free tier.<br />
                Get your API key from <strong>aistudio.google.com</strong>
              </p>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Gemini API Key (Gemini 2.0 Flash)</mat-label>
              <input
                matInput
                [(ngModel)]="settings.ai.geminiApiKey"
                type="password"
                placeholder="AIza..."
              />
              <mat-hint>Get key from aistudio.google.com/app/apikey</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Groq API Key (FREE - Backup)</mat-label>
              <input
                matInput
                [(ngModel)]="settings.ai.groqApiKey"
                type="password"
                placeholder="gsk_..."
              />
              <mat-hint>Get free key from console.groq.com</mat-hint>
            </mat-form-field>

            <div class="info-box">
              <mat-icon>info</mat-icon>
              <p>
                <strong>Priority: Gemini → Groq (FREE) → Built-in Generator</strong><br />
                Gemini 2.0 Flash has generous free tier. Groq is backup option.
              </p>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Groq API Key (FREE - Llama 3.3 70B)</mat-label>
              <input
                matInput
                [(ngModel)]="settings.ai.groqApiKey"
                type="password"
                placeholder="gsk_..."
              />
              <mat-hint>Get free key from console.groq.com</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Grok API Key (xAI - Optional)</mat-label>
              <input
                matInput
                [(ngModel)]="settings.ai.openaiApiKey"
                type="password"
                placeholder="xai-..."
              />
              <mat-hint>Get key from console.x.ai (paid)</mat-hint>
            </mat-form-field>

            <div class="info-box">
              <mat-icon>info</mat-icon>
              <p>
                <strong>Priority: Groq (FREE) → Grok → Built-in Generator</strong><br />
                Groq is recommended - fast, free, and capable. If no key is provided, the built-in
                generator will be used.
              </p>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Default Tone</mat-label>
                <mat-select [(ngModel)]="settings.ai.defaultTone">
                  <mat-option value="professional">Professional</mat-option>
                  <mat-option value="casual">Casual</mat-option>
                  <mat-option value="educational">Educational</mat-option>
                  <mat-option value="persuasive">Persuasive</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Default Word Count</mat-label>
                <mat-select [(ngModel)]="settings.ai.defaultWordCount">
                  <mat-option [value]="500">500 words</mat-option>
                  <mat-option [value]="800">800 words</mat-option>
                  <mat-option [value]="1000">1000 words</mat-option>
                  <mat-option [value]="1500">1500 words</mat-option>
                  <mat-option [value]="2000">2000 words</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon images">
              <mat-icon>image</mat-icon>
            </div>
            <div class="section-info">
              <h3>Google Images API</h3>
              <p>Search and get images from Google</p>
            </div>
          </div>

          <div class="section-content">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Google API Key</mat-label>
              <input
                matInput
                [(ngModel)]="settings.images.googleApiKey"
                type="password"
                placeholder="AIza..."
              />
              <mat-hint>Get from console.cloud.google.com</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Search Engine ID (CX)</mat-label>
              <input
                matInput
                [(ngModel)]="settings.images.googleCx"
                placeholder="xxxxxxxxxx:xxxxx"
              />
              <mat-hint>Get from programatichsearch.google.com</mat-hint>
            </mat-form-field>

            <div class="info-box">
              <mat-icon>info</mat-icon>
              <p>
                <strong>Setup Instructions:</strong><br />
                1. Go to <strong>console.cloud.google.com</strong><br />
                2. Create project → Enable "Custom Search API"<br />
                3. Create API Key from Credentials<br />
                4. Go to <strong>programatichsearch.google.com</strong><br />
                5. Create Search Engine → Get CX ID<br />
                6. Enter both values above
              </p>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon scheduling">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="section-info">
              <h3>Scheduling</h3>
              <p>Configure automatic posting schedule</p>
            </div>
          </div>

          <div class="section-content">
            <div class="toggle-row">
              <mat-slide-toggle [(ngModel)]="settings.scheduling.enableAutoPost">
                Enable Auto-Posting
              </mat-slide-toggle>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Default Post Time</mat-label>
              <input matInput type="time" [(ngModel)]="settings.scheduling.defaultPostTime" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Timezone</mat-label>
              <mat-select [(ngModel)]="settings.scheduling.timezone">
                <mat-option value="UTC">UTC</mat-option>
                <mat-option value="America/New_York">Eastern Time</mat-option>
                <mat-option value="America/Chicago">Central Time</mat-option>
                <mat-option value="America/Denver">Mountain Time</mat-option>
                <mat-option value="America/Los_Angeles">Pacific Time</mat-option>
                <mat-option value="Europe/London">London</mat-option>
                <mat-option value="Europe/Paris">Paris</mat-option>
                <mat-option value="Asia/Tokyo">Tokyo</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon seo">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="section-info">
              <h3>SEO Settings</h3>
              <p>Configure default SEO parameters</p>
            </div>
          </div>

          <div class="section-content">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Target SEO Score</mat-label>
              <input
                matInput
                type="number"
                [(ngModel)]="settings.seo.targetScore"
                min="0"
                max="100"
              />
              <mat-hint>Minimum score to auto-publish</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Default Category</mat-label>
              <mat-select [(ngModel)]="settings.seo.defaultCategory">
                @for (category of categories(); track category.id) {
                  <mat-option [value]="category.id">{{ category.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <!-- Export/Import Section -->
        <div class="settings-section">
          <div class="section-header">
            <div class="section-icon export">
              <mat-icon>download</mat-icon>
            </div>
            <div class="section-info">
              <h3>Export / Import</h3>
              <p>Backup and restore your data</p>
            </div>
          </div>

          <div class="section-content">
            <div class="storage-info">
              <h4>Storage Usage</h4>
              <div class="storage-bars">
                @for (item of storageItems(); track item.key) {
                  <div class="storage-row">
                    <span class="storage-key">{{ item.key }}</span>
                    <div class="storage-bar-wrapper">
                      <div class="storage-bar"></div>
                    </div>
                    <span class="storage-size">{{ item.size }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="export-import-actions">
              <div class="action-group">
                <h4>Export Data</h4>
                <div class="btn-group">
                  <button mat-stroked-button (click)="exportSettings()">
                    <mat-icon>settings</mat-icon> Settings Only
                  </button>
                  <button mat-stroked-button (click)="exportQueue()">
                    <mat-icon>queue</mat-icon> Queue Only
                  </button>
                  <button mat-flat-button class="export-btn" (click)="exportAll()">
                    <mat-icon>download</mat-icon> Export All
                  </button>
                </div>
              </div>

              <div class="action-group">
                <h4>Import Data</h4>
                <div
                  class="import-area"
                  (dragover)="onDragOver($event)"
                  (drop)="onDrop($event)"
                  (click)="fileInput.click()"
                >
                  <input
                    #fileInput
                    type="file"
                    accept=".json"
                    style="display: none"
                    (change)="onFileSelected($event)"
                  />
                  <mat-icon>cloud_upload</mat-icon>
                  <p>Drag and drop a JSON file here or click to browse</p>
                </div>
                @if (importing()) {
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                }
              </div>

              <div class="action-group danger">
                <h4>Danger Zone</h4>
                <button mat-stroked-button class="danger-btn" (click)="clearAllData()">
                  <mat-icon>delete_forever</mat-icon> Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="save-actions">
        <button mat-stroked-button (click)="resetSettings()">Reset to Defaults</button>
        <button mat-flat-button class="save-btn" (click)="saveSettings()">
          <mat-icon>save</mat-icon>
          Save Settings
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .settings {
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

      .settings-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 24px;
      }

      .settings-section {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        border: 1px solid rgba(233, 69, 96, 0.1);
        overflow: hidden;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .section-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          color: white;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        &.wordpress {
          background: linear-gradient(135deg, #21759b 0%, #0088cc 100%);
        }

        &.ai {
          background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
        }

        &.images {
          background: linear-gradient(135deg, #00d9a5 0%, #00b894 100%);
        }

        &.scheduling {
          background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
        }

        &.seo {
          background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        }
      }

      .section-info {
        h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 4px;
        }

        p {
          font-size: 13px;
          color: #a0a0b8;
          margin: 0;
        }
      }

      .section-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .full-width {
        width: 100%;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .toggle-row {
        padding: 8px 0;
      }

      .connection-test {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .test-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        color: white;
        border: none;
      }

      .status {
        font-size: 13px;
        font-weight: 500;

        &.success {
          color: #00d9a5;
        }

        &.error {
          color: #ff6b6b;
        }
      }

      .save-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        border: 1px solid rgba(233, 69, 96, 0.1);
      }

      .save-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #00d9a5 0%, #00b894 100%);
        color: white;
        border: none;
      }

      .info-box {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        background: rgba(108, 92, 231, 0.1);
        border: 1px solid rgba(108, 92, 231, 0.2);
        border-radius: 8px;

        mat-icon {
          color: #a29bfe;
          flex-shrink: 0;
        }

        p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #a0a0b8;

          strong {
            color: #ffffff;
          }
        }
      }

      /* Export/Import Styles */
      .section-icon.export {
        background: linear-gradient(135deg, #9c27b0, #ba68c8);
      }

      .storage-info {
        margin-bottom: 16px;

        h4 {
          margin: 0 0 12px;
          font-size: 13px;
          color: #a0a0b8;
        }
      }

      .storage-bars {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .storage-row {
        display: flex;
        align-items: center;
        gap: 12px;

        .storage-key {
          width: 120px;
          font-size: 12px;
          color: #ffffff;
        }

        .storage-bar-wrapper {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;

          .storage-bar {
            height: 100%;
            width: 30%;
            background: linear-gradient(90deg, #9c27b0, #ba68c8);
            border-radius: 3px;
          }
        }

        .storage-size {
          width: 60px;
          font-size: 11px;
          color: #666;
          text-align: right;
        }
      }

      .export-import-actions {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .action-group {
        h4 {
          margin: 0 0 12px;
          font-size: 13px;
          color: #a0a0b8;
        }

        &.danger {
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);

          h4 {
            color: #ff6b6b;
          }
        }
      }

      .btn-group {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;

        button {
          color: #e94560;
          border-color: #e94560;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }

        .export-btn {
          background: linear-gradient(135deg, #9c27b0, #ba68c8);
          color: white;
          border: none;

          &:hover {
            opacity: 0.9;
          }
        }
      }

      .import-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        border: 2px dashed rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #9c27b0;
          background: rgba(156, 39, 176, 0.1);
        }

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #9c27b0;
          margin-bottom: 12px;
        }

        p {
          margin: 0;
          font-size: 13px;
          color: #666;
          text-align: center;
        }
      }

      .danger-btn {
        color: #ff6b6b;
        border-color: #ff6b6b;

        mat-icon {
          color: #ff6b6b;
        }
      }

      @media (max-width: 1024px) {
        .settings-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  settings: AppSettings = {
    wordpress: {
      apiUrl: '',
      username: '',
      appPassword: '',
      siteName: '',
      siteDescription: '',
      siteLogo: '',
    },
    ai: {
      openaiApiKey: '',
      groqApiKey: '',
      geminiApiKey: '',
      defaultTone: 'professional',
      defaultWordCount: 1500,
    },
    images: {
      provider: 'google',
      googleApiKey: '',
      googleCx: '',
      unsplashApiKey: '',
      pexelsApiKey: '',
      pixabayApiKey: '',
      bingApiKey: '',
    },
    scheduling: {
      defaultPostTime: '09:00',
      timezone: 'UTC',
      enableAutoPost: false,
    },
    seo: {
      targetScore: 80,
      defaultCategory: 0,
      defaultTags: [],
    },
    website: {
      siteUrl: 'https://dastgeertech.studio',
      siteName: 'Dastgeer Tech',
      tagline: '',
      description: '',
      author: 'Dastgeer Tech Editorial Team',
      publisher: 'Dastgeer Tech',
      logoUrl: '',
      faviconUrl: '',
      social: {
        twitter: '',
        facebook: '',
        instagram: '',
        linkedin: '',
        youtube: '',
      },
    },
    google: {
      searchConsoleVerified: false,
      analyticsId: '',
      adsenseId: '',
      newsPublicationName: 'Dastgeer Tech',
    },
  };

  categories = signal<{ id: number; name: string }[]>([]);
  testingWp = signal(false);
  wpStatus = signal<'success' | 'error' | ''>('');
  storageItems = signal<{ key: string; size: string }[]>([]);
  importing = signal(false);

  constructor(
    private wordpressService: WordPressService,
    private contentGenerator: ContentGeneratorService,
    private imageService: ImageService,
    private exportImportService: ExportImportService,
    private cacheService: CacheService,
    private schedulerService: SchedulerService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const savedSettings = this.wordpressService.getSettings();
    if (savedSettings) {
      this.settings = { ...this.settings, ...savedSettings };
    }

    this.wordpressService.categories$.subscribe((cats) => {
      this.categories.set(cats);
    });

    this.loadStorageInfo();
  }

  loadStorageInfo(): void {
    const items = this.exportImportService.getStorageSize();
    this.storageItems.set(items);
  }

  exportSettings(): void {
    const data = this.exportImportService.exportSettings();
    this.exportImportService.downloadExport(data, 'wp-autoposter-settings.json');
    this.snackBar.open('Settings exported!', 'Close', { duration: 2000 });
  }

  exportQueue(): void {
    const data = this.exportImportService.exportQueue();
    this.exportImportService.downloadExport(data, 'wp-autoposter-queue.json');
    this.snackBar.open('Queue exported!', 'Close', { duration: 2000 });
  }

  exportAll(): void {
    const data = this.exportImportService.exportAll();
    this.exportImportService.downloadExport(data, 'wp-autoposter-backup.json');
    this.snackBar.open('All data exported!', 'Close', { duration: 2000 });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.importing.set(true);

    try {
      const data = await this.exportImportService.readFile(file);
      const result = this.exportImportService.importData(data);

      if (result.success) {
        this.snackBar.open(`Imported ${result.imported} items successfully!`, 'Close', {
          duration: 3000,
        });
        this.loadStorageInfo();
      } else {
        this.snackBar.open(`Import failed: ${result.errors.join(', ')}`, 'Close', {
          duration: 5000,
        });
      }
    } catch (e: any) {
      this.snackBar.open(`Import failed: ${e.message}`, 'Close', { duration: 5000 });
    } finally {
      this.importing.set(false);
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.json')) {
      this.handleImportFile(file);
    }
  }

  private async handleImportFile(file: File): Promise<void> {
    this.importing.set(true);

    try {
      const data = await this.exportImportService.readFile(file);
      const result = this.exportImportService.importData(data);

      if (result.success) {
        this.snackBar.open(`Imported ${result.imported} items successfully!`, 'Close', {
          duration: 3000,
        });
        this.loadStorageInfo();
      } else {
        this.snackBar.open(`Import failed: ${result.errors.join(', ')}`, 'Close', {
          duration: 5000,
        });
      }
    } catch (e: any) {
      this.snackBar.open(`Import failed: ${e.message}`, 'Close', { duration: 5000 });
    } finally {
      this.importing.set(false);
    }
  }

  clearAllData(): void {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      this.exportImportService.clearAllData();
      this.cacheService.clear();
      this.loadStorageInfo();
      this.snackBar.open('All data cleared!', 'Close', { duration: 3000 });
    }
  }

  testWordPressConnection(): void {
    this.testingWp.set(true);
    this.wpStatus.set('');

    this.wordpressService.saveSettings(this.settings);
    this.wordpressService.testConnection().subscribe({
      next: (connected) => {
        this.testingWp.set(false);
        this.wpStatus.set(connected ? 'success' : 'error');
      },
      error: () => {
        this.testingWp.set(false);
        this.wpStatus.set('error');
      },
    });
  }

  saveSettings(): void {
    this.wordpressService.saveSettings(this.settings);

    // Update all AI API keys (auto-detects key type by prefix)
    if (this.settings.ai.geminiApiKey) {
      this.contentGenerator.updateApiKey(this.settings.ai.geminiApiKey);
    }
    if (this.settings.ai.groqApiKey) {
      this.contentGenerator.updateApiKey(this.settings.ai.groqApiKey);
    }
    if (this.settings.ai.openaiApiKey) {
      this.contentGenerator.updateApiKey(this.settings.ai.openaiApiKey);
    }

    this.imageService.updateSettings(
      this.settings.images.googleApiKey,
      this.settings.images.googleCx,
    );
    this.schedulerService.updateSettings(
      this.settings.scheduling.defaultPostTime,
      this.settings.scheduling.timezone,
      this.settings.scheduling.enableAutoPost,
    );

    this.snackBar.open('Settings saved successfully!', 'Close', { duration: 3000 });
  }

  resetSettings(): void {
    this.settings = {
      wordpress: {
        apiUrl: '',
        username: '',
        appPassword: '',
        siteName: '',
        siteDescription: '',
        siteLogo: '',
      },
      ai: {
        openaiApiKey: '',
        groqApiKey: '',
        geminiApiKey: '',
        defaultTone: 'professional',
        defaultWordCount: 1500,
      },
      images: {
        provider: 'google',
        googleApiKey: '',
        googleCx: '',
        unsplashApiKey: '',
        pexelsApiKey: '',
        pixabayApiKey: '',
        bingApiKey: '',
      },
      scheduling: {
        defaultPostTime: '09:00',
        timezone: 'UTC',
        enableAutoPost: false,
      },
      seo: {
        targetScore: 80,
        defaultCategory: 0,
        defaultTags: [],
      },
      website: {
        siteUrl: 'https://dastgeertech.studio',
        siteName: 'Dastgeer Tech',
        tagline: '',
        description: '',
        author: 'Dastgeer Tech Editorial Team',
        publisher: 'Dastgeer Tech',
        logoUrl: '',
        faviconUrl: '',
        social: {
          twitter: '',
          facebook: '',
          instagram: '',
          linkedin: '',
          youtube: '',
        },
      },
      google: {
        searchConsoleVerified: false,
        analyticsId: '',
        adsenseId: '',
        newsPublicationName: 'Dastgeer Tech',
      },
    };
    this.snackBar.open('Settings reset to defaults', 'Close', { duration: 2000 });
  }
}
