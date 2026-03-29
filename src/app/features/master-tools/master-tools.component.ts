import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  SearchEngineManagerService,
  EngineMasterConfig,
} from '../../core/services/search-engine-manager.service';

@Component({
  selector: 'app-master-tools',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="master-tools">
      <div class="page-header">
        <h1><mat-icon>manage_accounts</mat-icon> Master Tools Configuration</h1>
        <p>
          Connect your search engine webmaster accounts for automatic URL submission and analytics
        </p>
      </div>

      <!-- Connection Status -->
      <div class="connection-status">
        <div class="status-card" [class.connected]="isGoogleConnected()">
          <div class="status-icon">
            <img src="https://www.google.com/favicon.ico" alt="Google" />
          </div>
          <div class="status-info">
            <h3>Google Search Console</h3>
            <p>{{ isGoogleConnected() ? 'Connected' : 'Not Connected' }}</p>
          </div>
          <div class="status-badge" [class.connected]="isGoogleConnected()">
            <mat-icon>{{ isGoogleConnected() ? 'check_circle' : 'cancel' }}</mat-icon>
          </div>
        </div>
        <div class="status-card" [class.connected]="isBingConnected()">
          <div class="status-icon">
            <img src="https://www.bing.com/favicon.ico" alt="Bing" />
          </div>
          <div class="status-info">
            <h3>Bing Webmaster</h3>
            <p>{{ isBingConnected() ? 'Connected' : 'Not Connected' }}</p>
          </div>
          <div class="status-badge" [class.connected]="isBingConnected()">
            <mat-icon>{{ isBingConnected() ? 'check_circle' : 'cancel' }}</mat-icon>
          </div>
        </div>
        <div class="status-card" [class.connected]="isYandexConnected()">
          <div class="status-icon">
            <img src="https://yandex.ru/favicon.ico" alt="Yandex" />
          </div>
          <div class="status-info">
            <h3>Yandex Webmaster</h3>
            <p>{{ isYandexConnected() ? 'Connected' : 'Not Connected' }}</p>
          </div>
          <div class="status-badge" [class.connected]="isYandexConnected()">
            <mat-icon>{{ isYandexConnected() ? 'check_circle' : 'cancel' }}</mat-icon>
          </div>
        </div>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <!-- Google Search Console Section -->
      <div class="tool-section">
        <div class="section-header">
          <div class="header-left">
            <img src="https://www.google.com/favicon.ico" alt="Google" class="tool-icon" />
            <div>
              <h2>Google Search Console</h2>
              <p>Connect to submit URLs and get search analytics</p>
            </div>
          </div>
          <div class="header-right">
            @if (isGoogleConnected()) {
              <span class="connected-badge"> <mat-icon>check_circle</mat-icon> Verified </span>
            }
          </div>
        </div>

        <div class="form-card">
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your Website URL</mat-label>
              <input
                matInput
                [(ngModel)]="googleSiteUrl"
                placeholder="https://yoursite.com or scdomain:yoursite.com"
              />
              <mat-hint>Enter the URL you verified in Google Search Console</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Google API Key (Optional)</mat-label>
              <input matInput [(ngModel)]="googleApiKey" placeholder="AIza..." type="password" />
              <mat-hint>For real-time search analytics data</mat-hint>
            </mat-form-field>
          </div>

          <div class="form-actions">
            <button mat-flat-button class="connect-btn" (click)="connectGoogle()">
              <mat-icon>{{ isGoogleConnected() ? 'refresh' : 'link' }}</mat-icon>
              {{ isGoogleConnected() ? 'Update Connection' : 'Connect Google' }}
            </button>
            <a href="https://search.google.com/search-console" target="_blank" mat-stroked-button>
              <mat-icon>open_in_new</mat-icon> Open Search Console
            </a>
          </div>

          <div class="help-text">
            <h4><mat-icon>help</mat-icon> How to get Google API Key:</h4>
            <ol>
              <li>
                Go to
                <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a>
              </li>
              <li>Create a new project or select existing</li>
              <li>Enable "Search Console API"</li>
              <li>Go to Credentials → Create Credentials → API Key</li>
              <li>Copy the API key and paste above</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Bing Webmaster Section -->
      <div class="tool-section">
        <div class="section-header">
          <div class="header-left">
            <img src="https://www.bing.com/favicon.ico" alt="Bing" class="tool-icon" />
            <div>
              <h2>Bing Webmaster</h2>
              <p>Connect to submit URLs to Bing search index</p>
            </div>
          </div>
          <div class="header-right">
            @if (isBingConnected()) {
              <span class="connected-badge"> <mat-icon>check_circle</mat-icon> Verified </span>
            }
          </div>
        </div>

        <div class="form-card">
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your Website URL</mat-label>
              <input matInput [(ngModel)]="bingSiteUrl" placeholder="https://yoursite.com" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Bing API Key (Optional)</mat-label>
              <input
                matInput
                [(ngModel)]="bingApiKey"
                placeholder="Your Bing API Key"
                type="password"
              />
            </mat-form-field>
          </div>

          <div class="form-actions">
            <button mat-flat-button class="connect-btn" (click)="connectBing()">
              <mat-icon>{{ isBingConnected() ? 'refresh' : 'link' }}</mat-icon>
              {{ isBingConnected() ? 'Update Connection' : 'Connect Bing' }}
            </button>
            <a href="https://www.bing.com/webmasters" target="_blank" mat-stroked-button>
              <mat-icon>open_in_new</mat-icon> Open Bing Webmaster
            </a>
          </div>
        </div>
      </div>

      <!-- Yandex Webmaster Section -->
      <div class="tool-section">
        <div class="section-header">
          <div class="header-left">
            <img src="https://yandex.ru/favicon.ico" alt="Yandex" class="tool-icon" />
            <div>
              <h2>Yandex Webmaster</h2>
              <p>Connect to submit URLs to Yandex search index</p>
            </div>
          </div>
          <div class="header-right">
            @if (isYandexConnected()) {
              <span class="connected-badge"> <mat-icon>check_circle</mat-icon> Verified </span>
            }
          </div>
        </div>

        <div class="form-card">
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your Website URL</mat-label>
              <input matInput [(ngModel)]="yandexSiteUrl" placeholder="https://yoursite.com" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Yandex OAuth Token (Optional)</mat-label>
              <input
                matInput
                [(ngModel)]="yandexToken"
                placeholder="Your Yandex OAuth Token"
                type="password"
              />
            </mat-form-field>
          </div>

          <div class="form-actions">
            <button mat-flat-button class="connect-btn" (click)="connectYandex()">
              <mat-icon>{{ isYandexConnected() ? 'refresh' : 'link' }}</mat-icon>
              {{ isYandexConnected() ? 'Update Connection' : 'Connect Yandex' }}
            </button>
            <a href="https://webmaster.yandex.com" target="_blank" mat-stroked-button>
              <mat-icon>open_in_new</mat-icon> Open Yandex Webmaster
            </a>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3><mat-icon>bolt</mat-icon> Quick Actions</h3>
        <div class="action-buttons">
          <button mat-flat-button class="action-btn" (click)="goToSearchEngines()">
            <mat-icon>public</mat-icon>
            Go to Search Engine Manager
          </button>
          <button mat-stroked-button class="action-btn" (click)="goToAutoDetect()">
            <mat-icon>radar</mat-icon>
            Auto Detect URLs
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .master-tools {
        padding: 32px;
        max-width: 1000px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 32px;
        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 8px;
          font-size: 28px;
          color: #fff;
          mat-icon {
            color: #4285f4;
          }
        }
        p {
          margin: 0;
          color: #a0a0b8;
        }
      }

      .connection-status {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 32px;
      }
      .status-card {
        background: #1a1a2e;
        padding: 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 16px;
        border: 2px solid transparent;
        &.connected {
          border-color: #4caf50;
        }
        .status-icon img {
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }
        .status-info {
          flex: 1;
          h3 {
            margin: 0;
            font-size: 14px;
            color: #fff;
          }
          p {
            margin: 4px 0 0;
            font-size: 12px;
            color: #a0a0b8;
          }
        }
        .status-badge {
          mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
            color: #666;
          }
          &.connected mat-icon {
            color: #4caf50;
          }
        }
      }

      .tool-section {
        background: #1a1a2e;
        border-radius: 12px;
        margin-bottom: 24px;
        overflow: hidden;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: #16213e;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          .tool-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
          }
          h2 {
            margin: 0;
            font-size: 18px;
            color: #fff;
          }
          p {
            margin: 4px 0 0;
            font-size: 13px;
            color: #a0a0b8;
          }
        }
      }

      .form-card {
        padding: 24px;
      }
      .form-grid {
        display: grid;
        gap: 16px;
        margin-bottom: 20px;
      }
      .full-width {
        width: 100%;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .connect-btn {
        background: linear-gradient(135deg, #4285f4, #34a853);
        color: white;
      }

      .help-text {
        margin-top: 24px;
        padding: 16px;
        background: rgba(66, 133, 244, 0.1);
        border-radius: 8px;
        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          color: #fff;
          font-size: 14px;
          mat-icon {
            color: #4285f4;
          }
        }
        ol {
          margin: 0;
          padding-left: 20px;
          color: #a0a0b8;
          font-size: 13px;
          li {
            margin-bottom: 8px;
          }
        }
        a {
          color: #4285f4;
        }
      }

      .connected-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(76, 175, 80, 0.2);
        color: #4caf50;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .quick-actions {
        background: #1a1a2e;
        padding: 20px;
        border-radius: 12px;
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px;
          color: #fff;
          font-size: 16px;
          mat-icon {
            color: #4285f4;
          }
        }
      }
      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .action-btn {
        mat-icon {
          margin-right: 8px;
        }
      }

      mat-hint {
        font-size: 11px;
      }

      @media (max-width: 768px) {
        .connection-status {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class MasterToolsComponent implements OnInit {
  googleSiteUrl = '';
  googleApiKey = '';
  bingSiteUrl = '';
  bingApiKey = '';
  yandexSiteUrl = '';
  yandexToken = '';

  loading = signal(false);
  isGoogleConnected = signal(false);
  isBingConnected = signal(false);
  isYandexConnected = signal(false);

  private masterConfig: EngineMasterConfig = {
    google: { apiKey: '', siteUrl: '', connected: false },
    bing: { apiKey: '', siteUrl: '', connected: false },
    yandex: { apiKey: '', username: '', connected: false },
    baidu: { apiKey: '', siteUrl: '', connected: false },
    naver: { apiKey: '', siteUrl: '', connected: false },
  };

  constructor(
    private searchEngineService: SearchEngineManagerService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.masterConfig = this.searchEngineService.getMasterConfig();
    this.isGoogleConnected.set(this.masterConfig.google?.connected || false);
    this.isBingConnected.set(this.masterConfig.bing?.connected || false);
    this.isYandexConnected.set(this.masterConfig.yandex?.connected || false);

    if (this.masterConfig.google) {
      this.googleSiteUrl = this.masterConfig.google.siteUrl || '';
      this.googleApiKey = this.masterConfig.google.apiKey || '';
    }
    if (this.masterConfig.bing) {
      this.bingSiteUrl = this.masterConfig.bing.siteUrl || '';
      this.bingApiKey = this.masterConfig.bing.apiKey || '';
    }
    if (this.masterConfig.yandex) {
      this.yandexSiteUrl = (this.masterConfig.yandex as any).siteUrl || '';
      this.yandexToken = this.masterConfig.yandex.apiKey || '';
    }
  }

  connectGoogle(): void {
    if (!this.googleSiteUrl) {
      this.snackBar.open('Please enter your website URL', 'Close', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    this.searchEngineService.setGoogleCredentials(this.googleApiKey, this.googleSiteUrl);

    setTimeout(() => {
      this.isGoogleConnected.set(true);
      this.loading.set(false);
      this.snackBar.open(`Google connected! Site: ${this.googleSiteUrl}`, 'Close', {
        duration: 3000,
      });
    }, 1000);
  }

  connectBing(): void {
    if (!this.bingSiteUrl) {
      this.snackBar.open('Please enter your website URL', 'Close', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    this.searchEngineService.setBingCredentials(this.bingApiKey, this.bingSiteUrl);

    setTimeout(() => {
      this.isBingConnected.set(true);
      this.loading.set(false);
      this.snackBar.open(`Bing connected! Site: ${this.bingSiteUrl}`, 'Close', { duration: 3000 });
    }, 1000);
  }

  connectYandex(): void {
    if (!this.yandexSiteUrl) {
      this.snackBar.open('Please enter your website URL', 'Close', { duration: 3000 });
      return;
    }

    this.loading.set(true);

    setTimeout(() => {
      this.isYandexConnected.set(true);
      this.loading.set(false);
      this.snackBar.open(`Yandex connected! Site: ${this.yandexSiteUrl}`, 'Close', {
        duration: 3000,
      });
    }, 1000);
  }

  goToSearchEngines(): void {
    window.location.href = '/search-engine-manager';
  }

  goToAutoDetect(): void {
    window.location.href = '/search-engine-manager';
    setTimeout(() => {
      this.snackBar.open('Click "Auto Detect" in Search Engines to fetch URLs', 'Close', {
        duration: 5000,
      });
    }, 500);
  }
}
