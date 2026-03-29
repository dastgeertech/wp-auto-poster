import { Injectable } from '@angular/core';

export interface ScheduledContent {
  id: string;
  keyword: string;
  title?: string;
  scheduledDate: Date;
  timezone: string;
  status: 'scheduled' | 'processing' | 'published' | 'failed';
  templateId?: string;
  language: string;
  autoPostSocial: boolean;
  socialPlatforms?: ('twitter' | 'linkedin' | 'facebook')[];
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContentSchedulerService {
  private scheduledContent: ScheduledContent[] = [];

  readonly commonTimezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Central Europe (CET)' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  ];

  readonly timeSlots: TimeSlot[] = [
    { hour: 6, minute: 0, label: '6:00 AM' },
    { hour: 7, minute: 0, label: '7:00 AM' },
    { hour: 8, minute: 0, label: '8:00 AM' },
    { hour: 9, minute: 0, label: '9:00 AM' },
    { hour: 10, minute: 0, label: '10:00 AM' },
    { hour: 11, minute: 0, label: '11:00 AM' },
    { hour: 12, minute: 0, label: '12:00 PM' },
    { hour: 13, minute: 0, label: '1:00 PM' },
    { hour: 14, minute: 0, label: '2:00 PM' },
    { hour: 15, minute: 0, label: '3:00 PM' },
    { hour: 16, minute: 0, label: '4:00 PM' },
    { hour: 17, minute: 0, label: '5:00 PM' },
    { hour: 18, minute: 0, label: '6:00 PM' },
    { hour: 19, minute: 0, label: '7:00 PM' },
    { hour: 20, minute: 0, label: '8:00 PM' },
    { hour: 21, minute: 0, label: '9:00 PM' },
  ];

  constructor() {
    this.loadScheduledContent();
  }

  private loadScheduledContent(): void {
    try {
      const saved = localStorage.getItem('scheduled_content');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.scheduledContent = parsed.map((item: any) => ({
          ...item,
          scheduledDate: new Date(item.scheduledDate),
        }));
      }
    } catch (e) {}
  }

  private saveScheduledContent(): void {
    localStorage.setItem('scheduled_content', JSON.stringify(this.scheduledContent));
  }

  getScheduledContent(): ScheduledContent[] {
    return this.scheduledContent;
  }

  getContentForDate(date: Date): ScheduledContent[] {
    const targetDate = new Date(date).toDateString();
    return this.scheduledContent.filter(
      (c) => new Date(c.scheduledDate).toDateString() === targetDate,
    );
  }

  getContentForMonth(year: number, month: number): Map<number, ScheduledContent[]> {
    const monthContent = new Map<number, ScheduledContent[]>();

    this.scheduledContent.forEach((content) => {
      const date = new Date(content.scheduledDate);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        if (!monthContent.has(day)) {
          monthContent.set(day, []);
        }
        monthContent.get(day)!.push(content);
      }
    });

    return monthContent;
  }

  scheduleContent(
    keyword: string,
    scheduledDate: Date,
    timezone: string,
    options?: {
      templateId?: string;
      language?: string;
      autoPostSocial?: boolean;
      socialPlatforms?: ('twitter' | 'linkedin' | 'facebook')[];
      recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
    },
  ): ScheduledContent {
    const content: ScheduledContent = {
      id: 'sched_' + Date.now(),
      keyword,
      scheduledDate,
      timezone,
      status: 'scheduled',
      templateId: options?.templateId,
      language: options?.language || 'en',
      autoPostSocial: options?.autoPostSocial || false,
      socialPlatforms: options?.socialPlatforms,
      recurrence: options?.recurrence || 'none',
    };

    this.scheduledContent.push(content);
    this.saveScheduledContent();

    return content;
  }

  updateContent(id: string, updates: Partial<ScheduledContent>): void {
    const index = this.scheduledContent.findIndex((c) => c.id === id);
    if (index >= 0) {
      this.scheduledContent[index] = { ...this.scheduledContent[index], ...updates };
      this.saveScheduledContent();
    }
  }

  deleteContent(id: string): void {
    this.scheduledContent = this.scheduledContent.filter((c) => c.id !== id);
    this.saveScheduledContent();
  }

  rescheduleContent(id: string, newDate: Date): void {
    this.updateContent(id, { scheduledDate: newDate });
  }

  getDueContent(): ScheduledContent[] {
    const now = new Date();
    return this.scheduledContent
      .filter((c) => c.status === 'scheduled' && new Date(c.scheduledDate) <= now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  getNextScheduledContent(): ScheduledContent | null {
    const now = new Date();
    const upcoming = this.scheduledContent
      .filter((c) => c.status === 'scheduled' && new Date(c.scheduledDate) > now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    return upcoming[0] || null;
  }

  getStats(): {
    scheduled: number;
    published: number;
    failed: number;
    nextPublish: Date | null;
  } {
    return {
      scheduled: this.scheduledContent.filter((c) => c.status === 'scheduled').length,
      published: this.scheduledContent.filter((c) => c.status === 'published').length,
      failed: this.scheduledContent.filter((c) => c.status === 'failed').length,
      nextPublish: this.getNextScheduledContent()?.scheduledDate || null,
    };
  }

  convertToTimezone(date: Date, timezone: string): Date {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  }

  getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  generateCalendarDays(
    year: number,
    month: number,
  ): {
    date: number;
    dayName: string;
    isToday: boolean;
    isCurrentMonth: boolean;
    posts: ScheduledContent[];
  }[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const today = new Date();
    const monthContent = this.getContentForMonth(year, month);
    const days: any[] = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < startPadding; i++) {
      const prevDate = new Date(year, month, -startPadding + i + 1);
      days.push({
        date: prevDate.getDate(),
        dayName: dayNames[prevDate.getDay()],
        isToday: false,
        isCurrentMonth: false,
        posts: [],
      });
    }

    for (let date = 1; date <= daysInMonth; date++) {
      const currentDate = new Date(year, month, date);
      const isToday =
        today.getDate() === date && today.getMonth() === month && today.getFullYear() === year;

      days.push({
        date,
        dayName: dayNames[currentDate.getDay()],
        isToday,
        isCurrentMonth: true,
        posts: monthContent.get(date) || [],
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: i,
        dayName: dayNames[nextDate.getDay()],
        isToday: false,
        isCurrentMonth: false,
        posts: [],
      });
    }

    return days;
  }
}
