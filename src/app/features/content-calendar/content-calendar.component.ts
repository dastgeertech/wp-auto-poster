import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ContentSchedulerService,
  ScheduledContent,
} from '../../core/services/content-scheduler.service';
import { RssFeedService, RssArticle } from '../../core/services/rss-feed.service';
import { KeywordResearchService } from '../../core/services/keyword-research.service';

@Component({
  selector: 'app-content-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="content-calendar">
      <div class="calendar-header">
        <div class="header-left">
          <h2><mat-icon>calendar_month</mat-icon> Content Calendar</h2>
          <p>Plan and schedule your content publishing</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="navigateMonth(-1)">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span class="current-month">{{ getCurrentMonthYear() }}</span>
          <button mat-stroked-button (click)="navigateMonth(1)">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <button mat-stroked-button (click)="goToToday()">Today</button>
        </div>
      </div>

      <div class="calendar-grid">
        <div class="weekday-headers">
          @for (day of weekdays; track day) {
            <div class="weekday">{{ day }}</div>
          }
        </div>

        <div class="days-grid">
          @for (day of calendarDays(); track $index) {
            <div
              class="day-cell"
              [class.other-month]="!day.isCurrentMonth"
              [class.today]="day.isToday"
              [class.has-posts]="day.posts.length > 0"
              (click)="selectDay(day)"
              (dragover)="onDragOver($event)"
              (drop)="onDrop($event, day)"
            >
              <div class="day-number">{{ day.date }}</div>
              <div class="day-posts">
                @for (post of day.posts.slice(0, 3); track post.id) {
                  <div
                    class="post-dot"
                    [class]="'status-' + post.status"
                    [matTooltip]="post.keyword"
                  ></div>
                }
                @if (day.posts.length > 3) {
                  <span class="more-count">+{{ day.posts.length - 3 }}</span>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Sidebar with scheduled content -->
      <div class="sidebar">
        <div class="sidebar-section">
          <h3><mat-icon>schedule</mat-icon> Scheduled</h3>
          <div class="scheduled-list">
            @for (content of upcomingContent(); track content.id) {
              <div
                class="scheduled-item"
                draggable="true"
                (dragstart)="onDragStart($event, content)"
              >
                <div class="item-date">
                  {{ content.scheduledDate | date: 'MMM d' }}
                </div>
                <div class="item-info">
                  <span class="item-keyword">{{ content.keyword }}</span>
                  <span class="item-time">{{ content.scheduledDate | date: 'shortTime' }}</span>
                </div>
                <div class="item-status" [class]="content.status">
                  {{ content.status }}
                </div>
              </div>
            }
            @if (upcomingContent().length === 0) {
              <div class="empty-state">
                <mat-icon>event_available</mat-icon>
                <p>No scheduled content</p>
              </div>
            }
          </div>
        </div>

        <div class="sidebar-section">
          <h3><mat-icon>trending_up</mat-icon> Quick Add</h3>
          <div class="quick-add">
            <input
              [(ngModel)]="newKeyword"
              placeholder="Enter keyword..."
              (keyup.enter)="quickAdd()"
            />
            <button mat-flat-button (click)="quickAdd()">
              <mat-icon>add</mat-icon>
            </button>
          </div>
          <div class="suggestions">
            <h4>Suggestions</h4>
            @for (keyword of suggestedKeywords(); track keyword) {
              <div class="suggestion-chip" (click)="addKeyword(keyword)">
                {{ keyword }}
              </div>
            }
          </div>
        </div>

        <div class="sidebar-section">
          <h3><mat-icon>rss_feed</mat-icon> RSS Feeds</h3>
          <div class="feeds-list">
            @for (feed of rssFeeds(); track feed.id) {
              <div class="feed-item">
                <mat-icon>rss_feed</mat-icon>
                <span>{{ feed.title }}</span>
                <span class="feed-count">{{ feed.articleCount }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Selected Day Modal -->
      @if (selectedDay) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ selectedDay.date | date: 'fullDate' }}</h3>
              <button mat-icon-button (click)="closeModal()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="modal-body">
              @if (selectedDay.posts.length > 0) {
                <h4>Scheduled Content</h4>
                @for (post of selectedDay.posts; track post.id) {
                  <div class="day-post-item">
                    <div class="post-info">
                      <span class="post-keyword">{{ post.keyword }}</span>
                      <span class="post-time">{{ post.scheduledDate | date: 'shortTime' }}</span>
                    </div>
                    <span class="status-badge" [class]="post.status">{{ post.status }}</span>
                  </div>
                }
              } @else {
                <p>No content scheduled for this day.</p>
              }
              <div class="add-content">
                <h4>Add Content</h4>
                <div class="add-form">
                  <input [(ngModel)]="newKeyword" placeholder="Keyword for article..." />
                  <button mat-flat-button (click)="addToSelectedDay()">
                    <mat-icon>add</mat-icon> Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .content-calendar {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 24px;
        padding: 24px;
        height: calc(100vh - 80px);
      }

      .calendar-header {
        grid-column: 1 / -1;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-left {
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

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;

          .current-month {
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
            min-width: 180px;
            text-align: center;
          }

          button {
            color: #e94560;
            border-color: #e94560;
          }
        }
      }

      .calendar-grid {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;
        overflow: hidden;
      }

      .weekday-headers {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        margin-bottom: 12px;

        .weekday {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          padding: 8px;
        }
      }

      .days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
      }

      .day-cell {
        aspect-ratio: 1;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 80px;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        &.other-month {
          opacity: 0.3;
        }

        &.today {
          background: rgba(233, 69, 96, 0.2);
          border: 1px solid #e94560;

          .day-number {
            color: #e94560;
            font-weight: 700;
          }
        }

        &.has-posts {
          background: rgba(0, 217, 165, 0.1);
        }

        .day-number {
          font-size: 14px;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .day-posts {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .post-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;

          &.status-scheduled {
            background: #ffc107;
          }
          &.status-processing {
            background: #64b5f6;
          }
          &.status-published {
            background: #00d9a5;
          }
          &.status-failed {
            background: #ff6b6b;
          }
        }

        .more-count {
          font-size: 10px;
          color: #666;
        }
      }

      .sidebar {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .sidebar-section {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        padding: 20px;

        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px;
          font-size: 14px;
          color: #ffffff;

          mat-icon {
            color: #e94560;
            font-size: 18px;
          }
        }
      }

      .scheduled-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 200px;
        overflow-y: auto;
      }

      .scheduled-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        cursor: grab;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .item-date {
          font-size: 12px;
          color: #e94560;
          font-weight: 600;
          min-width: 50px;
        }

        .item-info {
          flex: 1;
          min-width: 0;

          .item-keyword {
            display: block;
            font-size: 13px;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .item-time {
            font-size: 11px;
            color: #666;
          }
        }

        .item-status {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;

          &.scheduled {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
          }
          &.processing {
            background: rgba(100, 181, 246, 0.2);
            color: #64b5f6;
          }
          &.published {
            background: rgba(0, 217, 165, 0.2);
            color: #00d9a5;
          }
        }
      }

      .quick-add {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;

        input {
          flex: 1;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 13px;

          &:focus {
            outline: none;
            border-color: #e94560;
          }
        }

        button {
          background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
          color: white;
          border: none;
        }
      }

      .suggestions {
        h4 {
          margin: 0 0 8px;
          font-size: 12px;
          color: #666;
        }

        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .suggestion-chip {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          font-size: 11px;
          color: #a0a0b8;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: rgba(233, 69, 96, 0.2);
            color: #e94560;
          }
        }
      }

      .feeds-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .feed-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #a0a0b8;

        mat-icon {
          color: #e94560;
          font-size: 16px;
        }

        span:first-of-type {
          flex: 1;
        }

        .feed-count {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        color: #666;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          opacity: 0.3;
        }

        p {
          margin: 8px 0 0;
          font-size: 12px;
        }
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal {
        background: #1f1f35;
        border-radius: 16px;
        width: 500px;
        max-height: 80vh;
        overflow-y: auto;

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);

          h3 {
            margin: 0;
            color: #ffffff;
          }
        }

        .modal-body {
          padding: 20px;

          h4 {
            margin: 0 0 12px;
            font-size: 14px;
            color: #a0a0b8;
          }

          .day-post-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            margin-bottom: 8px;

            .post-info {
              .post-keyword {
                display: block;
                color: #ffffff;
                font-size: 13px;
              }
              .post-time {
                font-size: 11px;
                color: #666;
              }
            }

            .status-badge {
              font-size: 10px;
              padding: 4px 8px;
              border-radius: 4px;

              &.scheduled {
                background: rgba(255, 193, 7, 0.2);
                color: #ffc107;
              }
              &.published {
                background: rgba(0, 217, 165, 0.2);
                color: #00d9a5;
              }
            }
          }

          .add-content {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);

            .add-form {
              display: flex;
              gap: 8px;

              input {
                flex: 1;
                padding: 10px 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #ffffff;
                font-size: 13px;

                &:focus {
                  outline: none;
                  border-color: #e94560;
                }
              }

              button {
                background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
                color: white;
                border: none;
              }
            }
          }
        }
      }
    `,
  ],
})
export class ContentCalendarComponent implements OnInit {
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  calendarDays = signal<any[]>([]);
  upcomingContent = signal<ScheduledContent[]>([]);
  rssFeeds = signal<any[]>([]);
  suggestedKeywords = signal<string[]>([]);

  selectedDay: any = null;
  newKeyword = '';
  draggedContent: any = null;

  constructor(
    private schedulerService: ContentSchedulerService,
    private rssService: RssFeedService,
    private keywordService: KeywordResearchService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadCalendar();
    this.loadUpcoming();
    this.loadFeeds();
    this.loadSuggestions();
  }

  loadCalendar(): void {
    const days = this.schedulerService.generateCalendarDays(this.currentYear, this.currentMonth);
    this.calendarDays.set(days);
  }

  loadUpcoming(): void {
    const scheduled = this.schedulerService
      .getScheduledContent()
      .filter((c) => c.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 10);
    this.upcomingContent.set(scheduled);
  }

  loadFeeds(): void {
    this.rssFeeds.set(this.rssService.getFeeds());
  }

  loadSuggestions(): void {
    const analysis = this.keywordService.analyzeKeyword('AI tools');
    this.suggestedKeywords.set(analysis.suggestions.slice(0, 6));
  }

  getCurrentMonthYear(): string {
    const date = new Date(this.currentYear, this.currentMonth);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  navigateMonth(direction: number): void {
    this.currentMonth += direction;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.loadCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.loadCalendar();
  }

  selectDay(day: any): void {
    this.selectedDay = day;
  }

  closeModal(): void {
    this.selectedDay = null;
  }

  quickAdd(): void {
    if (!this.newKeyword.trim()) return;
    this.addKeyword(this.newKeyword.trim());
    this.newKeyword = '';
  }

  addKeyword(keyword: string): void {
    const date = this.selectedDay
      ? new Date(this.currentYear, this.currentMonth, this.selectedDay.date, 9, 0)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    this.schedulerService.scheduleContent(keyword, date, this.schedulerService.getUserTimezone());
    this.loadCalendar();
    this.loadUpcoming();
    this.snackBar.open(`"${keyword}" scheduled`, 'Close', { duration: 2000 });
  }

  addToSelectedDay(): void {
    if (!this.newKeyword.trim() || !this.selectedDay) return;
    this.addKeyword(this.newKeyword.trim());
    this.newKeyword = '';
  }

  onDragStart(event: DragEvent, content: ScheduledContent): void {
    this.draggedContent = content;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, day: any): void {
    event.preventDefault();
    if (!this.draggedContent) return;

    const newDate = new Date(this.currentYear, this.currentMonth, day.date, 9, 0);
    this.schedulerService.rescheduleContent(this.draggedContent.id, newDate);
    this.draggedContent = null;
    this.loadCalendar();
    this.loadUpcoming();
    this.snackBar.open('Content rescheduled', 'Close', { duration: 2000 });
  }
}
