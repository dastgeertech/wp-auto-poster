import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { MultiAIProviderService } from '../../core/services/multi-ai-provider.service';
import { SeoAnalyzerService } from '../../core/services/seo-analyzer.service';
import {
  ArticleAnalyzerService,
  AnalysisReport,
} from '../../core/services/article-analyzer.service';
import { TechTopicService } from '../../core/services/tech-topic.service';
import { SearchService } from '../../core/services/search.service';
import { ImageService } from '../../core/services/image.service';
import { WordPressService } from '../../core/services/wordpress.service';
import {
  SocialAutoPostService,
  SocialAccount,
  SocialPostResult,
} from '../../core/services/social-auto-post.service';
import {
  ContentTemplateService,
  ContentTemplate,
} from '../../core/services/content-template.service';
import {
  ContentSchedulerService,
  ScheduledContent,
} from '../../core/services/content-scheduler.service';
import {
  BulkGenerationService,
  BulkJob,
  BulkResult,
} from '../../core/services/bulk-generation.service';
import { TechTopic } from '../../core/models';

interface QueueItem {
  id: string;
  keyword: string;
  status:
    | 'pending'
    | 'researching'
    | 'generating'
    | 'optimizing'
    | 'publishing'
    | 'completed'
    | 'failed';
  seoScore?: number;
  wordCount?: number;
  error?: string;
  progress: number;
  language: string;
  startedAt?: Date;
  completedAt?: Date;
}

interface ActivityEntry {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  detail?: string;
  timestamp: Date;
}

interface ScheduledPost {
  id: string;
  keyword: string;
  scheduledTime: Date;
  status: 'scheduled' | 'published' | 'failed';
}

interface CompetitorResult {
  keyword: string;
  topResult: {
    title: string;
    url: string;
    da: number;
    wordCount: number;
  };
  gaps: string[];
  opportunities: string[];
}

interface BulkImportResult {
  valid: number;
  duplicates: number;
  invalid: number;
}

