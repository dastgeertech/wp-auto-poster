import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, interval, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ScheduledPost, WordPressPost } from '../models';
import { WordPressService } from './wordpress.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class SchedulerService implements OnDestroy {
  private scheduledPostsSubject = new BehaviorSubject<ScheduledPost[]>([]);
  scheduledPosts$ = this.scheduledPostsSubject.asObservable();

  private processingSubject = new BehaviorSubject<boolean>(false);
  processing$ = this.processingSubject.asObservable();

  private checkInterval: Subscription | null = null;
  private defaultPostTime: string = '09:00';
  private timezone: string = 'UTC';
  private autoPostEnabled: boolean = false;

  constructor(private wordpressService: WordPressService) {
    this.loadScheduledPosts();
    this.startScheduler();
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      this.checkInterval.unsubscribe();
    }
  }

  updateSettings(postTime: string, timezone: string, autoPost: boolean): void {
    this.defaultPostTime = postTime;
    this.timezone = timezone;
    this.autoPostEnabled = autoPost;
  }

  private loadScheduledPosts(): void {
    const stored = localStorage.getItem('scheduled_posts');
    if (stored) {
      const posts = JSON.parse(stored);
      this.scheduledPostsSubject.next(posts.map((p: any) => ({
        ...p,
        scheduledTime: new Date(p.scheduledTime)
      })));
    }
  }

  private saveScheduledPosts(): void {
    const posts = this.scheduledPostsSubject.getValue();
    localStorage.setItem('scheduled_posts', JSON.stringify(posts));
  }

  private startScheduler(): void {
    // Check every minute for posts to publish
    this.checkInterval = interval(60000).subscribe(() => {
      this.processQueue();
    });
  }

  schedulePost(post: WordPressPost, scheduledTime: Date): Observable<ScheduledPost> {
    const newPost: ScheduledPost = {
      id: uuidv4(),
      post,
      scheduledTime,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date()
    };

    const currentPosts = this.scheduledPostsSubject.getValue();
    const updatedPosts = [...currentPosts, newPost];
    this.scheduledPostsSubject.next(updatedPosts);
    this.saveScheduledPosts();

    return of(newPost);
  }

  scheduleDailyPost(post: WordPressPost): Observable<ScheduledPost> {
    const now = new Date();
    const [hours, minutes] = this.defaultPostTime.split(':').map(Number);
    
    let scheduledDate = new Date(now);
    scheduledDate.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    return this.schedulePost(post, scheduledDate);
  }

  cancelSchedule(postId: string): Observable<boolean> {
    const currentPosts = this.scheduledPostsSubject.getValue();
    const updatedPosts = currentPosts.filter(p => p.id !== postId);
    this.scheduledPostsSubject.next(updatedPosts);
    this.saveScheduledPosts();
    return of(true);
  }

  updateSchedule(postId: string, newTime: Date): Observable<ScheduledPost | null> {
    const currentPosts = this.scheduledPostsSubject.getValue();
    const postIndex = currentPosts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) {
      return of(null);
    }

    currentPosts[postIndex].scheduledTime = newTime;
    currentPosts[postIndex].status = 'pending';
    this.scheduledPostsSubject.next([...currentPosts]);
    this.saveScheduledPosts();

    return of(currentPosts[postIndex]);
  }

  getScheduledPosts(): ScheduledPost[] {
    return this.scheduledPostsSubject.getValue();
  }

  getPendingPosts(): ScheduledPost[] {
    return this.scheduledPostsSubject.getValue()
      .filter(p => p.status === 'pending')
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }

  processQueue(): void {
    if (this.processingSubject.getValue()) {
      return;
    }

    const pendingPosts = this.getPendingPosts();
    const now = new Date();

    for (const scheduledPost of pendingPosts) {
      if (new Date(scheduledPost.scheduledTime) <= now) {
        this.publishPost(scheduledPost);
        break; // Process one at a time
      }
    }
  }

  private publishPost(scheduledPost: ScheduledPost): void {
    this.processingSubject.next(true);

    const postToPublish = {
      ...scheduledPost.post,
      status: 'future' as const,
      date: scheduledPost.scheduledTime.toISOString()
    };

    this.wordpressService.createPost(postToPublish).subscribe({
      next: (published) => {
        this.updatePostStatus(scheduledPost.id, 'completed', published.id);
        this.processingSubject.next(false);
      },
      error: (error) => {
        const newRetryCount = scheduledPost.retryCount + 1;
        if (newRetryCount >= 3) {
          this.updatePostStatus(scheduledPost.id, 'failed', undefined, error.message);
        } else {
          const updatedPost = this.scheduledPostsSubject.getValue()
            .find(p => p.id === scheduledPost.id);
          if (updatedPost) {
            updatedPost.retryCount = newRetryCount;
            updatedPost.status = 'pending';
            updatedPost.scheduledTime = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 minutes
            this.scheduledPostsSubject.next([...this.scheduledPostsSubject.getValue()]);
            this.saveScheduledPosts();
          }
        }
        this.processingSubject.next(false);
      }
    });
  }

  private updatePostStatus(
    postId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    publishedId?: number,
    error?: string
  ): void {
    const currentPosts = this.scheduledPostsSubject.getValue();
    const postIndex = currentPosts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
      currentPosts[postIndex].status = status;
      if (publishedId) {
        currentPosts[postIndex].post.id = publishedId;
        currentPosts[postIndex].publishedAt = new Date();
      }
      if (error) {
        currentPosts[postIndex].error = error;
      }
      
      this.scheduledPostsSubject.next([...currentPosts]);
      this.saveScheduledPosts();
    }
  }

  getStats(): { pending: number; completed: number; failed: number } {
    const posts = this.scheduledPostsSubject.getValue();
    return {
      pending: posts.filter(p => p.status === 'pending').length,
      completed: posts.filter(p => p.status === 'completed').length,
      failed: posts.filter(p => p.status === 'failed').length
    };
  }

  clearCompleted(): void {
    const currentPosts = this.scheduledPostsSubject.getValue();
    const activePosts = currentPosts.filter(p => p.status !== 'completed');
    this.scheduledPostsSubject.next(activePosts);
    this.saveScheduledPosts();
  }
}
