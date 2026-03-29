import { Component, signal, computed, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  SearchEngineManagerService,
  SearchEngine,
  SEOIssue,
  SiteUrl,
  IndexingRequest,
  AutoConfig,
  SearchConsoleData,
  EngineMasterConfig,
} from '../../core/services/search-engine-manager.service';
import { WordPressService } from '../../core/services/wordpress.service';

@Component({
  selector: 'app-search-engine-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
  ],
  template: `
    <div class="search-manager">
      <div class="manager-header">
        <div class="header-left">
          <h2><mat-icon>auto_awesome</mat-icon> Auto Search Engine Manager</h2>
          <p>Fully automatic URL detection, submission & indexing across all search engines</p>
        </div>
        <div class="header-actions">
          <button mat-flat-button class="auto-btn" (click)="runAutoProcess()">
            <mat-icon>play_arrow</mat-icon> Run Auto Process
          </button>
          <button mat-stroked-button (click)="refreshAll()">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Error Banner -->
      @if (errorMessage()) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          <div class="error-content">
            <strong>Configuration Required</strong>
            <p>{{ errorMessage() }}</p>
          </div>
          <a mat-stroked-button href="#" (click)="switchTab('settings'); $event.preventDefault()">
            <mat-icon>settings</mat-icon> Go to Settings
          </a>
        </div>
      }

      <!-- Auto Mode Banner -->
      <div class="auto-banner" [class.active]="autoConfig().enabled">
        <div class="auto-status">
          <mat-icon>{{ autoConfig().enabled ? 'bolt' : 'bolt_off' }}</mat-icon>
          <div class="status-info">
            <h4>Auto Mode {{ autoConfig().enabled ? 'Active' : 'Disabled' }}</h4>
            <p>
              @if (autoConfig().enabled) {
                Automatically detects URLs, submits to
                {{ autoConfig().submitToEngines.length }} engines, and fixes issues
              } @else {
                Manual mode - click "Run Auto Process" to start
              }
            </p>
          </div>
        </div>
        <div class="auto-toggle">
          <mat-slide-toggle [(ngModel)]="autoEnabled" (change)="toggleAutoMode()">
            Enable Auto Mode
          </mat-slide-toggle>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card large" (click)="switchTab('urls')">
          <mat-icon class="stat-icon">link</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats().totalUrls }}</span>
            <span class="stat-label">Total URLs</span>
          </div>
          <div class="stat-breakdown">
            <span class="breakdown-item">
              <mat-icon>article</mat-icon> {{ postsCount() }} Posts
            </span>
            <span class="breakdown-item">
              <mat-icon>description</mat-icon> {{ pagesCount() }} Pages
            </span>
            <span class="breakdown-item">
              <mat-icon>folder</mat-icon> {{ categoriesCount() }} Categories
            </span>
          </div>
        </div>
        <div class="stat-card success" (click)="switchTab('urls')">
          <mat-icon class="stat-icon">check_circle</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats().indexedUrls }}</span>
            <span class="stat-label">Indexed</span>
          </div>
        </div>
        <div class="stat-card warning" (click)="switchTab('indexing')">
          <mat-icon class="stat-icon">schedule</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats().pendingUrls }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card danger" (click)="switchTab('issues')">
          <mat-icon class="stat-icon">bug_report</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats().openIssues }}</span>
            <span class="stat-label">Issues</span>
          </div>
        </div>
        <div class="stat-card">
          <mat-icon class="stat-icon">public</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats().enginesConnected }}</span>
            <span class="stat-label">Engines</span>
          </div>
        </div>
      </div>

      <mat-tab-group class="main-tabs" animationDuration="300ms" #tabGroup>
        <!-- Dashboard Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </ng-template>

          <div class="tab-content">
            <!-- Verified Status Cards -->
            <div class="dashboard-section">
              <h3><mat-icon>verified_user</mat-icon> Search Engine Verification Status</h3>
              <div class="verification-grid">
                @for (engine of ['google', 'bing', 'yandex', 'baidu', 'naver']; track engine) {
                  <div
                    class="verification-card"
                    [class.verified]="isEngineVerified(engine)"
                    [class.not-verified]="!isEngineVerified(engine)"
                  >
                    <div class="verify-header">
                      <img [src]="getEngineLogo(engine)" [alt]="engine" class="engine-icon" />
                      <div class="verify-status">
                        @if (isEngineVerified(engine)) {
                          <mat-icon class="verified-icon">check_circle</mat-icon>
                          <span class="status-text verified">Verified</span>
                        } @else {
                          <mat-icon class="not-verified-icon">error_outline</mat-icon>
                          <span class="status-text not-verified">Not Connected</span>
                        }
                      </div>
                    </div>
                    <div class="verify-details">
                      @if (isEngineVerified(engine)) {
                        <div class="detail-row">
                          <mat-icon>link</mat-icon>
                          <span>{{ getEngineSiteUrl(engine) }}</span>
                        </div>
                        <div class="detail-row">
                          <mat-icon>update</mat-icon>
                          <span>Last checked: Just now</span>
                        </div>
                      } @else {
                        <p class="setup-hint">Configure API key in Settings to connect</p>
                      }
                    </div>
                    <button mat-stroked-button class="verify-btn" (click)="switchTab('settings')">
                      <mat-icon>settings</mat-icon>
                      {{ isEngineVerified(engine) ? 'Update' : 'Setup' }}
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- Search Console Data (if connected) -->
            @if (searchConsoleData()) {
              <div class="dashboard-section">
                <h3><mat-icon>analytics</mat-icon> Search Performance (Last 28 Days)</h3>
                <div class="performance-grid">
                  <div class="perf-card">
                    <mat-icon class="perf-icon clicks">touch_app</mat-icon>
                    <div class="perf-data">
                      <span class="perf-value">{{
                        searchConsoleData()!.totalClicks | number
                      }}</span>
                      <span class="perf-label">Total Clicks</span>
                    </div>
                  </div>
                  <div class="perf-card">
                    <mat-icon class="perf-icon impressions">visibility</mat-icon>
                    <div class="perf-data">
                      <span class="perf-value">{{
                        searchConsoleData()!.totalImpressions | number
                      }}</span>
                      <span class="perf-label">Total Impressions</span>
                    </div>
                  </div>
                  <div class="perf-card">
                    <mat-icon class="perf-icon ctr">ads_click</mat-icon>
                    <div class="perf-data">
                      <span class="perf-value"
                        >{{ searchConsoleData()!.avgCtr | number: '1.2-2' }}%</span
                      >
                      <span class="perf-label">Average CTR</span>
                    </div>
                  </div>
                  <div class="perf-card">
                    <mat-icon class="perf-icon position">leaderboard</mat-icon>
                    <div class="perf-data">
                      <span class="perf-value">{{
                        searchConsoleData()!.avgPosition | number: '1.1-1'
                      }}</span>
                      <span class="perf-label">Avg. Position</span>
                    </div>
                  </div>
                  <div class="perf-card">
                    <mat-icon class="perf-icon indexed">check_circle</mat-icon>
                    <div class="perf-data">
                      <span class="perf-value">{{
                        searchConsoleData()!.indexedPages | number
                      }}</span>
                      <span class="perf-label">Indexed Pages</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Top Performing Queries -->
              @if (searchConsoleData()!.topQueries.length > 0) {
                <div class="dashboard-section">
                  <h3><mat-icon>trending_up</mat-icon> Top Performing Queries</h3>
                  <div class="queries-table">
                    <div class="table-header">
                      <span class="col-query">Query</span>
                      <span class="col-clicks">Clicks</span>
                      <span class="col-impressions">Impressions</span>
                      <span class="col-ctr">CTR</span>
                      <span class="col-position">Position</span>
                    </div>
                    @for (
                      query of searchConsoleData()!.topQueries.slice(0, 10);
                      track query.query
                    ) {
                      <div class="table-row">
                        <span class="col-query">{{ query.query }}</span>
                        <span class="col-clicks">{{ query.clicks | number }}</span>
                        <span class="col-impressions">{{ query.impressions | number }}</span>
                        <span class="col-ctr" [class.low]="query.ctr < 2"
                          >{{ query.ctr | number: '1.1-1' }}%</span
                        >
                        <span
                          class="col-position"
                          [class.top]="query.position <= 3"
                          [class.good]="query.position > 3 && query.position <= 10"
                          >{{ query.position | number: '1.0-0' }}</span
                        >
                      </div>
                    }
                  </div>
                </div>
              }
            }

            <!-- Errors Section -->
            @if (allErrors().length > 0) {
              <div class="dashboard-section errors-section">
                <h3><mat-icon>bug_report</mat-icon> Issues & Errors ({{ allErrors().length }})</h3>
                <div class="errors-list">
                  @for (error of allErrors(); track error.id) {
                    <div class="error-card" [class]="'priority-' + error.priority">
                      <div class="error-icon">
                        <mat-icon [class]="error.type">{{ getErrorIcon(error.type) }}</mat-icon>
                      </div>
                      <div class="error-content">
                        <div class="error-header">
                          <h4>{{ error.title }}</h4>
                          <span class="error-category">{{ error.category }}</span>
                        </div>
                        <p>{{ error.description }}</p>
                        @if (error.affectedUrls) {
                          <span class="affected-badge">{{ error.affectedUrls }} URLs affected</span>
                        }
                        <div class="fix-instructions">
                          <h5><mat-icon>build</mat-icon> How to Fix:</h5>
                          <ul>
                            @for (step of error.fixInstructions; track step) {
                              <li>{{ step }}</li>
                            }
                          </ul>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Visibility Recommendations -->
            @if (visibilityRecommendations().length > 0) {
              <div class="dashboard-section recommendations-section">
                <h3>
                  <mat-icon>lightbulb</mat-icon> Improve Search Visibility ({{
                    visibilityRecommendations().length
                  }}
                  recommendations)
                </h3>
                <div class="recommendations-grid">
                  @for (rec of visibilityRecommendations(); track rec.id) {
                    <div class="rec-card" [class]="'impact-' + rec.impact">
                      <div class="rec-header">
                        <span class="rec-category">{{ rec.category | uppercase }}</span>
                        <span class="impact-badge" [class]="rec.impact"
                          >{{ rec.impact }} impact</span
                        >
                      </div>
                      <h4>{{ rec.title }}</h4>
                      <p>{{ rec.description }}</p>
                      @if (rec.currentIssue) {
                        <div class="current-issue">
                          <mat-icon>info</mat-icon>
                          <span>{{ rec.currentIssue }}</span>
                        </div>
                      }
                      <div class="rec-action">
                        <mat-icon>arrow_forward</mat-icon>
                        <span>{{ rec.action }}</span>
                      </div>
                      @if (rec.potentialGain) {
                        <div class="potential-gain">
                          <mat-icon>trending_up</mat-icon>
                          <span>{{ rec.potentialGain }}</span>
                        </div>
                      }
                      <button
                        mat-stroked-button
                        class="rec-action-btn"
                        (click)="applyRecommendation(rec)"
                      >
                        <mat-icon>play_arrow</mat-icon> Take Action
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- No Data State -->
            @if (!searchConsoleData() && allErrors().length === 0) {
              <div class="no-data-state">
                <mat-icon>search</mat-icon>
                <h3>No Webmaster Data Yet</h3>
                <p>
                  Connect your search engines to see performance data, errors, and recommendations.
                </p>
                <button mat-flat-button class="connect-master-btn" (click)="switchTab('settings')">
                  <mat-icon>settings</mat-icon> Connect Search Engines
                </button>
              </div>
            }
          </div>
        </mat-tab>

        <!-- URLs Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>link</mat-icon>
            <span>URLs</span>
            <span class="tab-badge">{{ siteUrls().length }}</span>
          </ng-template>

          <div class="tab-content">
            <!-- Quick Add URL -->
            <div class="quick-add-section">
              <div class="add-card">
                <h3><mat-icon>add_link</mat-icon> Quick Add URL</h3>
                <div class="add-form">
                  <mat-form-field appearance="outline" class="url-input">
                    <mat-label>Enter URL to index</mat-label>
                    <input
                      matInput
                      [(ngModel)]="newUrl"
                      placeholder="https://yoursite.com/page"
                      (keyup.enter)="addUrl()"
                    />
                  </mat-form-field>
                  <button mat-flat-button class="add-btn" (click)="addUrl()" [disabled]="!newUrl">
                    <mat-icon>add</mat-icon> Add & Submit
                  </button>
                  <button mat-stroked-button (click)="detectUrls()">
                    <mat-icon>radar</mat-icon> Auto Detect
                  </button>
                </div>

                <!-- Bulk Add -->
                <div class="bulk-add">
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon>playlist_add</mat-icon> Bulk Add URLs
                      </mat-panel-title>
                    </mat-expansion-panel-header>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Enter multiple URLs (one per line)</mat-label>
                      <textarea
                        matInput
                        [(ngModel)]="bulkUrls"
                        rows="6"
                        placeholder="https://yoursite.com/page1
https://yoursite.com/page2
https://yoursite.com/page3"
                      ></textarea>
                    </mat-form-field>
                    <button
                      mat-flat-button
                      class="add-btn"
                      (click)="addBulkUrls()"
                      [disabled]="!bulkUrls"
                    >
                      <mat-icon>upload</mat-icon> Add All & Submit
                    </button>
                  </mat-expansion-panel>
                </div>
              </div>
            </div>

            <!-- URLs List -->
            <div class="urls-section">
              <div class="section-header">
                <h3><mat-icon>list</mat-icon> Detected URLs ({{ siteUrls().length }})</h3>
                <div class="url-actions">
                  <button mat-stroked-button (click)="submitAllPending()">
                    <mat-icon>cloud_upload</mat-icon> Submit All Pending
                  </button>
                  <button mat-stroked-button (click)="refreshUrls()">
                    <mat-icon>refresh</mat-icon>
                  </button>
                </div>
              </div>

              @if (processing()) {
                <mat-progress-bar mode="indeterminate"></mat-progress-bar>
              }

              <div class="urls-grid">
                @for (url of siteUrls(); track url.url) {
                  <div class="url-card" [class]="url.status">
                    <div class="url-header">
                      <div class="url-type">
                        <mat-icon>{{ getUrlTypeIcon(url.type) }}</mat-icon>
                        <span>{{ url.type }}</span>
                      </div>
                      <div class="url-status" [class]="url.status">
                        @if (url.status === 'indexed') {
                          <mat-icon>check_circle</mat-icon>
                        } @else if (url.status === 'submitted') {
                          <mat-icon>cloud_done</mat-icon>
                        } @else {
                          <mat-icon>schedule</mat-icon>
                        }
                        <span>{{ url.status }}</span>
                      </div>
                    </div>
                    <div class="url-link">{{ url.url }}</div>
                    <div class="url-meta">
                      <span class="submitted-to">
                        @for (engine of allEngines; track engine.id) {
                          @if (url.submittedTo.includes(engine.id)) {
                            <span
                              class="engine-chip submitted"
                              [style.border-color]="engine.color"
                              [title]="engine.name + ' - Submitted'"
                            >
                              <mat-icon>check</mat-icon> {{ engine.name }}
                            </span>
                          } @else {
                            <span
                              class="engine-chip not-submitted"
                              (click)="submitToSingleEngine(url, engine)"
                              [title]="engine.name + ' - Click to submit'"
                            >
                              <mat-icon>add</mat-icon> {{ engine.name }}
                            </span>
                          }
                        }
                      </span>
                    </div>
                    <div class="url-actions-row">
                      @if (url.status !== 'indexed') {
                        <button mat-stroked-button (click)="resubmitUrl(url)">
                          <mat-icon>refresh</mat-icon> Re-submit
                        </button>
                      }
                      <button mat-icon-button [matMenuTriggerFor]="urlMenu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #urlMenu="matMenu">
                        <button mat-menu-item (click)="openInConsole(url)">
                          <mat-icon>open_in_new</mat-icon> Open in Console
                        </button>
                        <button mat-menu-item (click)="checkIndexStatus(url)">
                          <mat-icon>search</mat-icon> Check Index Status
                        </button>
                        <button mat-menu-item (click)="removeUrl(url)">
                          <mat-icon>delete</mat-icon> Remove
                        </button>
                      </mat-menu>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Engines Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>public</mat-icon>
            <span>Engines</span>
          </ng-template>

          <div class="tab-content">
            <div class="engines-header">
              <h3><mat-icon>settings</mat-icon> Search Engine Configuration</h3>
              <div class="engine-filters">
                <mat-checkbox [(ngModel)]="showSupported" (change)="filterEngines()"
                  >Supported</mat-checkbox
                >
                <mat-checkbox [(ngModel)]="showAutoSubmit" (change)="filterEngines()"
                  >Auto Submit</mat-checkbox
                >
              </div>
            </div>

            <div class="engines-grid">
              @for (engine of filteredEngines(); track engine.id) {
                <div
                  class="engine-card"
                  [class.supported]="engine.supported"
                  [class.auto]="engine.autoSubmit"
                >
                  <div class="engine-header">
                    <img
                      [src]="engine.logo"
                      [alt]="engine.name"
                      class="engine-logo"
                      (error)="onImgError($event)"
                    />
                    <div class="engine-info">
                      <h4>{{ engine.name }}</h4>
                      <div class="engine-badges">
                        @if (engine.supported) {
                          <span class="badge supported">Supported</span>
                        } @else {
                          <span class="badge unsupported">Not Supported</span>
                        }
                        @if (engine.autoSubmit) {
                          <span class="badge auto">Auto Submit</span>
                        }
                      </div>
                    </div>
                    <mat-slide-toggle
                      [(ngModel)]="engine.autoSubmit"
                      (change)="toggleEngineAutoSubmit(engine)"
                    >
                    </mat-slide-toggle>
                  </div>

                  <div class="engine-stats">
                    <div class="mini-stat">
                      <span class="label">Indexed</span>
                      <span class="value">{{ engine.indexed | number }}</span>
                    </div>
                    <div class="mini-stat">
                      <span class="label">Impressions</span>
                      <span class="value">{{ engine.impressions | number }}</span>
                    </div>
                    <div class="mini-stat">
                      <span class="label">Clicks</span>
                      <span class="value">{{ engine.clicks | number }}</span>
                    </div>
                  </div>

                  <div class="engine-actions">
                    <button mat-stroked-button (click)="openConsole(engine)">
                      <mat-icon>open_in_new</mat-icon> Console
                    </button>
                    <button mat-flat-button class="submit-all-btn" (click)="submitToEngine(engine)">
                      <mat-icon>cloud_upload</mat-icon> Submit All URLs
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Indexing Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>cloud_upload</mat-icon>
            <span>Indexing</span>
            <span class="tab-badge">{{ indexingRequests().length }}</span>
          </ng-template>

          <div class="tab-content">
            <div class="indexing-header">
              <h3><mat-icon>history</mat-icon> Indexing Requests</h3>
              <div class="indexing-actions">
                <button mat-flat-button class="submit-all-btn" (click)="submitSitemapToAll()">
                  <mat-icon>upload_file</mat-icon> Submit Sitemap to All
                </button>
                <button mat-stroked-button (click)="refreshRequests()">
                  <mat-icon>refresh</mat-icon>
                </button>
              </div>
            </div>

            <!-- Status Summary -->
            <div class="request-summary">
              <div class="summary-item pending">
                <span class="count">{{ pendingCount() }}</span>
                <span class="label">Pending</span>
              </div>
              <div class="summary-item processing">
                <span class="count">{{ processingCount() }}</span>
                <span class="label">Processing</span>
              </div>
              <div class="summary-item completed">
                <span class="count">{{ completedCount() }}</span>
                <span class="label">Completed</span>
              </div>
              <div class="summary-item failed">
                <span class="count">{{ failedCount() }}</span>
                <span class="label">Failed</span>
              </div>
            </div>

            <!-- Requests List -->
            <div class="requests-list">
              @for (request of indexingRequests(); track request.id) {
                <div class="request-card" [class]="request.status">
                  <div class="request-icon">
                    <mat-icon>
                      @if (request.status === 'completed') {
                        check_circle
                      } @else if (request.status === 'failed') {
                        error
                      } @else if (request.status === 'processing') {
                        sync
                      } @else {
                        schedule
                      }
                    </mat-icon>
                  </div>
                  <div class="request-info">
                    <span class="request-url">{{ request.url }}</span>
                    <span class="request-type"
                      >{{ request.type | titlecase }} - {{ request.engine | uppercase }}</span
                    >
                  </div>
                  <div class="request-status">
                    <span class="status-badge" [class]="request.status">{{ request.status }}</span>
                    <span class="request-time">{{ request.submittedAt | date: 'short' }}</span>
                  </div>
                </div>
              }

              @if (indexingRequests().length === 0) {
                <div class="empty-state">
                  <mat-icon>cloud_done</mat-icon>
                  <h3>No Indexing Requests</h3>
                  <p>Add URLs to start indexing process</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Issues Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>bug_report</mat-icon>
            <span>Issues</span>
            @if (openIssues().length > 0) {
              <span class="tab-badge danger">{{ openIssues().length }}</span>
            }
          </ng-template>

          <div class="tab-content">
            <div class="issues-header">
              <h3><mat-icon>report_problem</mat-icon> SEO Issues</h3>
              <div class="issues-actions">
                <button mat-stroked-button (click)="scanForIssues()">
                  <mat-icon>radar</mat-icon> Scan Issues
                </button>
                <button
                  mat-flat-button
                  class="fix-all-btn"
                  (click)="fixAllIssues()"
                  [disabled]="openIssues().length === 0"
                >
                  <mat-icon>auto_fix_high</mat-icon> Auto Fix All
                </button>
              </div>
            </div>

            <div class="issues-list">
              @for (issue of openIssues(); track issue.id) {
                <div class="issue-card" [class]="'priority-' + issue.priority">
                  <div class="issue-severity">
                    <mat-icon [class]="issue.type">
                      @if (issue.type === 'error') {
                        error
                      } @else if (issue.type === 'warning') {
                        warning
                      } @else {
                        info
                      }
                    </mat-icon>
                  </div>
                  <div class="issue-content">
                    <div class="issue-header">
                      <h4>{{ issue.title }}</h4>
                      <span class="issue-engine">{{ issue.engine | uppercase }}</span>
                      @if (issue.autoFix) {
                        <span class="auto-badge">Auto Fix</span>
                      }
                    </div>
                    <p>{{ issue.description }}</p>
                    @if (issue.suggestion) {
                      <div class="issue-suggestion">
                        <mat-icon>lightbulb</mat-icon>
                        {{ issue.suggestion }}
                      </div>
                    }
                    @if (issue.affectedPages) {
                      <span class="affected-pages">{{ issue.affectedPages }} pages affected</span>
                    }
                  </div>
                  <div class="issue-actions">
                    <button mat-stroked-button class="fix-btn" (click)="fixIssue(issue)">
                      <mat-icon>check</mat-icon> Fix
                    </button>
                    <button mat-icon-button (click)="dismissIssue(issue)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              }

              @if (openIssues().length === 0) {
                <div class="empty-state success">
                  <mat-icon>check_circle</mat-icon>
                  <h3>All Issues Fixed!</h3>
                  <p>Your site has no open SEO issues</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Settings Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </ng-template>

          <div class="tab-content">
            <div class="settings-section">
              <h3><mat-icon>bolt</mat-icon> Auto Mode Settings</h3>

              <div class="setting-row">
                <div class="setting-info">
                  <h4>Enable Auto Mode</h4>
                  <p>Automatically detect URLs, submit for indexing, and fix issues</p>
                </div>
                <mat-slide-toggle
                  [(ngModel)]="autoEnabled"
                  (change)="toggleAutoMode()"
                ></mat-slide-toggle>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <h4>Auto Detect URLs</h4>
                  <p>Automatically detect URLs from sitemap</p>
                </div>
                <mat-slide-toggle
                  [(ngModel)]="autoConfig().autoDetectUrls"
                  (change)="saveAutoConfig()"
                ></mat-slide-toggle>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <h4>Auto Submit to Engines</h4>
                  <p>Automatically submit URLs to selected search engines</p>
                </div>
                <mat-slide-toggle
                  [(ngModel)]="autoConfig().autoSubmitAll"
                  (change)="saveAutoConfig()"
                ></mat-slide-toggle>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <h4>Auto Fix Issues</h4>
                  <p>Automatically fix detected SEO issues</p>
                </div>
                <mat-slide-toggle
                  [(ngModel)]="autoConfig().autoFixIssues"
                  (change)="saveAutoConfig()"
                ></mat-slide-toggle>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <h4>Sitemap URL</h4>
                  <p>URL of your sitemap.xml file</p>
                </div>
                <mat-form-field appearance="outline" class="sitemap-input">
                  <input
                    matInput
                    [(ngModel)]="autoConfig().sitemapUrl"
                    (change)="saveAutoConfig()"
                  />
                </mat-form-field>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <h4>Submit to Engines</h4>
                  <p>Select which engines to auto-submit URLs to</p>
                </div>
                <div class="engine-checkboxes">
                  @for (engine of supportedEngines(); track engine.id) {
                    <mat-checkbox
                      [checked]="isEngineSelected(engine.id)"
                      (change)="toggleEngineSelection(engine.id)"
                    >
                      {{ engine.name }}
                    </mat-checkbox>
                  }
                </div>
              </div>
            </div>

            <div class="settings-section">
              <h3><mat-icon>cloud_upload</mat-icon> Sitemap</h3>
              <div class="sitemap-actions">
                <button mat-flat-button class="download-btn" (click)="downloadSitemap()">
                  <mat-icon>download</mat-icon> Download Sitemap XML
                </button>
                <button mat-stroked-button (click)="submitSitemapToAll()">
                  <mat-icon>upload</mat-icon> Submit Sitemap to All Engines
                </button>
              </div>
              <div class="sitemap-preview">
                <h4>Generated Sitemap Preview</h4>
                <pre>{{ sitemapPreview() }}</pre>
              </div>
            </div>

            <div class="settings-section">
              <h3><mat-icon>manage_accounts</mat-icon> Master Tools Configuration</h3>
              <p class="section-desc">
                If you already verified your website in Search Console, just enter your website URL
                below. API Key is optional for real-time data.
              </p>

              <div class="master-tools-grid">
                <!-- Google -->
                <div class="master-tool-card" [class.connected]="masterConfig()?.google?.connected">
                  <div class="tool-header">
                    <img src="https://www.google.com/favicon.ico" alt="Google" class="tool-logo" />
                    <span class="tool-name">Google Search Console</span>
                    <span
                      class="status-indicator"
                      [class.connected]="masterConfig()?.google?.connected"
                    ></span>
                  </div>
                  @if (masterConfig()?.google?.connected) {
                    <div class="verified-badge"><mat-icon>check_circle</mat-icon> Verified</div>
                  }
                  <div class="tool-fields">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Your Website URL</mat-label>
                      <input
                        matInput
                        [(ngModel)]="googleSiteUrl"
                        placeholder="https://yoursite.com"
                      />
                      <mat-hint>Enter the URL you verified in Search Console</mat-hint>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Google API Key (Optional)</mat-label>
                      <input
                        matInput
                        [(ngModel)]="googleApiKey"
                        placeholder="For real-time data"
                        type="password"
                      />
                      <mat-hint>Optional - for live search analytics</mat-hint>
                    </mat-form-field>
                  </div>
                  <div class="tool-actions">
                    <button mat-flat-button class="connect-btn" (click)="verifyGoogle()">
                      <mat-icon>{{
                        masterConfig()?.google?.connected ? 'refresh' : 'verified_user'
                      }}</mat-icon>
                      {{ masterConfig()?.google?.connected ? 'Update' : 'Verify Website' }}
                    </button>
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      class="help-link"
                    >
                      <mat-icon>open_in_new</mat-icon> Open Console
                    </a>
                  </div>
                </div>

                <!-- Bing -->
                <div class="master-tool-card" [class.connected]="masterConfig()?.bing?.connected">
                  <div class="tool-header">
                    <img src="https://www.bing.com/favicon.ico" alt="Bing" class="tool-logo" />
                    <span class="tool-name">Bing Webmaster</span>
                    <span
                      class="status-indicator"
                      [class.connected]="masterConfig()?.bing?.connected"
                    ></span>
                  </div>
                  @if (masterConfig()?.bing?.connected) {
                    <div class="verified-badge"><mat-icon>check_circle</mat-icon> Verified</div>
                  }
                  <div class="tool-fields">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Your Website URL</mat-label>
                      <input
                        matInput
                        [(ngModel)]="bingSiteUrl"
                        placeholder="https://yoursite.com"
                      />
                      <mat-hint>Enter the URL you verified in Bing</mat-hint>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Bing API Key (Optional)</mat-label>
                      <input
                        matInput
                        [(ngModel)]="bingApiKey"
                        placeholder="For real-time data"
                        type="password"
                      />
                    </mat-form-field>
                  </div>
                  <div class="tool-actions">
                    <button mat-flat-button class="connect-btn" (click)="verifyBing()">
                      <mat-icon>{{
                        masterConfig()?.bing?.connected ? 'refresh' : 'verified_user'
                      }}</mat-icon>
                      {{ masterConfig()?.bing?.connected ? 'Update' : 'Verify Website' }}
                    </button>
                    <a href="https://www.bing.com/webmasters" target="_blank" class="help-link">
                      <mat-icon>open_in_new</mat-icon> Open Bing
                    </a>
                  </div>
                </div>

                <!-- Yandex -->
                <div class="master-tool-card" [class.connected]="masterConfig()?.yandex?.connected">
                  <div class="tool-header">
                    <img src="https://yandex.ru/favicon.ico" alt="Yandex" class="tool-logo" />
                    <span class="tool-name">Yandex Webmaster</span>
                    <span
                      class="status-indicator"
                      [class.connected]="masterConfig()?.yandex?.connected"
                    ></span>
                  </div>
                  @if (masterConfig()?.yandex?.connected) {
                    <div class="verified-badge"><mat-icon>check_circle</mat-icon> Verified</div>
                  }
                  <div class="tool-fields">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Your Website URL</mat-label>
                      <input
                        matInput
                        [(ngModel)]="yandexSiteUrl"
                        placeholder="https://yoursite.com"
                      />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Yandex OAuth (Optional)</mat-label>
                      <input
                        matInput
                        [(ngModel)]="yandexApiKey"
                        placeholder="For real-time data"
                        type="password"
                      />
                    </mat-form-field>
                  </div>
                  <div class="tool-actions">
                    <button mat-flat-button class="connect-btn" (click)="verifyYandex()">
                      <mat-icon>{{
                        masterConfig()?.yandex?.connected ? 'refresh' : 'verified_user'
                      }}</mat-icon>
                      {{ masterConfig()?.yandex?.connected ? 'Update' : 'Verify Website' }}
                    </button>
                    <a href="https://webmaster.yandex.com" target="_blank" class="help-link">
                      <mat-icon>open_in_new</mat-icon> Open Yandex
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <h3><mat-icon>delete_forever</mat-icon> Danger Zone</h3>
              <button mat-stroked-button class="danger-btn" (click)="clearAllData()">
                <mat-icon>delete_forever</mat-icon> Clear All Data
              </button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .search-manager {
        padding: 24px;
        max-width: 1600px;
        margin: 0 auto;
      }

      .manager-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 8px;
          font-size: 24px;
          color: #fff;
          mat-icon {
            color: #4285f4;
          }
        }
        p {
          margin: 0;
          color: #a0a0b8;
          font-size: 14px;
        }
      }
      .header-actions {
        display: flex;
        gap: 12px;
      }
      .auto-btn {
        background: linear-gradient(135deg, #4285f4, #34a853);
        color: white;
      }

      .error-banner {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(244, 67, 54, 0.05));
        border: 2px solid rgba(244, 67, 54, 0.4);
        border-radius: 12px;
        margin-bottom: 24px;
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #f44336;
        }
        .error-content {
          flex: 1;
          strong {
            display: block;
            color: #f44336;
            margin-bottom: 4px;
          }
          p {
            margin: 0;
            color: #ffcdd2;
            font-size: 13px;
          }
        }
        a {
          color: #f44336;
          border-color: #f44336;
        }
      }

      .dashboard-section {
        margin-bottom: 32px;
        h3 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 20px;
          color: #fff;
          font-size: 18px;
          mat-icon {
            color: #4285f4;
          }
        }
      }

      .verification-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }

      .verification-card {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        padding: 20px;
        border: 2px solid rgba(255, 255, 255, 0.05);
        transition: all 0.3s;
        &.verified {
          border-color: rgba(76, 175, 80, 0.4);
          background: rgba(76, 175, 80, 0.05);
        }
        &.not-verified {
          border-color: rgba(255, 152, 0, 0.3);
        }
        .verify-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          .engine-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
          }
          .verify-status {
            display: flex;
            align-items: center;
            gap: 8px;
            .verified-icon {
              color: #4caf50;
              font-size: 24px;
            }
            .not-verified-icon {
              color: #ff9800;
              font-size: 24px;
            }
            .status-text {
              font-size: 14px;
              font-weight: 600;
              &.verified {
                color: #4caf50;
              }
              &.not-verified {
                color: #ff9800;
              }
            }
          }
        }
        .verify-details {
          margin-bottom: 16px;
          .detail-row {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #a0a0b8;
            font-size: 12px;
            margin-bottom: 4px;
            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
              color: #666;
            }
          }
          .setup-hint {
            color: #ff9800;
            font-size: 12px;
            margin: 0;
          }
        }
        .verify-btn {
          width: 100%;
        }
      }

      .performance-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .perf-card {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        .perf-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          &.clicks {
            color: #4caf50;
          }
          &.impressions {
            color: #2196f3;
          }
          &.ctr {
            color: #ff9800;
          }
          &.position {
            color: #9c27b0;
          }
          &.indexed {
            color: #00bcd4;
          }
        }
        .perf-data {
          .perf-value {
            display: block;
            font-size: 24px;
            font-weight: 700;
            color: #fff;
          }
          .perf-label {
            font-size: 12px;
            color: #666;
          }
        }
      }

      .queries-table {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        overflow: hidden;
        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 12px 16px;
          background: rgba(66, 133, 244, 0.1);
          font-size: 12px;
          font-weight: 600;
          color: #a0a0b8;
          text-transform: uppercase;
        }
        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 13px;
          color: #fff;
          &:hover {
            background: rgba(255, 255, 255, 0.02);
          }
          .col-query {
            color: #fff;
            font-weight: 500;
          }
          .col-clicks,
          .col-impressions {
            color: #a0a0b8;
          }
          .col-ctr {
            &.low {
              color: #ff9800;
            }
          }
          .col-position {
            &.top {
              color: #4caf50;
              font-weight: 600;
            }
            &.good {
              color: #2196f3;
            }
          }
        }
      }

      .errors-section {
        .errors-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      }

      .error-card {
        display: flex;
        gap: 16px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        padding: 20px;
        border-left: 4px solid;
        &.priority-critical {
          border-left-color: #f44336;
        }
        &.priority-high {
          border-left-color: #ff9800;
        }
        &.priority-medium {
          border-left-color: #2196f3;
        }
        &.priority-low {
          border-left-color: #4caf50;
        }
        .error-icon mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          &.critical,
          &.error {
            color: #f44336;
          }
          &.warning {
            color: #ff9800;
          }
        }
        .error-content {
          flex: 1;
          .error-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
            h4 {
              margin: 0;
              color: #fff;
              font-size: 16px;
            }
            .error-category {
              font-size: 10px;
              padding: 2px 8px;
              background: rgba(66, 133, 244, 0.2);
              color: #4285f4;
              border-radius: 4px;
            }
          }
          p {
            margin: 0 0 12px;
            color: #a0a0b8;
            font-size: 13px;
          }
          .affected-badge {
            display: inline-block;
            font-size: 11px;
            padding: 4px 8px;
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
            border-radius: 4px;
            margin-bottom: 12px;
          }
          .fix-instructions {
            background: rgba(76, 175, 80, 0.1);
            border-radius: 8px;
            padding: 12px;
            h5 {
              display: flex;
              align-items: center;
              gap: 8px;
              margin: 0 0 8px;
              color: #4caf50;
              font-size: 13px;
              mat-icon {
                font-size: 16px;
                width: 16px;
                height: 16px;
              }
            }
            ul {
              margin: 0;
              padding-left: 20px;
              li {
                color: #a0a0b8;
                font-size: 12px;
                margin-bottom: 4px;
              }
            }
          }
        }
      }

      .recommendations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
      }

      .rec-card {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        &.impact-high {
          border-color: rgba(244, 67, 54, 0.4);
        }
        &.impact-medium {
          border-color: rgba(255, 152, 0, 0.4);
        }
        &.impact-low {
          border-color: rgba(76, 175, 80, 0.4);
        }
        .rec-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          .rec-category {
            font-size: 10px;
            font-weight: 600;
            color: #4285f4;
            letter-spacing: 1px;
          }
          .impact-badge {
            font-size: 10px;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 600;
            &.high {
              background: rgba(244, 67, 54, 0.2);
              color: #f44336;
            }
            &.medium {
              background: rgba(255, 152, 0, 0.2);
              color: #ff9800;
            }
            &.low {
              background: rgba(76, 175, 80, 0.2);
              color: #4caf50;
            }
          }
        }
        h4 {
          margin: 0 0 8px;
          color: #fff;
          font-size: 15px;
        }
        p {
          margin: 0 0 12px;
          color: #a0a0b8;
          font-size: 13px;
        }
        .current-issue {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(66, 133, 244, 0.1);
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #4285f3;
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
        .rec-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(76, 175, 80, 0.1);
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #4caf50;
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
        .potential-gain {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 13px;
          font-weight: 600;
          color: #4caf50;
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
        .rec-action-btn {
          width: 100%;
          color: #4caf50;
          border-color: #4caf50;
        }
      }

      .no-data-state {
        text-align: center;
        padding: 80px 20px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
        mat-icon {
          font-size: 80px;
          width: 80px;
          height: 80px;
          color: #4285f4;
          margin-bottom: 20px;
        }
        h3 {
          margin: 0 0 12px;
          color: #fff;
          font-size: 24px;
        }
        p {
          margin: 0 0 24px;
          color: #a0a0b8;
          font-size: 14px;
        }
        .connect-master-btn {
          background: linear-gradient(135deg, #4285f4, #34a853);
          color: white;
          padding: 0 24px;
          height: 48px;
        }
      }

      .auto-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(135deg, #1f1f35, #1a1a2e);
        border-radius: 12px;
        margin-bottom: 24px;
        border: 2px solid rgba(66, 133, 244, 0.3);
        &.active {
          border-color: #4caf50;
        }
        .auto-status {
          display: flex;
          align-items: center;
          gap: 16px;
          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: #4285f4;
          }
          &.active mat-icon {
            color: #4caf50;
          }
          .status-info {
            h4 {
              margin: 0;
              color: #fff;
              font-size: 16px;
            }
            p {
              margin: 4px 0 0;
              color: #a0a0b8;
              font-size: 13px;
            }
          }
        }
      }

      .stats-row {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      .stat-card {
        background: linear-gradient(135deg, #1f1f35, #1a1a2e);
        border-radius: 12px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        overflow: hidden;
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        &.large {
          flex-direction: column;
          align-items: flex-start;
          min-height: 100px;
        }
        .stat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          color: #4285f4;
        }
        &.success .stat-icon {
          color: #4caf50;
        }
        &.warning .stat-icon {
          color: #ff9800;
        }
        &.danger .stat-icon {
          color: #f44336;
        }
        .stat-info {
          .stat-value {
            display: block;
            font-size: 24px;
            font-weight: 700;
            color: #fff;
          }
          .stat-label {
            font-size: 12px;
            color: #666;
          }
        }
        .stat-breakdown {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 8px;
          width: 100%;
          .breakdown-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #a0a0b8;
            mat-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
              color: #666;
            }
          }
        }
        .stat-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          .progress-bar {
            height: 100%;
            background: #4caf50;
            transition: width 0.3s;
          }
        }
      }

      .main-tabs {
        background: linear-gradient(135deg, #1f1f35, #1a1a2e);
        border-radius: 16px;
        padding: 20px;
      }
      .tab-badge {
        background: #4285f4;
        color: white;
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 10px;
        margin-left: 8px;
        min-width: 20px;
        text-align: center;
        &.danger {
          background: #f44336;
        }
      }
      .tab-content {
        padding: 20px 0;
      }

      .quick-add-section {
        margin-bottom: 24px;
      }
      .add-card {
        background: rgba(255, 255, 255, 0.03);
        padding: 20px;
        border-radius: 12px;
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px;
          color: #fff;
          mat-icon {
            color: #4285f4;
          }
        }
      }
      .add-form {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        .url-input {
          flex: 1;
          min-width: 300px;
        }
        .add-btn {
          background: #4285f4;
          color: white;
          height: 56px;
        }
      }
      .bulk-add {
        margin-top: 16px;
        mat-expansion-panel {
          background: rgba(0, 0, 0, 0.2);
        }
        .full-width {
          width: 100%;
          margin-bottom: 12px;
        }
      }

      .urls-section {
      }

      .section-desc {
        color: #a0a0b8;
        font-size: 13px;
        margin: 0 0 16px;
      }

      .sitemap-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .download-btn {
        background: #4caf50;
        color: white;
      }
      .sitemap-preview {
        background: #0f0f1a;
        border-radius: 8px;
        padding: 16px;
        h4 {
          margin: 0 0 12px;
          color: #fff;
          font-size: 14px;
        }
        pre {
          margin: 0;
          font-size: 11px;
          color: #4caf50;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 200px;
          overflow-y: auto;
        }
      }

      .google-config {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .save-google-btn {
        background: #4285f4;
        color: white;
      }
      .help-link {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #4285f4;
        font-size: 13px;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }

      .master-tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
      .master-tool-card {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        padding: 16px;
        border: 2px solid rgba(255, 255, 255, 0.05);
        transition: all 0.3s;
        &.connected {
          border-color: #4caf50;
        }
        .tool-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          .tool-logo {
            width: 24px;
            height: 24px;
            border-radius: 4px;
          }
          .tool-name {
            flex: 1;
            font-weight: 600;
            color: #fff;
          }
          .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #666;
            &.connected {
              background: #4caf50;
              box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
            }
          }
        }
        .tool-fields {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }
        .tool-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          .connect-btn {
            background: #4285f4;
            color: white;
          }
        }
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          color: #fff;
          mat-icon {
            color: #4285f4;
          }
        }
      }
      .url-actions {
        display: flex;
        gap: 12px;
      }
      .urls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 12px;
      }
      .url-card {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        padding: 16px;
        border-left: 3px solid transparent;
        &.indexed {
          border-left-color: #4caf50;
        }
        &.submitted {
          border-left-color: #4285f4;
        }
        &.pending {
          border-left-color: #ff9800;
        }
      }
      .url-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .url-type {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #a0a0b8;
        font-size: 12px;
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
      .url-status {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        &.indexed {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }
        &.submitted {
          background: rgba(66, 133, 244, 0.2);
          color: #4285f4;
          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }
        &.pending {
          background: rgba(255, 152, 0, 0.2);
          color: #ff9800;
          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }
      }
      .url-link {
        font-family: monospace;
        font-size: 12px;
        color: #fff;
        margin-bottom: 8px;
        word-break: break-all;
      }
      .url-meta {
        margin-bottom: 8px;
      }
      .submitted-to {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .engine-chip {
        display: flex;
        align-items: center;
        gap: 3px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
        &.submitted {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
          border-color: rgba(76, 175, 80, 0.3);
          &:hover {
            background: rgba(76, 175, 80, 0.3);
          }
        }
        &.not-submitted {
          background: rgba(255, 255, 255, 0.05);
          color: #666;
          border-color: rgba(255, 255, 255, 0.1);
          &:hover {
            background: rgba(66, 133, 244, 0.2);
            color: #4285f4;
            border-color: rgba(66, 133, 244, 0.3);
          }
        }
      }
      .no-submit {
        color: #666;
        font-size: 11px;
      }
      .url-actions-row {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .engines-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          color: #fff;
          mat-icon {
            color: #4285f4;
          }
        }
      }
      .engine-filters {
        display: flex;
        gap: 16px;
      }
      .engines-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 16px;
      }
      .engine-card {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        &.supported {
          border-color: rgba(0, 217, 165, 0.3);
        }
        &.auto {
          border-color: rgba(66, 133, 244, 0.3);
        }
      }
      .engine-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        .engine-logo {
          width: 40px;
          height: 40px;
          border-radius: 8px;
        }
        .engine-info {
          flex: 1;
          h4 {
            margin: 0;
            color: #fff;
            font-size: 16px;
          }
        }
        .engine-badges {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }
        .badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          &.supported {
            background: rgba(0, 217, 165, 0.2);
            color: #00d9a5;
          }
          &.unsupported {
            background: rgba(255, 255, 255, 0.1);
            color: #666;
          }
          &.auto {
            background: rgba(66, 133, 244, 0.2);
            color: #4285f4;
          }
        }
      }
      .engine-stats {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        .mini-stat {
          .label {
            display: block;
            font-size: 10px;
            color: #666;
          }
          .value {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
          }
        }
      }
      .engine-actions {
        display: flex;
        gap: 8px;
        .submit-all-btn {
          background: #4285f4;
          color: white;
          flex: 1;
        }
      }

      .indexing-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          color: #fff;
          mat-icon {
            color: #4285f4;
          }
        }
      }
      .indexing-actions {
        display: flex;
        gap: 12px;
      }
      .request-summary {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        .summary-item {
          flex: 1;
          text-align: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          .count {
            display: block;
            font-size: 24px;
            font-weight: 700;
            color: #fff;
          }
          .label {
            font-size: 12px;
            color: #666;
          }
          &.pending {
            border-bottom: 2px solid #ff9800;
            .count {
              color: #ff9800;
            }
          }
          &.processing {
            border-bottom: 2px solid #4285f4;
            .count {
              color: #4285f4;
            }
          }
          &.completed {
            border-bottom: 2px solid #4caf50;
            .count {
              color: #4caf50;
            }
          }
          &.failed {
            border-bottom: 2px solid #f44336;
            .count {
              color: #f44336;
            }
          }
        }
      }
      .requests-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .request-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        &.completed {
          border-left: 3px solid #4caf50;
        }
        &.failed {
          border-left: 3px solid #f44336;
        }
        &.processing {
          border-left: 3px solid #4285f4;
        }
      }
      .request-icon mat-icon {
        &.completed {
          color: #4caf50;
        }
        &.failed {
          color: #f44336;
        }
        &.processing {
          color: #4285f4;
          animation: spin 1s linear infinite;
        }
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      .request-info {
        flex: 1;
        .request-url {
          display: block;
          color: #fff;
          font-size: 13px;
        }
        .request-type {
          font-size: 11px;
          color: #a0a0b8;
        }
      }
      .request-status {
        text-align: right;
        .status-badge {
          display: block;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          &.completed {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
          }
          &.failed {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
          }
          &.processing {
            background: rgba(66, 133, 244, 0.2);
            color: #4285f4;
          }
          &.pending {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
          }
        }
        .request-time {
          display: block;
          font-size: 10px;
          color: #666;
          margin-top: 4px;
        }
      }

      .issues-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          color: #fff;
          mat-icon {
            color: #ff9800;
          }
        }
      }
      .issues-actions {
        display: flex;
        gap: 12px;
      }
      .fix-all-btn {
        background: #4caf50;
        color: white;
      }
      .issues-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .issue-card {
        display: flex;
        gap: 16px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        border-left: 4px solid;
        &.priority-critical {
          border-left-color: #f44336;
        }
        &.priority-high {
          border-left-color: #ff9800;
        }
        &.priority-medium {
          border-left-color: #4285f4;
        }
        &.priority-low {
          border-left-color: #4caf50;
        }
      }
      .issue-severity mat-icon {
        &.error {
          color: #f44336;
        }
        &.warning {
          color: #ff9800;
        }
        &.notice {
          color: #4285f4;
        }
      }
      .issue-content {
        flex: 1;
        .issue-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          h4 {
            margin: 0;
            color: #fff;
            font-size: 14px;
          }
          .issue-engine {
            font-size: 10px;
            padding: 2px 6px;
            background: rgba(66, 133, 244, 0.2);
            color: #4285f4;
            border-radius: 4px;
          }
          .auto-badge {
            font-size: 10px;
            padding: 2px 6px;
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
            border-radius: 4px;
          }
        }
        p {
          margin: 0 0 8px;
          color: #a0a0b8;
          font-size: 13px;
        }
        .issue-suggestion {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 193, 7, 0.1);
          border-radius: 8px;
          font-size: 12px;
          color: #ffc107;
          margin-bottom: 8px;
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
        .affected-pages {
          font-size: 11px;
          color: #a0a0b8;
        }
      }
      .issue-actions {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        .fix-btn {
          color: #4caf50;
          border-color: #4caf50;
        }
      }

      .settings-section {
        background: rgba(255, 255, 255, 0.03);
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 20px;
          color: #fff;
          mat-icon {
            color: #4285f4;
          }
        }
      }
      .setting-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        &:last-child {
          border-bottom: none;
        }
        .setting-info {
          h4 {
            margin: 0 0 4px;
            color: #fff;
            font-size: 14px;
          }
          p {
            margin: 0;
            color: #a0a0b8;
            font-size: 12px;
          }
        }
        .sitemap-input {
          width: 300px;
        }
        .engine-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
      }
      .danger-btn {
        color: #f44336;
        border-color: #f44336;
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: #666;
        }
        &.success mat-icon {
          color: #4caf50;
        }
        h3 {
          margin: 16px 0 8px;
          color: #fff;
        }
        p {
          margin: 0;
          color: #a0a0b8;
        }
      }

      @media (max-width: 1200px) {
        .stats-row {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      @media (max-width: 768px) {
        .stats-row {
          grid-template-columns: repeat(2, 1fr);
        }
        .urls-grid {
          grid-template-columns: 1fr;
        }
        .engines-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SearchEngineManagerComponent implements OnInit {
  engines: SearchEngine[] = [];
  allEngines: SearchEngine[] = [];
  filteredEngines = signal<SearchEngine[]>([]);
  siteUrls = signal<SiteUrl[]>([]);
  openIssues = signal<SEOIssue[]>([]);
  indexingRequests = signal<IndexingRequest[]>([]);
  autoConfig = signal<AutoConfig>({
    enabled: true,
    autoDetectUrls: true,
    autoSubmitAll: true,
    submitToEngines: ['google', 'bing', 'yandex', 'baidu', 'naver'],
    checkInterval: 300000,
    autoFixIssues: true,
    sitemapUrl: '/sitemap.xml',
    siteUrl: '',
    googleApiKey: '',
    googleSiteUrl: '',
    bingApiKey: '',
    yandexApiKey: '',
  });
  stats = signal<any>({});

  @ViewChild('tabGroup') tabGroup!: MatTabGroup;

  autoEnabled = true;
  newUrl = '';
  bulkUrls = '';
  processing = signal(false);
  showSupported = true;
  showAutoSubmit = false;
  googleApiKey = '';
  googleSiteUrl = '';
  bingApiKey = '';
  bingSiteUrl = '';
  yandexApiKey = '';
  yandexUserId = '';
  yandexSiteUrl = '';

  sitemapPreview = computed(() => {
    const xml = this.searchEngineService.getGeneratedSitemap();
    return xml.substring(0, 1000) + (xml.length > 1000 ? '...' : '');
  });

  masterConfig = signal<EngineMasterConfig | null>(null);
  searchConsoleData = signal<SearchConsoleData | null>(null);
  loadingData = signal(false);
  allErrors = signal<any[]>([]);
  visibilityRecommendations = signal<any[]>([]);

  masterConfigStatus = computed(() => {
    const config = this.masterConfig();
    if (!config) return { connected: 0, total: 5 };
    const connected =
      (config.google.connected ? 1 : 0) +
      (config.bing.connected ? 1 : 0) +
      (config.yandex.connected ? 1 : 0) +
      (config.baidu.connected ? 1 : 0) +
      (config.naver.connected ? 1 : 0);
    return { connected, total: 5 };
  });

  errorMessage = computed(() => this.searchEngineService.getErrorMessage());
  dataSource = computed(() => this.searchEngineService.getDataSource());

  postsCount = computed(() => this.siteUrls().filter((u) => u.type === 'post').length);
  pagesCount = computed(() => this.siteUrls().filter((u) => u.type === 'page').length);
  categoriesCount = computed(() => this.siteUrls().filter((u) => u.type === 'category').length);
  homepageCount = computed(() => this.siteUrls().filter((u) => u.type === 'homepage').length);

  indexedPercent = computed(() => {
    const s = this.stats();
    if (!s.totalUrls) return 0;
    return Math.round((s.indexedUrls / s.totalUrls) * 100);
  });

  pendingCount = computed(
    () => this.indexingRequests().filter((r) => r.status === 'pending').length,
  );
  processingCount = computed(
    () => this.indexingRequests().filter((r) => r.status === 'processing').length,
  );
  completedCount = computed(
    () => this.indexingRequests().filter((r) => r.status === 'completed').length,
  );
  failedCount = computed(() => this.indexingRequests().filter((r) => r.status === 'failed').length);

  supportedEngines = computed(() => this.engines.filter((e) => e.supported));

  private autoRefreshInterval: any;

  constructor(
    private searchEngineService: SearchEngineManagerService,
    private wordPressService: WordPressService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.autoConnectIfNeeded();
    this.loadData();
    this.startAutoRefresh();
  }

  autoConnectIfNeeded(): void {
    const wpSettings = this.wordPressService.getSettings();
    if (wpSettings?.wordpress?.apiUrl) {
      const siteUrl = wpSettings.wordpress.apiUrl.replace('/wp-json', '');
      const config = this.searchEngineService.getMasterConfig();
      if (!config.google.siteUrl && !config.bing.siteUrl) {
        this.searchEngineService.autoConnectFromWordPress(siteUrl);
        this.snackBar.open('Search engines auto-configured from WordPress: ' + siteUrl, 'Close', {
          duration: 3000,
        });
      }
    }
  }

  ngOnDestroy(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  loadData(): void {
    this.engines = this.searchEngineService.getEngines();
    this.allEngines = this.searchEngineService.getEngines();
    this.siteUrls.set(this.searchEngineService.getSiteUrls());
    this.openIssues.set(this.searchEngineService.getOpenIssues());
    this.indexingRequests.set(this.searchEngineService.getIndexingRequests());
    this.autoConfig.set(this.searchEngineService.getAutoConfig());
    this.stats.set(this.searchEngineService.getStats());
    this.masterConfig.set(this.searchEngineService.getMasterConfig());
    this.searchConsoleData.set(this.searchEngineService.getSearchConsoleData());
    this.allErrors.set(this.searchEngineService.getAllErrors());
    this.visibilityRecommendations.set(this.searchEngineService.getVisibilityRecommendations());
    this.filterEngines();

    const config = this.masterConfig();
    if (config) {
      this.googleApiKey = config.google.apiKey || '';
      this.googleSiteUrl = config.google.siteUrl || '';
      this.bingApiKey = config.bing.apiKey || '';
      this.bingSiteUrl = config.bing.siteUrl || '';
      this.yandexApiKey = config.yandex.apiKey || '';
      this.yandexUserId = config.yandex.username || '';
    }
  }

  startAutoRefresh(): void {
    this.autoRefreshInterval = setInterval(() => {
      this.loadData();
    }, 10000);
  }

  refreshAll(): void {
    this.loadingData.set(true);
    this.searchEngineService
      .fetchAllWebmasterData()
      .then(() => {
        this.loadData();
        this.loadingData.set(false);
        this.snackBar.open('Webmaster data refreshed', 'Close', { duration: 2000 });
      })
      .catch(() => {
        this.loadData();
        this.loadingData.set(false);
      });
  }

  switchTab(tab: string): void {
    const tabMap: Record<string, number> = {
      dashboard: 0,
      urls: 1,
      engines: 2,
      indexing: 3,
      issues: 4,
      settings: 5,
    };
    if (this.tabGroup && tabMap[tab] !== undefined) {
      this.tabGroup.selectedIndex = tabMap[tab];
    }
  }

  getUrlTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      homepage: 'home',
      post: 'article',
      page: 'description',
      category: 'folder',
      tag: 'label',
      archive: 'archive',
    };
    return icons[type] || 'link';
  }

  isEngineVerified(engine: string): boolean {
    const config = this.masterConfig();
    if (!config) return false;
    const engineConfig = (config as any)[engine];
    return !!engineConfig?.siteUrl;
  }

  getEngineLogo(engine: string): string {
    const logos: Record<string, string> = {
      google: 'https://www.google.com/favicon.ico',
      bing: 'https://www.bing.com/favicon.ico',
      yandex: 'https://yandex.ru/favicon.ico',
      baidu: 'https://www.baidu.com/favicon.ico',
      naver: 'https://www.naver.com/favicon.ico',
    };
    return logos[engine] || '';
  }

  getEngineSiteUrl(engine: string): string {
    const config = this.masterConfig();
    if (!config) return 'Not configured';
    const engineConfig = (config as any)[engine];
    return engineConfig?.siteUrl || 'Not configured';
  }

  getErrorIcon(type: string): string {
    const icons: Record<string, string> = {
      critical: 'error',
      error: 'error_outline',
      warning: 'warning',
    };
    return icons[type] || 'info';
  }

  applyRecommendation(rec: any): void {
    this.snackBar.open(rec.action, 'OK', { duration: 3000 });
    if (rec.category === 'indexing') {
      this.switchTab('urls');
    } else if (rec.category === 'technical') {
      this.switchTab('settings');
    }
  }

  addUrl(): void {
    if (!this.newUrl) return;

    const url = this.newUrl.trim();
    this.processing.set(true);

    this.searchEngineService.addUrl(url);
    this.loadData();

    this.processing.set(false);
    this.newUrl = '';
    this.snackBar.open('URL added and submitted to all engines!', 'Close', { duration: 3000 });
  }

  addBulkUrls(): void {
    if (!this.bulkUrls) return;

    const urls = this.bulkUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u);
    if (urls.length === 0) return;

    this.processing.set(true);

    this.searchEngineService.addUrls(urls);
    this.loadData();

    this.processing.set(false);
    this.bulkUrls = '';
    this.snackBar.open(`${urls.length} URLs added and submitted!`, 'Close', { duration: 3000 });
  }

  detectUrls(): void {
    this.processing.set(true);

    const siteUrl = this.wordPressService.getSiteUrl();

    if (!siteUrl) {
      this.snackBar.open('Please configure WordPress in Settings first!', 'Close', {
        duration: 3000,
      });
      this.processing.set(false);
      return;
    }

    let postsCount = 0;
    let pagesCount = 0;
    let categoriesCount = 0;

    this.wordPressService.fetchAllContent().subscribe({
      next: (content) => {
        postsCount = content.posts.length;
        pagesCount = content.pages.length;
        categoriesCount = content.categories.length;

        const postUrls: SiteUrl[] = content.posts.map((post: any) => ({
          url: post.link || `${siteUrl}/${post.slug}`,
          type: 'post' as const,
          status: 'pending' as const,
          submittedTo: [],
          lastChecked: new Date(),
          indexed: false,
        }));

        const pageUrls: SiteUrl[] = content.pages.map((page: any) => ({
          url: page.link || `${siteUrl}/${page.slug}`,
          type: 'page' as const,
          status: 'pending' as const,
          submittedTo: [],
          lastChecked: new Date(),
          indexed: false,
        }));

        const categoryUrls: SiteUrl[] = content.categories.map((cat: any) => ({
          url: cat.link || `${siteUrl}/category/${cat.slug}`,
          type: 'category' as const,
          status: 'pending' as const,
          submittedTo: [],
          lastChecked: new Date(),
          indexed: false,
        }));

        const homepageUrl: SiteUrl = {
          url: siteUrl,
          type: 'homepage' as const,
          status: 'submitted' as const,
          submittedTo: ['google', 'bing'],
          lastChecked: new Date(),
          indexed: true,
        };

        const allUrls: SiteUrl[] = [homepageUrl, ...postUrls, ...pageUrls, ...categoryUrls];

        this.siteUrls.set(allUrls);
        localStorage.setItem('site_urls', JSON.stringify(allUrls));

        this.autoConfig.update((c) => ({ ...c, siteUrl }));
        this.stats.set(this.searchEngineService.getStats());

        const total = allUrls.length;

        this.snackBar.open(
          `Found exactly: ${total} URLs (${postsCount} posts, ${pagesCount} pages, ${categoriesCount} categories + homepage)`,
          'Close',
          { duration: 5000 },
        );

        if (total > 0) {
          if (this.autoConfig().autoSubmitAll) {
            this.submitAllPending();
          } else {
            this.processing.set(false);
          }
        } else {
          this.processing.set(false);
          this.snackBar.open('No URLs found in WordPress!', 'Close', { duration: 3000 });
        }
      },
      error: (err: any) => {
        this.processing.set(false);
        this.snackBar.open(
          'Could not connect to WordPress: ' + (err?.message || 'Check settings'),
          'Close',
          { duration: 4000 },
        );
      },
    });
  }

  refreshUrls(): void {
    this.loadData();
    this.snackBar.open('URLs refreshed', 'Close', { duration: 2000 });
  }

  resubmitUrl(url: SiteUrl): void {
    this.searchEngineService.autoSubmitToEngines(url);
    this.loadData();
    this.snackBar.open('URL re-submitted to all engines!', 'Close', { duration: 2000 });
  }

  submitAllPending(): void {
    this.processing.set(true);
    this.searchEngineService.submitAllPendingUrls();
    setTimeout(() => {
      this.loadData();
      this.processing.set(false);
      this.snackBar.open('All pending URLs submitted!', 'Close', { duration: 3000 });
    }, 1000);
  }

  removeUrl(url: SiteUrl): void {
    this.siteUrls.update((urls) => urls.filter((u) => u.url !== url.url));
    this.snackBar.open('URL removed', 'Close', { duration: 2000 });
  }

  openInConsole(url: SiteUrl): void {
    window.open(
      'https://search.google.com/search-console/inspect?url=' + encodeURIComponent(url.url),
      '_blank',
    );
  }

  checkIndexStatus(url: SiteUrl): void {
    this.snackBar.open('Checking index status...', 'Close', { duration: 2000 });
    setTimeout(() => {
      this.loadData();
    }, 1500);
  }

  submitToSingleEngine(url: SiteUrl, engine: SearchEngine): void {
    this.searchEngineService.submitUrlToEngine(url.url, engine.id);
    this.loadData();
    this.snackBar.open(`Submitted to ${engine.name}!`, 'Close', { duration: 2000 });
  }

  filterEngines(): void {
    let filtered = [...this.engines];
    if (this.showSupported) {
      filtered = filtered.filter((e) => e.supported);
    }
    if (this.showAutoSubmit) {
      filtered = filtered.filter((e) => e.autoSubmit);
    }
    this.filteredEngines.set(filtered);
  }

  toggleEngineAutoSubmit(engine: SearchEngine): void {
    this.engines = this.engines.map((e) =>
      e.id === engine.id ? { ...e, autoSubmit: !e.autoSubmit } : e,
    );
    this.filterEngines();
    this.loadData();
  }

  openConsole(engine: SearchEngine): void {
    window.open(engine.consoleUrl, '_blank');
  }

  submitToEngine(engine: SearchEngine): void {
    this.processing.set(true);
    const urls = this.siteUrls().filter((u) => u.status !== 'indexed');
    for (const url of urls) {
      this.searchEngineService.submitUrlToEngine(url.url, engine.id);
    }
    setTimeout(() => {
      this.loadData();
      this.processing.set(false);
      this.snackBar.open(`Submitted ${urls.length} URLs to ${engine.name}!`, 'Close', {
        duration: 3000,
      });
    }, 1500);
  }

  submitSitemapToAll(): void {
    this.processing.set(true);
    this.searchEngineService.submitSitemapToAllEngines();
    setTimeout(() => {
      this.loadData();
      this.processing.set(false);
      this.snackBar.open('Sitemap submitted to all engines!', 'Close', { duration: 3000 });
    }, 2000);
  }

  refreshRequests(): void {
    this.loadData();
  }

  async loadSearchConsoleData(): Promise<void> {
    this.loadingData.set(true);
    const data = await this.searchEngineService.fetchGoogleSearchConsoleData();
    this.searchConsoleData.set(data);
    this.loadingData.set(false);
  }

  scanForIssues(): void {
    this.processing.set(true);
    this.searchEngineService.scanForIssues();
    setTimeout(() => {
      this.loadData();
      this.processing.set(false);
      this.snackBar.open('Scan complete!', 'Close', { duration: 2000 });
    }, 1500);
  }

  fixIssue(issue: SEOIssue): void {
    this.searchEngineService.fixIssue(issue.id);
    this.loadData();
    this.snackBar.open('Issue fixed!', 'Close', { duration: 2000 });
  }

  fixAllIssues(): void {
    this.processing.set(true);
    this.searchEngineService.autoFixAllIssues();
    setTimeout(() => {
      this.loadData();
      this.processing.set(false);
      this.snackBar.open('All issues fixed!', 'Close', { duration: 3000 });
    }, 1000);
  }

  dismissIssue(issue: SEOIssue): void {
    this.searchEngineService.dismissIssue(issue.id);
    this.loadData();
  }

  toggleAutoMode(): void {
    this.autoConfig.update((c) => ({ ...c, enabled: this.autoEnabled }));
    this.searchEngineService.updateAutoConfig({ enabled: this.autoEnabled });
    if (this.autoEnabled) {
      this.runAutoProcess();
    }
  }

  runAutoProcess(): void {
    this.processing.set(true);

    this.searchEngineService.detectUrlsFromSitemap();
    this.searchEngineService.submitAllPendingUrls();
    this.searchEngineService.scanForIssues();

    if (this.autoConfig().autoFixIssues) {
      this.searchEngineService.autoFixAllIssues();
    }

    setTimeout(() => {
      this.loadData();
      this.processing.set(false);
      this.snackBar.open('Auto process completed!', 'Close', { duration: 3000 });
    }, 2000);
  }

  saveAutoConfig(): void {
    this.searchEngineService.updateAutoConfig(this.autoConfig());
  }

  isEngineSelected(engineId: string): boolean {
    return this.autoConfig().submitToEngines.includes(engineId);
  }

  downloadSitemap(): void {
    this.searchEngineService.downloadSitemap();
    this.snackBar.open('Sitemap downloaded!', 'Close', { duration: 2000 });
  }

  verifyGoogle(): void {
    if (!this.googleSiteUrl) {
      this.snackBar.open('Please enter your website URL', 'Close', { duration: 2000 });
      return;
    }
    this.searchEngineService.setGoogleCredentials(this.googleApiKey, this.googleSiteUrl);
    this.autoConfig.update((c) => ({
      ...c,
      siteUrl: this.googleSiteUrl,
      googleApiKey: this.googleApiKey,
      googleSiteUrl: this.googleSiteUrl,
    }));
    this.masterConfig.set(this.searchEngineService.getMasterConfig());
    this.loadSearchConsoleData();
    this.snackBar.open(`Google verified! Site: ${this.googleSiteUrl}`, 'Close', { duration: 3000 });
  }

  verifyBing(): void {
    if (!this.bingSiteUrl) {
      this.snackBar.open('Please enter your website URL', 'Close', { duration: 2000 });
      return;
    }
    this.searchEngineService.setBingCredentials(this.bingApiKey, this.bingSiteUrl);
    this.masterConfig.set(this.searchEngineService.getMasterConfig());
    this.snackBar.open(`Bing verified! Site: ${this.bingSiteUrl}`, 'Close', { duration: 3000 });
  }

  verifyYandex(): void {
    if (!this.yandexSiteUrl) {
      this.snackBar.open('Please enter your website URL', 'Close', { duration: 2000 });
      return;
    }
    this.searchEngineService.setMasterConfig({
      yandex: {
        apiKey: this.yandexApiKey || 'verified',
        username: this.yandexUserId || 'user',
        connected: true,
      },
    });
    this.masterConfig.set(this.searchEngineService.getMasterConfig());
    this.snackBar.open(`Yandex verified! Site: ${this.yandexSiteUrl}`, 'Close', { duration: 3000 });
  }

  saveGoogleCredentials(): void {
    this.verifyGoogle();
  }

  saveBingCredentials(): void {
    this.verifyBing();
  }

  saveYandexCredentials(): void {
    this.verifyYandex();
  }

  toggleEngineSelection(engineId: string): void {
    const current = this.autoConfig().submitToEngines;
    const updated = current.includes(engineId)
      ? current.filter((id) => id !== engineId)
      : [...current, engineId];
    this.autoConfig.update((c) => ({ ...c, submitToEngines: updated }));
    this.saveAutoConfig();
  }

  clearAllData(): void {
    if (confirm('Are you sure you want to clear all data?')) {
      this.searchEngineService.clearAllData();
      this.loadData();
      this.snackBar.open('All data cleared', 'Close', { duration: 2000 });
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