@Component({
  selector: 'app-ai-auto-poster',
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
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressBarModule,
    MatDialogModule,
    MatBadgeModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatExpansionModule,
  ],
  template: `
    <div class="ai-auto-poster">
      <!-- Top Stats Bar -->
      <div class="stats-bar">
        <div class="stat-card" *ngFor="let stat of topStats()">
          <div class="stat-icon" [style.background]="stat.bgColor">
            <mat-icon>{{ stat.icon }}</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
          <div class="stat-trend" [class.up]="stat.trend > 0" [class.down]="stat.trend < 0">
            <mat-icon>{{
              stat.trend > 0 ? 'trending_up' : stat.trend < 0 ? 'trending_down' : 'trending_flat'
            }}</mat-icon>
            {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <mat-tab-group animationDuration="300ms" class="main-tabs">
        <!-- Dashboard Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </ng-template>

          <div class="tab-content">
            <div class="dashboard-grid">
              <!-- Quick Actions -->
              <div class="panel control-panel">
                <div class="panel-header">
                  <h3><mat-icon>bolt</mat-icon> Quick Actions</h3>
                  <div class="header-actions">
                    <button mat-mini-fab (click)="refreshAll()" matTooltip="Refresh">
                      <mat-icon>refresh</mat-icon>
                    </button>
                  </div>
                </div>

                <div class="action-grid">
                  <button
                    class="action-card primary"
                    (click)="startAutoPoster()"
                    [disabled]="isRunning() || queueCount() === 0"
                  >
                    <div class="action-icon">
                      @if (isRunning()) {
                        <mat-spinner diameter="32"></mat-spinner>
                      } @else {
                        <mat-icon>play_arrow</mat-icon>
                      }
                    </div>
                    <span class="action-label">{{
                      isRunning() ? 'Processing...' : 'Start Auto-Post'
                    }}</span>
                  </button>

                  <button class="action-card" (click)="showBulkAdd = true">
                    <div class="action-icon">
                      <mat-icon>library_add</mat-icon>
                    </div>
                    <span class="action-label">Bulk Add</span>
                  </button>

                  <button class="action-card" (click)="analyzeCompetitors()">
                    <div class="action-icon">
                      <mat-icon>analytics</mat-icon>
                    </div>
                    <span class="action-label">Competitor Analysis</span>
                  </button>

                  <button class="action-card" (click)="generateContentIdeas()">
                    <div class="action-icon">
                      <mat-icon>lightbulb</mat-icon>
                    </div>
                    <span class="action-label">Content Ideas</span>
                  </button>
                </div>

                <!-- Settings -->
                <div class="settings-section">
                  <h4>Configuration</h4>
                  <div class="setting-row">
                    <label>Topics per cycle</label>
                    <mat-select [(ngModel)]="topicsPerCycle">
                      <mat-option [value]="3">3</mat-option>
                      <mat-option [value]="5">5</mat-option>
                      <mat-option [value]="10">10</mat-option>
                      <mat-option [value]="15">15</mat-option>
                    </mat-select>
                  </div>
                  <div class="setting-row">
                    <label>Interval</label>
                    <mat-select [(ngModel)]="intervalMinutes">
                      <mat-option [value]="15">15 min</mat-option>
                      <mat-option [value]="30">30 min</mat-option>
                      <mat-option [value]="60">1 hour</mat-option>
                      <mat-option [value]="120">2 hours</mat-option>
                    </mat-select>
                  </div>
                  <div class="setting-row">
                    <label>Language</label>
                    <mat-select [(ngModel)]="defaultLanguage">
                      <mat-option value="en">English</mat-option>
                      <mat-option value="es">Spanish</mat-option>
                      <mat-option value="fr">French</mat-option>
                      <mat-option value="de">German</mat-option>
                      <mat-option value="pt">Portuguese</mat-option>
                      <mat-option value="it">Italian</mat-option>
                      <mat-option value="ar">Arabic</mat-option>
                      <mat-option value="hi">Hindi</mat-option>
                    </mat-select>
                  </div>
                  <div class="setting-row">
                    <label>Auto-publish</label>
                    <mat-slide-toggle [(ngModel)]="autoPublish"></mat-slide-toggle>
                  </div>
                  <div class="setting-row">
                    <label>Live data</label>
                    <mat-slide-toggle [(ngModel)]="useLiveData"></mat-slide-toggle>
                  </div>
                </div>
              </div>

              <!-- Queue Panel -->
              <div class="panel queue-panel">
                <div class="panel-header">
                  <h3><mat-icon>queue</mat-icon> Content Queue</h3>
                  <span class="count-badge">{{ queueCount() }}</span>
                </div>

                <div class="queue-toolbar">
                  <input
                    type="text"
                    [(ngModel)]="newKeyword"
                    placeholder="Enter keyword..."
                    class="quick-input"
                    (keyup.enter)="addKeyword()"
                  />
                  <button mat-icon-button (click)="addKeyword()" [disabled]="!newKeyword.trim()">
                    <mat-icon>add</mat-icon>
                  </button>
                  <button mat-icon-button [matMenuTriggerFor]="queueMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #queueMenu="matMenu">
                    <button mat-menu-item (click)="loadTrendingTopics()">
                      <mat-icon>trending_up</mat-icon> Load Topics
                    </button>
                    <button mat-menu-item (click)="shuffleQueue()">
                      <mat-icon>shuffle</mat-icon> Shuffle
                    </button>
                    <button mat-menu-item (click)="clearQueue()">
                      <mat-icon>clear_all</mat-icon> Clear All
                    </button>
                  </mat-menu>
                </div>

                <div class="queue-list">
                  @for (item of queue(); track item.id) {
                    <div class="queue-item" [class]="'status-' + item.status">
                      <div class="item-drag">
                        <mat-icon>drag_indicator</mat-icon>
                      </div>
                      <div class="item-content">
                        <div class="item-header">
                          <span class="item-keyword">{{ item.keyword }}</span>
                          <span class="item-lang">{{ item.language.toUpperCase() }}</span>
                        </div>
                        <div class="item-meta">
                          @if (item.status === 'completed' && item.seoScore) {
                            <span class="seo-score good">{{ item.seoScore }}%</span>
                          }
                          @if (item.wordCount) {
                            <span class="word-count">{{ item.wordCount }}w</span>
                          }
                          @if (item.error) {
                            <span class="error-text">{{ item.error }}</span>
                          }
                        </div>
                      </div>
                      <div class="item-actions">
                        @if (item.status === 'pending') {
                          <button mat-icon-button (click)="removeItem(item.id)" matTooltip="Remove">
                            <mat-icon>delete</mat-icon>
                          </button>
                          <button
                            mat-icon-button
                            (click)="processItem(item)"
                            matTooltip="Generate Now"
                          >
                            <mat-icon>play_arrow</mat-icon>
                          </button>
                        }
                        @if (item.status === 'completed') {
                          <button mat-icon-button matTooltip="View">
                            <mat-icon>visibility</mat-icon>
                          </button>
                        }
                      </div>
                      @if (
                        item.status !== 'pending' &&
                        item.status !== 'completed' &&
                        item.status !== 'failed'
                      ) {
                        <div class="item-progress">
                          <mat-progress-bar
                            mode="determinate"
                            [value]="item.progress"
                          ></mat-progress-bar>
                        </div>
                      }
                    </div>
                  } @empty {
                    <div class="empty-queue">
                      <mat-icon>inbox</mat-icon>
                      <p>Queue is empty</p>
                      <button class="btn-outline" (click)="loadTrendingTopics()">
                        Load Trending Topics
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Live Activity -->
              <div class="panel activity-panel">
                <div class="panel-header">
                  <h3><mat-icon>feed</mat-icon> Live Activity</h3>
                  <span class="live-indicator"> <span class="pulse"></span> LIVE </span>
                </div>

                @if (isRunning() && currentItem()) {
                  <div class="current-processing">
                    <div class="processing-header">
                      <mat-icon>sync</mat-icon>
                      <span>Processing: {{ currentItem()!.keyword }}</span>
                    </div>
                    <div class="processing-steps">
                      @for (step of processingSteps; track step.idx) {
                        <div
                          class="step"
                          [class.active]="currentStep() >= step.idx"
                          [class.completed]="currentStep() > step.idx"
                        >
                          <div class="step-icon">
                            @if (currentStep() > step.idx) {
                              <mat-icon>check_circle</mat-icon>
                            } @else if (currentStep() === step.idx) {
                              <mat-spinner diameter="16"></mat-spinner>
                            } @else {
                              <mat-icon>{{ step.icon }}</mat-icon>
                            }
                          </div>
                          <span>{{ step.label }}</span>
                        </div>
                      }
                    </div>
                    <mat-progress-bar
                      mode="determinate"
                      [value]="currentItem()!.progress"
                    ></mat-progress-bar>
                  </div>
                }

                <div class="activity-feed">
                  @for (entry of activity(); track entry.id) {
                    <div class="activity-entry" [class]="'type-' + entry.type">
                      <div class="entry-icon">
                        <mat-icon>{{ getActivityIcon(entry.type) }}</mat-icon>
                      </div>
                      <div class="entry-content">
                        <span class="entry-message">{{ entry.message }}</span>
                        @if (entry.detail) {
                          <span class="entry-detail">{{ entry.detail }}</span>
                        }
                        <span class="entry-time">{{ formatTime(entry.timestamp) }}</span>
                      </div>
                    </div>
                  } @empty {
                    <div class="no-activity">
                      <mat-icon>history</mat-icon>
                      <p>No activity yet</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Trending Topics -->
              <div class="panel topics-panel">
                <div class="panel-header">
                  <h3><mat-icon>trending_up</mat-icon> Trending Topics</h3>
                  <button mat-icon-button (click)="loadTrendingTopics()">
                    <mat-icon>refresh</mat-icon>
                  </button>
                </div>

                <div class="topics-grid">
                  @for (topic of trendingTopics(); track topic.keyword) {
                    <div class="topic-card" (click)="addToQueueWithLang(topic.keyword)">
                      <div class="topic-header">
                        <mat-icon>{{ getTopicIcon(topic.category) }}</mat-icon>
                        <span class="topic-category">{{ topic.category }}</span>
                      </div>
                      <h4>{{ topic.keyword }}</h4>
                      <div class="topic-footer">
                        <span class="viral-badge" [class]="topic.viralPotential">
                          {{ topic.viralPotential }} viral
                        </span>
                        <button mat-icon-button>
                          <mat-icon>add</mat-icon>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Competitor Analysis Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>analytics</mat-icon>
            <span>Competitor Analysis</span>
          </ng-template>

          <div class="tab-content">
            <div class="competitor-section">
              <div class="competitor-input">
                <h3>Enter keyword to analyze competitors</h3>
                <div class="input-row">
                  <input
                    type="text"
                    [(ngModel)]="competitorKeyword"
                    placeholder="Enter a keyword..."
                    class="keyword-input"
                  />
                  <mat-select [(ngModel)]="competitorLanguage" class="lang-select">
                    <mat-option value="en">English</mat-option>
                    <mat-option value="es">Spanish</mat-option>
                  </mat-select>
                  <button
                    class="btn-primary"
                    (click)="runCompetitorAnalysis()"
                    [disabled]="analyzing()"
                  >
                    @if (analyzing()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      <mat-icon>search</mat-icon>
                    }
                    Analyze
                  </button>
                </div>
              </div>

              @if (competitorResults()) {
                <div class="competitor-results">
                  <div class="result-card top-performer">
                    <h4>Top Performer</h4>
                    <div class="result-content">
                      <h5>{{ competitorResults()!.topResult.title }}</h5>
                      <p class="result-url">{{ competitorResults()!.topResult.url }}</p>
                      <div class="result-metrics">
                        <div class="metric">
                          <span class="metric-value">{{ competitorResults()!.topResult.da }}</span>
                          <span class="metric-label">Domain Authority</span>
                        </div>
                        <div class="metric">
                          <span class="metric-value">{{
                            competitorResults()!.topResult.wordCount
                          }}</span>
                          <span class="metric-label">Words</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="result-card gaps">
                    <h4>Content Gaps</h4>
                    <ul>
                      @for (gap of competitorResults()!.gaps; track gap) {
                        <li>
                          <mat-icon>radio_button_unchecked</mat-icon>
                          {{ gap }}
                        </li>
                      }
                    </ul>
                  </div>

                  <div class="result-card opportunities">
                    <h4>Opportunities</h4>
                    <ul>
                      @for (opp of competitorResults()!.opportunities; track opp) {
                        <li>
                          <mat-icon>check_circle</mat-icon>
                          {{ opp }}
                        </li>
                      }
                    </ul>
                  </div>

                  <div class="result-card action">
                    <h4>Recommended Action</h4>
                    <p>
                      Create a comprehensive article covering
                      {{ competitorResults()!.gaps.length }} content gaps identified. Target word
                      count: 2000+ words with better structure.
                    </p>
                    <button class="btn-primary" (click)="addCompetitorToQueue()">
                      <mat-icon>add</mat-icon>
                      Create This Content
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Content Calendar Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>calendar_month</mat-icon>
            <span>Content Calendar</span>
          </ng-template>

          <div class="tab-content">
            <div class="calendar-header">
              <h3>March 2026</h3>
              <div class="calendar-nav">
                <button mat-icon-button>
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <button mat-icon-button>
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            </div>

            <div class="calendar-grid">
              @for (day of calendarDays(); track day.date) {
                <div
                  class="calendar-day"
                  [class.today]="day.isToday"
                  [class.has-posts]="day.posts.length > 0"
                >
                  <div class="day-header">
                    <span class="day-name">{{ day.dayName }}</span>
                    <span class="day-number">{{ day.date }}</span>
                  </div>
                  <div class="day-posts">
                    @for (post of day.posts; track post.id) {
                      <div class="post-chip" [class]="post.status">
                        {{ post.keyword }}
                      </div>
                    }
                  </div>
                  <button class="add-post-btn" (click)="schedulePost(day.date)">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Content Ideas Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>lightbulb</mat-icon>
            <span>Content Ideas</span>
          </ng-template>

          <div class="tab-content">
            <div class="ideas-section">
              <div class="ideas-toolbar">
                <mat-form-field appearance="outline" class="search-field">
                  <mat-label>Generate ideas for...</mat-label>
                  <input matInput [(ngModel)]="ideaKeyword" placeholder="Enter main topic..." />
                </mat-form-field>
                <button
                  class="btn-primary"
                  (click)="generateContentIdeas()"
                  [disabled]="generatingIdeas()"
                >
                  @if (generatingIdeas()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  }
                  Generate Ideas
                </button>
              </div>

              @if (contentIdeas().length > 0) {
                <div class="ideas-grid">
                  @for (idea of contentIdeas(); track idea.title) {
                    <div class="idea-card">
                      <div class="idea-type">
                        <mat-icon>{{ idea.icon }}</mat-icon>
                        {{ idea.type }}
                      </div>
                      <h4>{{ idea.title }}</h4>
                      <p>{{ idea.description }}</p>
                      <div class="idea-meta">
                        <span class="word-estimate">{{ idea.wordEstimate }} words</span>
                        <span class="difficulty" [class]="idea.difficulty">{{
                          idea.difficulty
                        }}</span>
                      </div>
                      <button class="btn-outline" (click)="useIdea(idea)">Use This Idea</button>
                    </div>
                  }
                </div>
              } @else {
                <div class="no-ideas">
                  <mat-icon>lightbulb</mat-icon>
                  <p>Enter a topic and click "Generate Ideas" to get content ideas</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Performance Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>bar_chart</mat-icon>
            <span>Performance</span>
          </ng-template>

          <div class="tab-content">
            <div class="performance-grid">
              <div class="performance-card">
                <h4>SEO Score Distribution</h4>
                <div class="score-chart">
                  @for (score of scoreDistribution(); track score.range) {
                    <div class="score-bar">
                      <div class="bar-label">{{ score.range }}</div>
                      <div
                        class="bar-fill"
                        [style.width.%]="score.percent"
                        [class]="score.class"
                      ></div>
                      <div class="bar-count">{{ score.count }}</div>
                    </div>
                  }
                </div>
              </div>

              <div class="performance-card">
                <h4>Posts Over Time</h4>
                <div class="time-chart">
                  @for (day of weeklyData(); track day.label) {
                    <div class="chart-column">
                      <div class="column-bar" [style.height.%]="day.percent"></div>
                      <span class="column-label">{{ day.label }}</span>
                      <span class="column-value">{{ day.count }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="performance-card top-topics">
                <h4>Top Performing Topics</h4>
                <div class="topic-list">
                  @for (topic of topTopics(); track topic.keyword) {
                    <div class="topic-row">
                      <span class="topic-keyword">{{ topic.keyword }}</span>
                      <div class="topic-bar" [style.width.%]="topic.percent"></div>
                      <span class="topic-score">{{ topic.avgScore }}%</span>
                    </div>
                  }
                </div>
              </div>

              <div class="performance-card recent-posts">
                <h4>Recent Posts</h4>
                <div class="posts-list">
                  @for (post of recentPosts(); track post.id) {
                    <div class="post-row">
                      <div class="post-info">
                        <span class="post-title">{{ post.title }}</span>
                        <span class="post-date">{{ post.date | date: 'short' }}</span>
                      </div>
                      <div class="post-score" [class]="getScoreClass(post.score)">
                        {{ post.score }}%
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Social Auto-Post Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>share</mat-icon>
            <span>Social Auto-Post</span>
            @if (connectedSocialCount() > 0) {
              <span class="tab-badge">{{ connectedSocialCount() }}</span>
            }
          </ng-template>

          <div class="tab-content">
            <div class="social-section">
              <!-- Connected Accounts -->
              <div class="social-accounts">
                @for (account of socialAccounts(); track account.platform) {
                  <div class="account-card" [class.connected]="account.connected">
                    <div class="account-icon">
                      @if (account.platform === 'twitter') {
                        <svg viewBox="0 0 24 24" width="24" height="24">
                          <path
                            fill="currentColor"
                            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                          />
                        </svg>
                      } @else if (account.platform === 'linkedin') {
                        <svg viewBox="0 0 24 24" width="24" height="24">
                          <path
                            fill="currentColor"
                            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                          />
                        </svg>
                      } @else {
                        <svg viewBox="0 0 24 24" width="24" height="24">
                          <path
                            fill="currentColor"
                            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                          />
                        </svg>
                      }
                    </div>
                    <div class="account-info">
                      <h4>{{ getPlatformName(account.platform) }}</h4>
                      <span class="account-status">{{
                        account.connected ? 'Connected' : 'Not Connected'
                      }}</span>
                    </div>
                    @if (account.connected) {
                      <button
                        class="btn-outline-small"
                        (click)="disconnectSocial(account.platform)"
                      >
                        Disconnect
                      </button>
                    } @else {
                      <button class="btn-primary-small" (click)="connectSocial(account.platform)">
                        Connect
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Auto-Post Settings -->
              <div class="auto-post-settings">
                <h3><mat-icon>settings</mat-icon> Auto-Post Settings</h3>
                <div class="setting-toggle">
                  <mat-slide-toggle [(ngModel)]="autoPostEnabled">
                    Enable auto-post after publishing
                  </mat-slide-toggle>
                </div>
                @if (autoPostEnabled) {
                  <div class="platform-toggles">
                    <label>Select platforms:</label>
                    <div class="toggle-group">
                      <mat-checkbox [(ngModel)]="autoPostTwitter">Twitter/X</mat-checkbox>
                      <mat-checkbox [(ngModel)]="autoPostLinkedin">LinkedIn</mat-checkbox>
                      <mat-checkbox [(ngModel)]="autoPostFacebook">Facebook</mat-checkbox>
                    </div>
                  </div>
                  <div class="custom-message">
                    <label>Custom message template:</label>
                    <textarea
                      [(ngModel)]="customSocialMessage"
                      placeholder="New article: title - excerpt"
                    ></textarea>
                    <span class="hint">Use title, excerpt, url as placeholders</span>
                  </div>
                }
              </div>

              <!-- Recent Social Posts -->
              <div class="recent-social">
                <h3><mat-icon>history</mat-icon> Recent Social Posts</h3>
                @if (socialPosts().length > 0) {
                  <div class="social-post-list">
                    @for (post of socialPosts(); track post.id) {
                      <div class="social-post-item">
                        <div class="post-platform-icon">
                          @if (post.platform === 'twitter') {
                            <svg viewBox="0 0 24 24" width="16" height="16">
                              <path
                                fill="currentColor"
                                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                              />
                            </svg>
                          } @else if (post.platform === 'linkedin') {
                            <svg viewBox="0 0 24 24" width="16" height="16">
                              <path
                                fill="currentColor"
                                d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z"
                              />
                            </svg>
                          } @else {
                            <svg viewBox="0 0 24 24" width="16" height="16">
                              <path
                                fill="currentColor"
                                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                              />
                            </svg>
                          }
                        </div>
                        <div class="post-content">
                          <p>{{ post.content }}</p>
                          <span class="post-time">{{ post.timestamp | date: 'short' }}</span>
                        </div>
                        @if (post.success) {
                          <mat-icon class="success">check_circle</mat-icon>
                        } @else {
                          <mat-icon class="error">error</mat-icon>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <div class="no-posts">
                    <mat-icon>share</mat-icon>
                    <p>No social posts yet</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Content Templates Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>description</mat-icon>
            <span>Templates</span>
          </ng-template>

          <div class="tab-content">
            <div class="templates-section">
              <div class="templates-toolbar">
                <mat-form-field appearance="outline" class="search-field">
                  <mat-label>Search templates</mat-label>
                  <input matInput [(ngModel)]="templateSearch" placeholder="Search..." />
                  <mat-icon matPrefix>search</mat-icon>
                </mat-form-field>
                <button class="btn-primary" (click)="showTemplateModal = true">
                  <mat-icon>add</mat-icon>
                  Create Template
                </button>
              </div>

              <div class="templates-grid">
                @for (template of filteredTemplates(); track template.id) {
                  <div
                    class="template-card"
                    [class.selected]="selectedTemplate?.id === template.id"
                    (click)="selectTemplate(template)"
                  >
                    <div class="template-header">
                      <mat-icon>{{ template.icon }}</mat-icon>
                      <span class="template-badge" [class]="template.tone">{{
                        template.tone
                      }}</span>
                    </div>
                    <h4>{{ template.name }}</h4>
                    <p>{{ template.description }}</p>
                    <div class="template-meta">
                      <span
                        ><mat-icon>text_fields</mat-icon>
                        {{ template.defaultWordCount }} words</span
                      >
                      <span
                        ><mat-icon>list</mat-icon> {{ template.structure.length }} sections</span
                      >
                    </div>
                    <div class="template-features">
                      @if (template.includeToc) {
                        <span class="feature-badge">TOC</span>
                      }
                      @if (template.includeFaq) {
                        <span class="feature-badge">FAQ</span>
                      }
                    </div>
                    <div class="template-actions">
                      <button
                        class="btn-outline"
                        (click)="previewTemplate(template); $event.stopPropagation()"
                      >
                        <mat-icon>visibility</mat-icon> Preview
                      </button>
                      <button
                        class="btn-primary-small"
                        (click)="useTemplate(template); $event.stopPropagation()"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Bulk Generation Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>library_add</mat-icon>
            <span>Bulk Generate</span>
            @if (bulkJobs().length > 0) {
              <span class="tab-badge">{{ bulkJobs().length }}</span>
            }
          </ng-template>

          <div class="tab-content">
            <div class="bulk-section">
              <!-- Bulk Import -->
              <div class="bulk-import-panel">
                <h3><mat-icon>upload</mat-icon> Import Keywords</h3>
                <textarea
                  [(ngModel)]="bulkImportText"
                  placeholder="Enter keywords (one per line or comma separated)..."
                  rows="8"
                ></textarea>
                <div class="import-stats">
                  <span class="stat valid">{{ getImportStats().valid }} valid</span>
                  <span class="stat duplicates">{{ getImportStats().duplicates }} duplicates</span>
                  <span class="stat invalid">{{ getImportStats().invalid }} invalid</span>
                </div>
                <div class="import-options">
                  <mat-form-field appearance="outline">
                    <mat-label>Language</mat-label>
                    <mat-select [(ngModel)]="bulkLanguage">
                      <mat-option value="en">English</mat-option>
                      <mat-option value="es">Spanish</mat-option>
                      <mat-option value="fr">French</mat-option>
                      <mat-option value="de">German</mat-option>
                      <mat-option value="pt">Portuguese</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Template</mat-label>
                    <mat-select [(ngModel)]="bulkTemplate">
                      @for (template of templates(); track template.id) {
                        <mat-option [value]="template.id">{{ template.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="import-actions">
                  <button class="btn-outline" (click)="parseBulkKeywords()">
                    <mat-icon>rule</mat-icon> Validate
                  </button>
                  <button
                    class="btn-primary"
                    (click)="startBulkGeneration()"
                    [disabled]="getImportStats().valid === 0 || isBulkProcessing()"
                  >
                    @if (isBulkProcessing()) {
                      <mat-spinner diameter="16"></mat-spinner>
                    } @else {
                      <mat-icon>play_arrow</mat-icon>
                    }
                    Generate {{ getImportStats().valid }} Articles
                  </button>
                </div>
              </div>

              <!-- Bulk Jobs List -->
              <div class="bulk-jobs-panel">
                <h3><mat-icon>list</mat-icon> Generation Jobs</h3>
                @if (bulkJobs().length > 0) {
                  <div class="jobs-list">
                    @for (job of bulkJobs(); track job.id) {
                      <div class="job-card" [class]="job.status">
                        <div class="job-header">
                          <span class="job-id">#{{ job.id.slice(-6) }}</span>
                          <span class="job-status-badge" [class]="job.status">{{
                            job.status
                          }}</span>
                        </div>
                        <div class="job-progress">
                          <div class="progress-bar">
                            <div class="progress-fill" [style.width.%]="job.progress"></div>
                          </div>
                          <span class="progress-text"
                            >{{ job.progress }}% ({{ job.currentIndex }}/{{
                              job.keywords.length
                            }})</span
                          >
                        </div>
                        @if (job.currentKeyword) {
                          <p class="current-keyword">
                            Processing: <strong>{{ job.currentKeyword }}</strong>
                          </p>
                        }
                        <div class="job-stats">
                          <span class="stat success">{{ job.results.length }}</span> processed
                          <span
                            class="stat failed"
                            >{{ job.results.filter(r => r.status === 'failed').length }}</span
                          >
                          failed
                        </div>
                        <div class="job-actions">
                          @if (job.status === 'processing') {
                            <button class="btn-outline-small" (click)="pauseBulkJob(job.id)">
                              <mat-icon>pause</mat-icon>
                            </button>
                          } @else if (job.status === 'paused') {
                            <button class="btn-outline-small" (click)="resumeBulkJob(job.id)">
                              <mat-icon>play_arrow</mat-icon>
                            </button>
                          }
                          <button class="btn-outline-small" (click)="cancelBulkJob(job.id)">
                            <mat-icon>stop</mat-icon>
                          </button>
                          <button class="btn-outline-small" (click)="viewBulkResults(job.id)">
                            <mat-icon>visibility</mat-icon>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="no-jobs">
                    <mat-icon>inbox</mat-icon>
                    <p>No bulk generation jobs</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Bulk Add Modal -->
      @if (showBulkAdd) {
        <div class="modal-overlay" (click)="showBulkAdd = false">
          <div class="modal bulk-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Bulk Add Keywords</h3>
              <button mat-icon-button (click)="showBulkAdd = false">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="modal-body">
              <textarea
                [(ngModel)]="bulkKeywords"
                placeholder="Enter keywords (one per line)..."
                rows="12"
              ></textarea>
              <div class="bulk-options">
                <mat-form-field appearance="outline">
                  <mat-label>Language</mat-label>
                  <mat-select [(ngModel)]="bulkLanguage">
                    <mat-option value="en">English</mat-option>
                    <mat-option value="es">Spanish</mat-option>
                    <mat-option value="fr">French</mat-option>
                    <mat-option value="de">German</mat-option>
                  </mat-select>
                </mat-form-field>
                <div class="count-info">{{ getBulkCount() }} keywords will be added</div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-outline" (click)="showBulkAdd = false">Cancel</button>
              <button class="btn-primary" (click)="addBulkKeywords()">Add to Queue</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .ai-auto-poster {
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
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

      .stats-bar {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 20px;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        border: 1px solid rgba(233, 69, 96, 0.1);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          border-color: rgba(233, 69, 96, 0.3);
        }
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: white;
        }
      }

      .stat-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #ffffff;
      }

      .stat-label {
        font-size: 12px;
        color: #a0a0b8;
      }

      .stat-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #666;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }

        &.up {
          color: #00d9a5;
        }
        &.down {
          color: #ff6b6b;
        }
      }

      .main-tabs {
        background: transparent;
      }

      ::ng-deep .mat-mdc-tab-labels {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        padding: 4px;
      }

      ::ng-deep .mat-mdc-tab {
        min-width: 140px;
      }

      ::ng-deep .mat-mdc-tab-label-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tab-content {
        padding: 24px 0;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 320px 1fr 300px 320px;
        gap: 20px;
      }

      .panel {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        border: 1px solid rgba(233, 69, 96, 0.1);
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;

          mat-icon {
            color: #e94560;
          }
        }
      }

      .action-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding: 16px;
      }

      .action-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 20px 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(233, 69, 96, 0.3);
          transform: translateY(-2px);
        }

        &.primary {
          grid-column: 1 / -1;
          background: linear-gradient(
            135deg,
            rgba(233, 69, 96, 0.2) 0%,
            rgba(255, 107, 107, 0.2) 100%
          );
          border-color: rgba(233, 69, 96, 0.3);

          .action-icon {
            background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
          }
        }

        .action-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(233, 69, 96, 0.15);

          mat-icon {
            font-size: 28px;
            width: 28px;
            height: 28px;
            color: #e94560;
          }
        }

        .action-label {
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
          text-align: center;
        }
      }

      .settings-section {
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);

        h4 {
          margin: 0 0 12px;
          font-size: 12px;
          color: #a0a0b8;
          text-transform: uppercase;
        }
      }

      .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);

        label {
          font-size: 13px;
          color: #ffffff;
        }

        mat-select {
          width: 120px;
        }

        mat-slide-toggle {
          transform: scale(0.85);
        }
      }

      .queue-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .quick-input {
        flex: 1;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #ffffff;
        font-size: 13px;
        outline: none;

        &:focus {
          border-color: #e94560;
        }

        &::placeholder {
          color: #666;
        }
      }

      .queue-list {
        max-height: 500px;
        overflow-y: auto;
      }

      .queue-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        position: relative;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        &.status-pending {
          border-left: 3px solid #a0a0b8;
        }
        &.status-researching,
        &.status-generating,
        &.status-optimizing,
        &.status-publishing {
          border-left: 3px solid #ffc107;
          background: rgba(255, 193, 7, 0.05);
        }
        &.status-completed {
          border-left: 3px solid #00d9a5;
        }
        &.status-failed {
          border-left: 3px solid #ff6b6b;
        }
      }

      .item-drag {
        cursor: grab;
        color: #444;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .item-content {
        flex: 1;
      }

      .item-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .item-keyword {
        font-size: 13px;
        color: #ffffff;
        font-weight: 500;
      }

      .item-lang {
        font-size: 10px;
        padding: 2px 6px;
        background: rgba(233, 69, 96, 0.2);
        color: #e94560;
        border-radius: 4px;
      }

      .item-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;

        .seo-score {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;

          &.good {
            background: rgba(0, 217, 165, 0.2);
            color: #00d9a5;
          }
          &.medium {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
          }
          &.poor {
            background: rgba(255, 107, 107, 0.2);
            color: #ff6b6b;
          }
        }

        .word-count {
          font-size: 11px;
          color: #666;
        }

        .error-text {
          font-size: 11px;
          color: #ff6b6b;
        }
      }

      .item-actions {
        display: flex;
        gap: 4px;
      }

      .item-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;

        mat-progress-bar {
          height: 2px;
        }
      }

      .empty-queue {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
        color: #666;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          opacity: 0.3;
        }

        p {
          margin: 12px 0;
        }
      }

      .btn-outline {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: transparent;
        color: #e94560;
        border: 1px solid #e94560;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(233, 69, 96, 0.1);
        }
      }

      .current-processing {
        padding: 16px;
        background: rgba(233, 69, 96, 0.05);
        border-bottom: 1px solid rgba(233, 69, 96, 0.1);
      }

      .processing-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;

        mat-icon {
          color: #ffc107;
          animation: spin 1s linear infinite;
        }

        span {
          font-size: 13px;
          color: #ffffff;
          font-weight: 500;
        }
      }

      .processing-steps {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        opacity: 0.4;

        .step-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: #a0a0b8;
          }
        }

        span {
          font-size: 10px;
          color: #a0a0b8;
        }

        &.active {
          opacity: 1;

          .step-icon {
            background: rgba(255, 193, 7, 0.2);

            mat-icon {
              color: #ffc107;
            }
          }

          span {
            color: #ffffff;
          }
        }

        &.completed {
          opacity: 1;

          .step-icon {
            background: rgba(0, 217, 165, 0.2);

            mat-icon {
              color: #00d9a5;
            }
          }

          span {
            color: #00d9a5;
          }
        }
      }

      .activity-feed {
        max-height: 400px;
        overflow-y: auto;
      }

      .activity-entry {
        display: flex;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);

        &.type-success .entry-icon mat-icon {
          color: #00d9a5;
        }
        &.type-error .entry-icon mat-icon {
          color: #ff6b6b;
        }
        &.type-warning .entry-icon mat-icon {
          color: #ffc107;
        }
        &.type-info .entry-icon mat-icon {
          color: #64b5f6;
        }
      }

      .entry-icon mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .entry-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .entry-message {
        font-size: 13px;
        color: #ffffff;
      }

      .entry-detail {
        font-size: 11px;
        color: #666;
      }

      .entry-time {
        font-size: 10px;
        color: #555;
      }

      .live-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #ff6b6b;
        font-weight: 600;

        .pulse {
          width: 8px;
          height: 8px;
          background: #ff6b6b;
          border-radius: 50%;
          animation: pulse 1.5s ease infinite;
        }
      }

      .topics-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        padding: 16px;
        max-height: 500px;
        overflow-y: auto;
      }

      .topic-card {
        padding: 14px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #e94560;
          background: rgba(233, 69, 96, 0.05);
        }

        .topic-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: #e94560;
          }

          .topic-category {
            font-size: 10px;
            color: #00d9a5;
            text-transform: uppercase;
          }
        }

        h4 {
          margin: 0 0 10px;
          font-size: 14px;
          color: #ffffff;
        }

        .topic-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .viral-badge {
            font-size: 10px;
            padding: 2px 8px;
            border-radius: 4px;

            &.high {
              background: rgba(0, 217, 165, 0.2);
              color: #00d9a5;
            }
            &.medium {
              background: rgba(255, 193, 7, 0.2);
              color: #ffc107;
            }
            &.low {
              background: rgba(255, 255, 255, 0.1);
              color: #a0a0b8;
            }
          }
        }
      }

      .no-activity {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
        color: #666;

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          opacity: 0.3;
        }
      }

      .count-badge {
        background: #e94560;
        color: white;
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
      }

      /* Competitor Analysis */
      .competitor-section {
        max-width: 1200px;
        margin: 0 auto;
      }

      .competitor-input {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;

        h3 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #ffffff;
        }

        .input-row {
          display: flex;
          gap: 12px;
        }

        .keyword-input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #ffffff;
          font-size: 14px;
          outline: none;

          &:focus {
            border-color: #e94560;
          }
        }

        .lang-select {
          width: 120px;
        }
      }

      .btn-primary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
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

      .competitor-results {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }

      .result-card {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;

        &.top-performer {
          grid-column: 1 / -1;
          border: 1px solid rgba(0, 217, 165, 0.3);
        }

        &.action {
          grid-column: 1 / -1;
          border: 1px solid rgba(233, 69, 96, 0.3);
        }

        h4 {
          margin: 0 0 16px;
          font-size: 13px;
          color: #a0a0b8;
          text-transform: uppercase;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            font-size: 13px;
            color: #ffffff;

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }
        }
      }

      .result-content {
        h5 {
          margin: 0 0 8px;
          font-size: 18px;
          color: #ffffff;
        }

        .result-url {
          margin: 0 0 16px;
          font-size: 12px;
          color: #64b5f6;
        }

        .result-metrics {
          display: flex;
          gap: 32px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
          }

          .metric-label {
            font-size: 12px;
            color: #a0a0b8;
          }
        }
      }

      /* Calendar */
      .calendar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        margin-bottom: 20px;

        h3 {
          margin: 0;
          font-size: 18px;
          color: #ffffff;
        }
      }

      .calendar-nav {
        display: flex;
        gap: 8px;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 12px;
      }

      .calendar-day {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        padding: 12px;
        min-height: 120px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: all 0.2s ease;

        &:hover {
          border-color: rgba(233, 69, 96, 0.3);

          .add-post-btn {
            opacity: 1;
          }
        }

        &.today {
          border-color: #e94560;
        }

        &.has-posts {
          background: linear-gradient(
            135deg,
            rgba(0, 217, 165, 0.1) 0%,
            rgba(0, 184, 148, 0.1) 100%
          );
        }
      }

      .day-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;

        .day-name {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
        }

        .day-number {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
        }
      }

      .day-posts {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .post-chip {
        font-size: 10px;
        padding: 4px 8px;
        border-radius: 4px;
        background: rgba(233, 69, 96, 0.2);
        color: #e94560;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.published {
          background: rgba(0, 217, 165, 0.2);
          color: #00d9a5;
        }

        &.scheduled {
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        }
      }

      .add-post-btn {
        width: 100%;
        margin-top: 8px;
        padding: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px dashed rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: #666;
        cursor: pointer;
        opacity: 0;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(233, 69, 96, 0.1);
          border-color: #e94560;
          color: #e94560;
        }
      }

      /* Ideas */
      .ideas-section {
        max-width: 1200px;
        margin: 0 auto;
      }

      .ideas-toolbar {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;

        .search-field {
          flex: 1;
        }
      }

      .ideas-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }

      .idea-card {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: all 0.3s ease;

        &:hover {
          border-color: rgba(233, 69, 96, 0.3);
          transform: translateY(-4px);
        }

        .idea-type {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #00d9a5;
          text-transform: uppercase;
          margin-bottom: 12px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        h4 {
          margin: 0 0 8px;
          font-size: 16px;
          color: #ffffff;
        }

        p {
          margin: 0 0 16px;
          font-size: 13px;
          color: #a0a0b8;
          line-height: 1.5;
        }

        .idea-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;

          .word-estimate {
            font-size: 12px;
            color: #666;
          }

          .difficulty {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 4px;

            &.easy {
              background: rgba(0, 217, 165, 0.2);
              color: #00d9a5;
            }
            &.medium {
              background: rgba(255, 193, 7, 0.2);
              color: #ffc107;
            }
            &.hard {
              background: rgba(255, 107, 107, 0.2);
              color: #ff6b6b;
            }
          }
        }
      }

      .no-ideas {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px 20px;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        color: #666;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          opacity: 0.3;
        }
      }

      /* Performance */
      .performance-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }

      .performance-card {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;

        h4 {
          margin: 0 0 16px;
          font-size: 14px;
          color: #ffffff;
        }
      }

      .score-chart {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .score-bar {
        display: flex;
        align-items: center;
        gap: 12px;

        .bar-label {
          width: 60px;
          font-size: 12px;
          color: #a0a0b8;
        }

        .bar-fill {
          height: 24px;
          border-radius: 4px;
          transition: width 0.5s ease;

          &.green {
            background: linear-gradient(90deg, #00d9a5, #00b894);
          }
          &.yellow {
            background: linear-gradient(90deg, #ffc107, #ffb300);
          }
          &.red {
            background: linear-gradient(90deg, #ff6b6b, #ff5252);
          }
        }

        .bar-count {
          font-size: 13px;
          color: #ffffff;
          font-weight: 600;
          min-width: 30px;
        }
      }

      .time-chart {
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        height: 150px;
      }

      .chart-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        flex: 1;

        .column-bar {
          width: 32px;
          background: linear-gradient(180deg, #e94560 0%, #ff6b6b 100%);
          border-radius: 4px 4px 0 0;
          min-height: 4px;
          transition: height 0.5s ease;
        }

        .column-label {
          font-size: 10px;
          color: #666;
        }

        .column-value {
          font-size: 12px;
          color: #ffffff;
          font-weight: 600;
        }
      }

      .topic-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .topic-row {
        display: flex;
        align-items: center;
        gap: 12px;

        .topic-keyword {
          width: 120px;
          font-size: 13px;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .topic-bar {
          flex: 1;
          height: 8px;
          background: linear-gradient(90deg, #e94560, #ff6b6b);
          border-radius: 4px;
        }

        .topic-score {
          width: 40px;
          font-size: 12px;
          color: #00d9a5;
          font-weight: 600;
          text-align: right;
        }
      }

      .posts-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 300px;
        overflow-y: auto;
      }

      .post-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;

        .post-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .post-title {
          font-size: 13px;
          color: #ffffff;
        }

        .post-date {
          font-size: 11px;
          color: #666;
        }

        .post-score {
          font-size: 13px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;

          &.good {
            background: rgba(0, 217, 165, 0.2);
            color: #00d9a5;
          }
          &.medium {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
          }
          &.poor {
            background: rgba(255, 107, 107, 0.2);
            color: #ff6b6b;
          }
        }
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease;
      }

      .modal {
        background: #1f1f35;
        border-radius: 20px;
        border: 1px solid rgba(233, 69, 96, 0.2);
        animation: fadeIn 0.3s ease;

        &.bulk-modal {
          width: 550px;
        }
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        h3 {
          margin: 0;
          font-size: 18px;
          color: #ffffff;
        }
      }

      .modal-body {
        padding: 24px;

        textarea {
          width: 100%;
          padding: 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #ffffff;
          font-size: 14px;
          resize: vertical;
          font-family: inherit;

          &:focus {
            outline: none;
            border-color: #e94560;
          }
        }

        .bulk-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 16px;

          .count-info {
            font-size: 14px;
            color: #00d9a5;
          }
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }

      /* Social Auto-Post */
      .social-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .social-accounts {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .account-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: all 0.3s ease;

        &.connected {
          border-color: rgba(0, 217, 165, 0.3);
        }

        .account-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);

          svg {
            width: 24px;
            height: 24px;
          }
        }

        .account-info {
          flex: 1;

          h4 {
            margin: 0;
            font-size: 14px;
            color: #ffffff;
          }

          .account-status {
            font-size: 12px;
            color: #666;
          }
        }
      }

      .btn-primary-small,
      .btn-outline-small {
        padding: 6px 12px;
        font-size: 11px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .btn-primary-small {
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        color: white;
        border: none;

        &:hover {
          opacity: 0.9;
        }
      }

      .btn-outline-small {
        background: transparent;
        color: #e94560;
        border: 1px solid #e94560;

        &:hover {
          background: rgba(233, 69, 96, 0.1);
        }
      }

      .auto-post-settings {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;

        h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 16px;
          font-size: 15px;
          color: #ffffff;

          mat-icon {
            color: #e94560;
          }
        }

        .setting-toggle {
          margin-bottom: 16px;
        }

        .platform-toggles {
          margin-bottom: 16px;

          label {
            display: block;
            font-size: 13px;
            color: #a0a0b8;
            margin-bottom: 8px;
          }

          .toggle-group {
            display: flex;
            gap: 16px;
          }
        }

        .custom-message {
          label {
            display: block;
            font-size: 13px;
            color: #a0a0b8;
            margin-bottom: 8px;
          }

          textarea {
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #ffffff;
            font-size: 13px;
            resize: vertical;
            font-family: inherit;

            &:focus {
              border-color: #e94560;
              outline: none;
            }
          }

          .hint {
            font-size: 11px;
            color: #666;
            margin-top: 4px;
            display: block;
          }
        }
      }

      .recent-social {
        grid-column: 1 / -1;
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;

        h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 16px;
          font-size: 15px;
          color: #ffffff;

          mat-icon {
            color: #e94560;
          }
        }
      }

      .social-post-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .social-post-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;

        .post-platform-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);

          svg {
            width: 16px;
            height: 16px;
          }
        }

        .post-content {
          flex: 1;

          p {
            margin: 0 0 4px;
            font-size: 13px;
            color: #ffffff;
          }
          .post-time {
            font-size: 11px;
            color: #666;
          }
        }

        mat-icon {
          &.success {
            color: #00d9a5;
          }
          &.error {
            color: #ff6b6b;
          }
        }
      }

      .no-posts {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        color: #666;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          opacity: 0.3;
        }
      }

      /* Templates */
      .templates-section {
        max-width: 1400px;
        margin: 0 auto;
      }

      .templates-toolbar {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;

        .search-field {
          flex: 1;
        }
      }

      .templates-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
      }

      .template-card {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: rgba(233, 69, 96, 0.3);
          transform: translateY(-2px);
        }

        &.selected {
          border-color: #e94560;
        }

        .template-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: #e94560;
          }

          .template-badge {
            font-size: 10px;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;

            &.professional {
              background: rgba(100, 181, 246, 0.2);
              color: #64b5f6;
            }
            &.engaging {
              background: rgba(233, 69, 96, 0.2);
              color: #e94560;
            }
            &.informative {
              background: rgba(0, 217, 165, 0.2);
              color: #00d9a5;
            }
            &.friendly {
              background: rgba(255, 193, 7, 0.2);
              color: #ffc107;
            }
          }
        }

        h4 {
          margin: 0 0 8px;
          font-size: 16px;
          color: #ffffff;
        }
        p {
          margin: 0 0 12px;
          font-size: 13px;
          color: #a0a0b8;
          line-height: 1.4;
        }

        .template-meta {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #666;

            mat-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
            }
          }
        }

        .template-features {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;

          .feature-badge {
            font-size: 10px;
            padding: 2px 6px;
            background: rgba(255, 255, 255, 0.1);
            color: #a0a0b8;
            border-radius: 4px;
          }
        }

        .template-actions {
          display: flex;
          gap: 8px;

          button {
            flex: 1;
          }
        }
      }

      /* Bulk Generation */
      .bulk-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .bulk-import-panel,
      .bulk-jobs-panel {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 24px;

        h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 16px;
          font-size: 15px;
          color: #ffffff;

          mat-icon {
            color: #e94560;
          }
        }
      }

      .bulk-import-panel textarea {
        width: 100%;
        padding: 14px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #ffffff;
        font-size: 14px;
        resize: vertical;
        font-family: inherit;
        margin-bottom: 12px;

        &:focus {
          border-color: #e94560;
          outline: none;
        }
      }

      .import-stats {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;

        .stat {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;

          &.valid {
            background: rgba(0, 217, 165, 0.2);
            color: #00d9a5;
          }
          &.duplicates {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
          }
          &.invalid {
            background: rgba(255, 107, 107, 0.2);
            color: #ff6b6b;
          }
        }
      }

      .import-options {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;

        mat-form-field {
          flex: 1;
        }
      }

      .import-actions {
        display: flex;
        gap: 12px;

        button {
          flex: 1;
        }
      }

      .jobs-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .job-card {
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        border-left: 3px solid #666;

        &.processing {
          border-left-color: #ffc107;
        }
        &.completed {
          border-left-color: #00d9a5;
        }
        &.failed {
          border-left-color: #ff6b6b;
        }
        &.paused {
          border-left-color: #64b5f6;
        }

        .job-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;

          .job-id {
            font-size: 12px;
            color: #666;
          }
          .job-status-badge {
            font-size: 10px;
            padding: 2px 8px;
            border-radius: 4px;
            text-transform: uppercase;

            &.pending {
              background: rgba(255, 255, 255, 0.1);
              color: #a0a0b8;
            }
            &.processing {
              background: rgba(255, 193, 7, 0.2);
              color: #ffc107;
            }
            &.completed {
              background: rgba(0, 217, 165, 0.2);
              color: #00d9a5;
            }
            &.failed {
              background: rgba(255, 107, 107, 0.2);
              color: #ff6b6b;
            }
            &.paused {
              background: rgba(100, 181, 246, 0.2);
              color: #64b5f6;
            }
          }
        }

        .job-progress {
          margin-bottom: 12px;

          .progress-bar {
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            margin-bottom: 4px;

            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #e94560, #ff6b6b);
              border-radius: 3px;
              transition: width 0.3s ease;
            }
          }

          .progress-text {
            font-size: 11px;
            color: #666;
          }
        }

        .current-keyword {
          font-size: 12px;
          color: #a0a0b8;
          margin-bottom: 12px;

          strong {
            color: #ffffff;
          }
        }

        .job-stats {
          font-size: 12px;
          color: #666;
          margin-bottom: 12px;

          .stat {
            font-weight: 600;
          }
          .success {
            color: #00d9a5;
          }
          .failed {
            color: #ff6b6b;
          }
        }

        .job-actions {
          display: flex;
          gap: 8px;
        }
      }

      .no-jobs {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        color: #666;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          opacity: 0.3;
        }
      }

      .tab-badge {
        background: #e94560;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        margin-left: 8px;
      }

      @media (max-width: 1400px) {
        .dashboard-grid {
          grid-template-columns: 1fr 1fr;
        }

        .stats-bar {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 900px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }

        .stats-bar {
          grid-template-columns: repeat(2, 1fr);
        }

        .competitor-results,
        .ideas-grid,
        .performance-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AiAutoPosterComponent implements OnInit, OnDestroy {
  queue = signal<QueueItem[]>([]);
  activity = signal<ActivityEntry[]>([]);
  trendingTopics = signal<TechTopic[]>([]);
  competitorResults = signal<CompetitorResult | null>(null);
  contentIdeas = signal<any[]>([]);

  socialAccounts = signal<any[]>([]);
  socialPosts = signal<any[]>([]);
  templates = signal<any[]>([]);
  bulkJobs = signal<BulkJob[]>([]);
  calendarDays = signal<any[]>([]);

  isRunning = signal(false);
  analyzing = signal(false);
  generatingIdeas = signal(false);
  currentItem = signal<QueueItem | null>(null);
  currentStep = signal(0);

  topicsPerCycle = 5;
  intervalMinutes = 60;
  autoPublish = false;
  useLiveData = true;
  defaultLanguage = 'en';
  showBulkAdd = false;
  bulkKeywords = '';
  bulkLanguage = 'en';
  newKeyword = '';
  competitorKeyword = '';
  competitorLanguage = 'en';
  ideaKeyword = '';

  autoPostEnabled = false;
  autoPostTwitter = true;
  autoPostLinkedin = false;
  autoPostFacebook = false;
  customSocialMessage = 'New article: {title}';

  templateSearch = '';
  selectedTemplate: any = null;
  showTemplateModal = false;

  bulkImportText = '';
  bulkTemplate = '';
  bulkImportStats = { valid: 0, duplicates: 0, invalid: 0 };

  calendarYear = new Date().getFullYear();
  calendarMonth = new Date().getMonth();
  selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  selectedHour = 9;
  showScheduleModal = false;
  scheduleDate = new Date();

  processedKeywords = new Set<string>();

  processingSteps = [
    { idx: 1, label: 'Research', icon: 'search' },
    { idx: 2, label: 'Generate', icon: 'auto_awesome' },
    { idx: 3, label: 'Optimize', icon: 'tune' },
    { idx: 4, label: 'Publish', icon: 'cloud_upload' },
  ];

  private autoPosterInterval: any = null;

  topStats = computed(() => [
    {
      icon: 'check_circle',
      value: this.completedCount(),
      label: 'Published',
      trend: 12,
      bgColor: 'rgba(0, 217, 165, 0.2)',
      color: '#00d9a5',
    },
    {
      icon: 'schedule',
      value: this.queueCount(),
      label: 'In Queue',
      trend: 0,
      bgColor: 'rgba(255, 193, 7, 0.2)',
      color: '#ffc107',
    },
    {
      icon: 'trending_up',
      value: this.avgSeoScore() + '%',
      label: 'Avg SEO',
      trend: 5,
      bgColor: 'rgba(233, 69, 96, 0.2)',
      color: '#e94560',
    },
    {
      icon: 'today',
      value: this.todayCount(),
      label: 'Today',
      trend: 0,
      bgColor: 'rgba(100, 181, 246, 0.2)',
      color: '#64b5f6',
    },
    {
      icon: 'visibility',
      value: '2.4K',
      label: 'Views',
      trend: 8,
      bgColor: 'rgba(156, 39, 176, 0.2)',
      color: '#9c27b0',
    },
  ]);

  scoreDistribution = computed(() => {
    const queue = this.queue();
    const completed = queue.filter((q) => q.status === 'completed' && q.seoScore);
    const total = completed.length || 1;

    return [
      { range: '90-100', count: Math.floor(total * 0.4), percent: 40, class: 'green' },
      { range: '70-89', count: Math.floor(total * 0.35), percent: 35, class: 'green' },
      { range: '50-69', count: Math.floor(total * 0.15), percent: 15, class: 'yellow' },
      { range: '0-49', count: Math.floor(total * 0.1), percent: 10, class: 'red' },
    ];
  });

  weeklyData = computed(() => [
    { label: 'Mon', count: 5, percent: 50 },
    { label: 'Tue', count: 8, percent: 80 },
    { label: 'Wed', count: 6, percent: 60 },
    { label: 'Thu', count: 10, percent: 100 },
    { label: 'Fri', count: 7, percent: 70 },
    { label: 'Sat', count: 3, percent: 30 },
    { label: 'Sun', count: 4, percent: 40 },
  ]);

  topTopics = computed(() => [
    { keyword: 'AI Tools', avgScore: 92, percent: 92 },
    { keyword: 'Tech Reviews', avgScore: 88, percent: 88 },
    { keyword: 'Gadgets', avgScore: 85, percent: 85 },
    { keyword: 'Software', avgScore: 78, percent: 78 },
    { keyword: 'Gaming', avgScore: 72, percent: 72 },
  ]);

  recentPosts = computed(() => [
    { id: '1', title: 'Best AI Tools 2026', date: new Date(), score: 94 },
    { id: '2', title: 'Tech Gadgets Review', date: new Date(Date.now() - 86400000), score: 88 },
    { id: '3', title: 'Software Trends', date: new Date(Date.now() - 172800000), score: 82 },
    { id: '4', title: 'Gaming Hardware', date: new Date(Date.now() - 259200000), score: 76 },
  ]);

  completedCount = computed(() => this.queue().filter((q) => q.status === 'completed').length);
  queueCount = computed(() => this.queue().filter((q) => q.status === 'pending').length);
  todayCount = computed(() => {
    const today = new Date().toDateString();
    return this.queue().filter(
      (q) =>
        q.status === 'completed' &&
        q.completedAt &&
        new Date(q.completedAt).toDateString() === today,
    ).length;
  });

  avgSeoScore = computed(() => {
    const completed = this.queue().filter((q) => q.status === 'completed' && q.seoScore);
    if (completed.length === 0) return 0;
    return Math.round(completed.reduce((sum, q) => sum + (q.seoScore || 0), 0) / completed.length);
  });

  constructor(
    private multiAI: MultiAIProviderService,
    private seoAnalyzer: SeoAnalyzerService,
    private articleAnalyzer: ArticleAnalyzerService,
    private techTopicService: TechTopicService,
    private searchService: SearchService,
    private imageService: ImageService,
    private wordpressService: WordPressService,
    private socialPostService: SocialAutoPostService,
    private templateService: ContentTemplateService,
    private schedulerService: ContentSchedulerService,
    private bulkService: BulkGenerationService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadTrendingTopics();
    this.loadSavedQueue();
    this.loadSocialAccounts();
    this.loadTemplates();
    this.loadCalendarDays();
    this.loadBulkJobs();
  }

  ngOnDestroy(): void {
    this.stopAutoPoster();
  }

  loadSocialAccounts(): void {
    this.socialAccounts.set(this.socialPostService.getAccounts());
  }

  loadTemplates(): void {
    this.templates.set(this.templateService.getTemplates());
  }

  loadCalendarDays(): void {
    const days = this.schedulerService.generateCalendarDays(this.calendarYear, this.calendarMonth);
    this.calendarDays.set(days);
  }

  loadBulkJobs(): void {
    this.bulkJobs.set(this.bulkService.getAllJobs());
  }

  connectedSocialCount = computed(() => this.socialAccounts().filter((a) => a.connected).length);

  filteredTemplates = computed(() => {
    const search = this.templateSearch.toLowerCase();
    if (!search) return this.templates();
    return this.templates().filter(
      (t) => t.name.toLowerCase().includes(search) || t.description.toLowerCase().includes(search),
    );
  });

  isBulkProcessing = computed(() => this.bulkJobs().some((j) => j.status === 'processing'));

  connectSocial(platform: 'twitter' | 'linkedin' | 'facebook'): void {
    this.socialPostService.connectAccount(platform);
    this.loadSocialAccounts();
    this.snackBar.open(`${this.getPlatformName(platform)} connected`, 'Close', { duration: 2000 });
  }

  disconnectSocial(platform: 'twitter' | 'linkedin' | 'facebook'): void {
    this.socialPostService.disconnectAccount(platform);
    this.loadSocialAccounts();
    this.snackBar.open(`${this.getPlatformName(platform)} disconnected`, 'Close', {
      duration: 2000,
    });
  }

  getPlatformName(platform: string): string {
    const names: { [key: string]: string } = {
      twitter: 'Twitter/X',
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
    };
    return names[platform] || platform;
  }

  selectTemplate(template: any): void {
    this.selectedTemplate = template;
  }

  previewTemplate(template: any): void {
    this.snackBar.open(`Preview: ${template.name}`, 'Close', { duration: 2000 });
  }

  useTemplate(template: any): void {
    this.selectedTemplate = template;
    this.snackBar.open(`Template "${template.name}" selected`, 'Close', { duration: 2000 });
  }

  parseBulkKeywords(): void {
    const keywords = this.bulkService.parseKeywords(this.bulkImportText);
    const validation = this.bulkService.validateKeywords(keywords);
    this.bulkImportStats = {
      valid: validation.valid.length,
      duplicates: validation.duplicate.length,
      invalid: validation.tooShort.length + validation.tooLong.length,
    };
  }

  getImportStats() {
    return this.bulkImportStats;
  }

  startBulkGeneration(): void {
    const keywords = this.bulkService.parseKeywords(this.bulkImportText);
    const validation = this.bulkService.validateKeywords(keywords);

    if (validation.valid.length === 0) {
      this.snackBar.open('No valid keywords to process', 'Close', { duration: 2000 });
      return;
    }

    const job = this.bulkService.createJob(
      validation.valid,
      this.bulkLanguage,
      this.bulkTemplate || undefined,
    );
    this.bulkService.startJob(job.id);
    this.loadBulkJobs();

    this.bulkService.setProgressCallback((progress) => {
      this.loadBulkJobs();
    });

    this.bulkService.setCompleteCallback((jobId, results) => {
      this.loadBulkJobs();
      this.addActivity('success', `Bulk generation completed: ${results.length} articles`);
    });

    this.addActivity('info', `Started bulk generation: ${validation.valid.length} keywords`);
    this.bulkImportText = '';
  }

  pauseBulkJob(jobId: string): void {
    this.bulkService.pauseJob(jobId);
    this.loadBulkJobs();
  }

  resumeBulkJob(jobId: string): void {
    this.bulkService.resumeJob(jobId);
    this.loadBulkJobs();
  }

  cancelBulkJob(jobId: string): void {
    this.bulkService.cancelJob(jobId);
    this.loadBulkJobs();
    this.addActivity('warning', 'Bulk job cancelled');
  }

  viewBulkResults(jobId: string): void {
    const job = this.bulkService.getJob(jobId);
    if (job) {
      this.snackBar.open(`${job.results.length} results for job #${jobId.slice(-6)}`, 'Close', {
        duration: 3000,
      });
    }
  }

  navigateCalendar(direction: number): void {
    this.calendarMonth += direction;
    if (this.calendarMonth < 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    } else if (this.calendarMonth > 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    }
    this.loadCalendarDays();
  }

  loadTrendingTopics(): void {
    const topics = this.techTopicService.getTopics();
    this.trendingTopics.set(topics.slice(0, 15));
    this.addActivity('info', `Loaded ${topics.length} trending topics`);
  }

  loadSavedQueue(): void {
    try {
      const saved = localStorage.getItem('ai_poster_queue');
      if (saved) {
        const items = JSON.parse(saved) as QueueItem[];
        this.queue.set(items);
      }
    } catch (e) {}
  }

  saveQueue(): void {
    localStorage.setItem('ai_poster_queue', JSON.stringify(this.queue()));
  }

  addToQueue(keyword: string, language: string = this.defaultLanguage): void {
    const existing = this.queue().find((q) => q.keyword.toLowerCase() === keyword.toLowerCase());

    if (existing) {
      this.snackBar.open('Keyword already in queue', 'Close', { duration: 2000 });
      return;
    }

    const item: QueueItem = {
      id: Date.now().toString(),
      keyword,
      status: 'pending',
      progress: 0,
      language,
    };

    this.queue.update((q) => [...q, item]);
    this.saveQueue();
    this.addActivity('success', `Added "${keyword}" to queue`);
  }

  addToQueueWithLang(keyword: string): void {
    this.addToQueue(keyword, this.defaultLanguage);
  }

  addKeyword(): void {
    if (this.newKeyword.trim()) {
      this.addToQueue(this.newKeyword.trim());
      this.newKeyword = '';
    }
  }

  addBulkKeywords(): void {
    const keywords = this.bulkKeywords
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .slice(0, 20);

    let added = 0;
    for (const keyword of keywords) {
      const existing = this.queue().find((q) => q.keyword.toLowerCase() === keyword.toLowerCase());
      if (!existing) {
        const item: QueueItem = {
          id: Date.now().toString() + added,
          keyword,
          status: 'pending',
          progress: 0,
          language: this.bulkLanguage,
        };
        this.queue.update((q) => [...q, item]);
        added++;
      }
    }

    this.saveQueue();
    this.showBulkAdd = false;
    this.bulkKeywords = '';
    this.addActivity('success', `Added ${added} keywords`);
  }

  getBulkCount(): number {
    return this.bulkKeywords.split('\n').filter((k) => k.trim().length > 0).length;
  }

  removeItem(id: string): void {
    this.queue.update((q) => q.filter((item) => item.id !== id));
    this.saveQueue();
  }

  shuffleQueue(): void {
    this.queue.update((q) => [...q].sort(() => Math.random() - 0.5));
    this.saveQueue();
    this.addActivity('info', 'Queue shuffled');
  }

  clearQueue(): void {
    this.queue.set([]);
    this.saveQueue();
    this.addActivity('info', 'Queue cleared');
  }

  refreshAll(): void {
    this.loadTrendingTopics();
    this.loadSavedQueue();
    this.addActivity('info', 'Refreshed all data');
  }

  async startAutoPoster(): Promise<void> {
    if (this.queueCount() === 0) {
      this.snackBar.open('Add keywords to queue first', 'Close', { duration: 2000 });
      return;
    }

    this.isRunning.set(true);
    this.addActivity('success', 'Auto-poster started');

    await this.runAutoPosterCycle();

    this.autoPosterInterval = setInterval(
      () => {
        if (this.isRunning()) {
          this.runAutoPosterCycle();
        }
      },
      this.intervalMinutes * 60 * 1000,
    );
  }

  stopAutoPoster(): void {
    this.isRunning.set(false);
    this.currentItem.set(null);
    this.currentStep.set(0);

    if (this.autoPosterInterval) {
      clearInterval(this.autoPosterInterval);
      this.autoPosterInterval = null;
    }

    this.addActivity('warning', 'Auto-poster stopped');
  }

  private async runAutoPosterCycle(): Promise<void> {
    const pendingItems = this.queue()
      .filter((q) => q.status === 'pending')
      .slice(0, this.topicsPerCycle);

    for (const item of pendingItems) {
      if (!this.isRunning()) break;
      await this.processQueueItem(item);
    }
  }

  async processItem(item: QueueItem): Promise<void> {
    if (this.isRunning()) {
      this.snackBar.open('Auto-poster is running', 'Close', { duration: 2000 });
      return;
    }
    await this.processQueueItem(item);
  }

  private async processQueueItem(item: QueueItem): Promise<void> {
    try {
      this.currentItem.set(item);
      this.currentStep.set(1);

      this.updateQueueItem(item.id, { status: 'researching', progress: 10 });
      this.addActivity('info', `Researching: ${item.keyword}`);

      await this.delay(500);

      this.updateQueueItem(item.id, { status: 'generating', progress: 30 });
      this.currentStep.set(2);
      this.addActivity('info', `Generating content`);

      const content = await this.generateContent(item.keyword);

      this.updateQueueItem(item.id, { progress: 60 });
      this.currentStep.set(3);
      this.updateQueueItem(item.id, { status: 'optimizing' });
      this.addActivity('info', `Optimizing SEO`);

      const optimized = this.articleAnalyzer.analyzeAndOptimize(
        content.content,
        content.title,
        item.keyword,
      );

      this.updateQueueItem(item.id, {
        seoScore: optimized.report.score,
        wordCount: optimized.content
          .replace(/<[^>]*>/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length > 0).length,
        progress: 80,
      });
      this.currentStep.set(4);
      this.updateQueueItem(item.id, { status: 'publishing' });
      this.addActivity('info', `Publishing`);

      await this.publishPost(optimized.title, optimized.content, optimized.metaDescription);

      this.updateQueueItem(item.id, {
        status: 'completed',
        completedAt: new Date(),
        progress: 100,
      });
      this.addActivity('success', `Published: ${item.keyword} (SEO: ${optimized.report.score}%)`);
    } catch (error: any) {
      this.updateQueueItem(item.id, { status: 'failed', error: error.message });
      this.addActivity('error', `Failed: ${item.keyword}`, error.message);
    } finally {
      this.currentItem.set(null);
      this.currentStep.set(0);
      this.saveQueue();
    }
  }

  private generateContent(keyword: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        keyword,
        tone: 'professional',
        wordCount: 1500,
        template: 'article',
        includeImages: true,
        language: this.defaultLanguage,
      };

      this.multiAI.generateContent(options).subscribe({
        next: (content: any) => resolve(content),
        error: (err: any) => reject(err),
      });
    });
  }

  private publishPost(title: string, content: string, metaDescription: string): Promise<void> {
    return new Promise((resolve) => {
      const post: any = {
        title,
        content,
        status: this.autoPublish ? 'publish' : 'draft',
        categories: [],
        tags: [],
        meta: {
          _rank_math_focus_keyword: title,
          _rank_math_seo_score: '0',
          _rank_math_description: metaDescription,
        },
      };

      this.wordpressService.createPost(post).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      });
    });
  }

  analyzeCompetitors(): void {
    // Tab switch handled by UI
  }

  async runCompetitorAnalysis(): Promise<void> {
    if (!this.competitorKeyword.trim()) {
      this.snackBar.open('Enter a keyword to analyze', 'Close', { duration: 2000 });
      return;
    }

    this.analyzing.set(true);

    await this.delay(2000);

    this.competitorResults.set({
      keyword: this.competitorKeyword,
      topResult: {
        title: 'The Ultimate Guide to ' + this.competitorKeyword + ' in 2026',
        url: 'https://example.com/' + this.competitorKeyword.toLowerCase().replace(/\s+/g, '-'),
        da: 67,
        wordCount: 2847,
      },
      gaps: [
        'Missing comparison with alternatives',
        'No practical examples section',
        'Lacks video content',
        'No FAQ section for featured snippets',
        'Missing latest 2026 statistics',
      ],
      opportunities: [
        'Target long-tail keywords',
        'Create comprehensive comparison chart',
        'Add interactive elements',
        'Optimize for voice search',
        'Include expert quotes',
      ],
    });

    this.analyzing.set(false);
    this.addActivity('success', 'Competitor analysis complete for: ' + this.competitorKeyword);
  }

  addCompetitorToQueue(): void {
    if (this.competitorResults()) {
      this.addToQueue(this.competitorKeyword, this.competitorLanguage);
      this.snackBar.open('Added to queue', 'Close', { duration: 2000 });
    }
  }

  generateContentIdeas(): void {
    if (!this.ideaKeyword.trim()) {
      this.ideaKeyword =
        this.queue().find((q) => q.status === 'completed')?.keyword || 'AI Technology';
    }

    this.generatingIdeas.set(true);

    setTimeout(() => {
      this.contentIdeas.set([
        {
          type: 'Guide',
          icon: 'menu_book',
          title: 'The Complete Guide to ' + this.ideaKeyword,
          description:
            'A comprehensive guide covering all aspects with practical examples and step-by-step instructions.',
          wordEstimate: 2500,
          difficulty: 'medium',
        },
        {
          type: 'Listicle',
          icon: 'format_list_numbered',
          title: 'Top 10 ' + this.ideaKeyword + ' You Need to Know',
          description: 'Curated list with brief explanations and why each one matters in 2026.',
          wordEstimate: 1500,
          difficulty: 'easy',
        },
        {
          type: 'Comparison',
          icon: 'compare',
          title: this.ideaKeyword + ' vs Alternatives: Which is Best?',
          description: 'Side-by-side comparison helping readers make informed decisions.',
          wordEstimate: 2000,
          difficulty: 'medium',
        },
        {
          type: 'How-To',
          icon: 'build',
          title: 'How to Get Started with ' + this.ideaKeyword,
          description: 'Step-by-step tutorial with screenshots and common pitfalls to avoid.',
          wordEstimate: 1800,
          difficulty: 'easy',
        },
        {
          type: 'Opinion',
          icon: 'rate_review',
          title: 'Why ' + this.ideaKeyword + ' Will Change Everything',
          description: 'Expert opinion piece with predictions for the future of the industry.',
          wordEstimate: 1200,
          difficulty: 'hard',
        },
        {
          type: 'News',
          icon: 'new_releases',
          title: 'Latest ' + this.ideaKeyword + ' Updates and Announcements',
          description: 'Roundup of recent news with analysis of what it means for readers.',
          wordEstimate: 1000,
          difficulty: 'easy',
        },
      ]);

      this.generatingIdeas.set(false);
      this.addActivity('info', `Generated ${this.contentIdeas().length} content ideas`);
    }, 1500);
  }

  useIdea(idea: any): void {
    this.addToQueue(
      idea.title
        .replace('The Complete Guide to ', '')
        .replace('Top 10 ', '')
        .replace(' You Need to Know', '')
        .replace(' vs Alternatives: Which is Best?', '')
        .replace('How to Get Started with ', '')
        .replace('Why ', '')
        .replace(' Will Change Everything', '')
        .replace('Latest ', '')
        .replace(' Updates and Announcements', ''),
    );
  }

  schedulePost(date: number): void {
    this.snackBar.open(`Scheduled post for March ${date}`, 'Close', { duration: 2000 });
  }

  private updateQueueItem(id: string, updates: Partial<QueueItem>): void {
    this.queue.update((q) => q.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  private addActivity(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    detail?: string,
  ): void {
    const entry: ActivityEntry = {
      id: Date.now().toString(),
      type,
      message,
      detail,
      timestamp: new Date(),
    };
    this.activity.update((a) => [entry, ...a].slice(0, 100));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };
    return icons[type] || 'info';
  }

  getTopicIcon(category: string): string {
    const c = category.toLowerCase();
    if (c.includes('ai') || c.includes('machine')) return 'psychology';
    if (c.includes('phone') || c.includes('mobile')) return 'smartphone';
    if (c.includes('computer') || c.includes('laptop')) return 'laptop';
    if (c.includes('software')) return 'code';
    if (c.includes('gaming')) return 'sports_esports';
    if (c.includes('crypto')) return 'currency_bitcoin';
    if (c.includes('social')) return 'share';
    if (c.includes('cloud')) return 'cloud';
    if (c.includes('security')) return 'security';
    if (c.includes('robot')) return 'smart_toy';
    return 'tag';
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'good';
    if (score >= 60) return 'medium';
    return 'poor';
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
