import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SchedulerService } from '../../core/services/scheduler.service';
import { ScheduledPost } from '../../core/models';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="scheduler">
      <div class="scheduler-header">
        <div class="calendar-nav">
          <button mat-icon-button (click)="previousMonth()">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <h2>{{ currentMonthName() }} {{ currentYear() }}</h2>
          <button mat-icon-button (click)="nextMonth()">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-value">{{ stats().pending }}</span>
            <span class="stat-label">Pending</span>
          </div>
          <div class="stat">
            <span class="stat-value completed">{{ stats().completed }}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="stat">
            <span class="stat-value failed">{{ stats().failed }}</span>
            <span class="stat-label">Failed</span>
          </div>
        </div>
      </div>

      <div class="calendar">
        <div class="calendar-header">
          @for (day of weekDays; track day) {
            <div class="day-name">{{ day }}</div>
          }
        </div>
        <div class="calendar-grid">
          @for (day of calendarDays(); track day.date + (day.currentMonth ? 'current' : 'other')) {
            <div
              class="calendar-day"
              [class.other-month]="!day.currentMonth"
              [class.today]="day.isToday"
              [class.has-posts]="day.posts.length > 0"
            >
              <span class="day-number">{{ day.date }}</span>
              @if (day.posts.length > 0) {
                <div class="day-posts">
                  @for (post of day.posts.slice(0, 3); track post.id) {
                    <div
                      class="post-dot"
                      [class]="post.status"
                      [matTooltip]="post.post.title"
                    ></div>
                  }
                  @if (day.posts.length > 3) {
                    <span class="more-count">+{{ day.posts.length - 3 }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div class="scheduled-list">
        <h3>Scheduled Posts</h3>
        @for (post of scheduledPosts(); track post.id) {
          <div class="schedule-card" [class]="post.status">
            <div class="schedule-time">
              <mat-icon>schedule</mat-icon>
              <span>{{ formatScheduleDate(post.scheduledTime) }}</span>
            </div>
            <div class="schedule-content">
              <span class="schedule-title">{{ post.post.title }}</span>
              <span class="schedule-keyword">{{
                post.post.meta?._rank_math_focus_keyword || 'No keyword'
              }}</span>
            </div>
            <div class="schedule-status">
              <span class="status-badge" [class]="post.status">{{ post.status }}</span>
            </div>
            <div class="schedule-actions">
              <button mat-icon-button (click)="reschedulePost(post)" matTooltip="Reschedule">
                <mat-icon>edit_calendar</mat-icon>
              </button>
              <button mat-icon-button (click)="cancelSchedule(post)" matTooltip="Cancel">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <mat-icon>event_busy</mat-icon>
            <span>No scheduled posts</span>
            <p>Create a post and schedule it for later</p>
          </div>
        }
      </div>

      @if (stats().completed > 0 || stats().failed > 0) {
        <div class="clear-actions">
          <button mat-stroked-button (click)="clearCompleted()">Clear Completed</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .scheduler {
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

      .scheduler-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .calendar-nav {
        display: flex;
        align-items: center;
        gap: 16px;

        h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
          min-width: 200px;
          text-align: center;
        }

        button {
          color: #a0a0b8;
        }
      }

      .stats-row {
        display: flex;
        gap: 24px;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;

        .stat-value {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;

          &.completed {
            color: #00d9a5;
          }

          &.failed {
            color: #ff6b6b;
          }
        }

        .stat-label {
          font-size: 12px;
          color: #a0a0b8;
        }
      }

      .calendar {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        border: 1px solid rgba(233, 69, 96, 0.1);
        margin-bottom: 24px;
        overflow: hidden;
      }

      .calendar-header {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background: rgba(0, 0, 0, 0.2);
        padding: 12px 0;
      }

      .day-name {
        text-align: center;
        font-size: 12px;
        font-weight: 600;
        color: #a0a0b8;
        text-transform: uppercase;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
      }

      .calendar-day {
        min-height: 100px;
        padding: 8px;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        transition: background 0.2s ease;

        &:nth-child(7n) {
          border-right: none;
        }

        &:hover {
          background: rgba(233, 69, 96, 0.05);
        }

        &.other-month {
          opacity: 0.3;
        }

        &.today {
          background: rgba(233, 69, 96, 0.1);

          .day-number {
            background: #e94560;
            color: white;
          }
        }

        &.has-posts {
          background: rgba(0, 217, 165, 0.05);
        }
      }

      .day-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-size: 13px;
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 4px;
      }

      .day-posts {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 4px;
      }

      .post-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.pending {
          background: #ffc107;
        }

        &.processing {
          background: #6c5ce7;
        }

        &.completed {
          background: #00d9a5;
        }

        &.failed {
          background: #ff6b6b;
        }
      }

      .more-count {
        font-size: 10px;
        color: #a0a0b8;
      }

      .scheduled-list {
        background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
        border-radius: 16px;
        border: 1px solid rgba(233, 69, 96, 0.1);
        padding: 20px;

        h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
        }
      }

      .schedule-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;
        margin-bottom: 12px;
        border-left: 3px solid transparent;

        &.pending {
          border-left-color: #ffc107;
        }

        &.processing {
          border-left-color: #6c5ce7;
        }

        &.completed {
          border-left-color: #00d9a5;
        }

        &.failed {
          border-left-color: #ff6b6b;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }

      .schedule-time {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #ffc107;
        font-size: 13px;
        min-width: 160px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .schedule-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .schedule-title {
        font-size: 14px;
        font-weight: 500;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .schedule-keyword {
        font-size: 12px;
        color: #a0a0b8;
      }

      .status-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;

        &.pending {
          background: rgba(255, 193, 7, 0.15);
          color: #ffc107;
        }

        &.processing {
          background: rgba(108, 92, 231, 0.15);
          color: #a29bfe;
        }

        &.completed {
          background: rgba(0, 217, 165, 0.15);
          color: #00d9a5;
        }

        &.failed {
          background: rgba(255, 107, 107, 0.15);
          color: #ff6b6b;
        }
      }

      .schedule-actions {
        display: flex;
        gap: 4px;

        button {
          color: #a0a0b8;

          &:hover {
            color: #e94560;
          }
        }
      }

      .empty-state {
        padding: 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: #a0a0b8;

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          opacity: 0.5;
        }

        span {
          font-size: 16px;
          font-weight: 500;
          color: #ffffff;
        }

        p {
          font-size: 13px;
          margin: 0;
        }
      }

      .clear-actions {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
      }

      @media (max-width: 768px) {
        .calendar-day {
          min-height: 60px;
        }

        .schedule-card {
          flex-wrap: wrap;
        }

        .schedule-time {
          min-width: auto;
          flex: 1 1 100%;
        }
      }
    `,
  ],
})
export class SchedulerComponent implements OnInit {
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  currentDate = new Date();
  currentMonthName = signal('');
  currentYear = signal(0);
  calendarDays = signal<any[]>([]);
  scheduledPosts = signal<ScheduledPost[]>([]);
  stats = signal({ pending: 0, completed: 0, failed: 0 });

  constructor(
    private schedulerService: SchedulerService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.updateCalendar();
    this.loadScheduledPosts();
  }

  private updateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.currentMonthName.set(new Date(year, month).toLocaleString('default', { month: 'long' }));
    this.currentYear.set(year);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: any[] = [];
    const scheduledPosts = this.scheduledPosts();

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        currentMonth: false,
        isToday: false,
        posts: [],
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const dayPosts = scheduledPosts.filter((p) => {
        const postDate = new Date(p.scheduledTime);
        return (
          postDate.getDate() === i &&
          postDate.getMonth() === month &&
          postDate.getFullYear() === year
        );
      });

      days.push({
        date: i,
        currentMonth: true,
        isToday:
          today.getDate() === i && today.getMonth() === month && today.getFullYear() === year,
        posts: dayPosts,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        currentMonth: false,
        isToday: false,
        posts: [],
      });
    }

    this.calendarDays.set(days);
  }

  private loadScheduledPosts(): void {
    this.schedulerService.scheduledPosts$.subscribe((posts) => {
      this.scheduledPosts.set(posts);
      this.stats.set(this.schedulerService.getStats());
      this.updateCalendar();
    });
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.updateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.updateCalendar();
  }

  formatScheduleDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  reschedulePost(post: ScheduledPost): void {
    this.snackBar.open('Reschedule functionality coming soon', 'Close', { duration: 2000 });
  }

  cancelSchedule(post: ScheduledPost): void {
    if (confirm(`Cancel scheduled post "${post.post.title}"?`)) {
      this.schedulerService.cancelSchedule(post.id).subscribe({
        next: () => {
          this.snackBar.open('Schedule cancelled', 'Close', { duration: 3000 });
        },
      });
    }
  }

  clearCompleted(): void {
    this.schedulerService.clearCompleted();
    this.snackBar.open('Completed posts cleared', 'Close', { duration: 2000 });
  }
}
