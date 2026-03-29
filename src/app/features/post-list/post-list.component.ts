import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WordPressService } from '../../core/services/wordpress.service';
import { WordPressPost, WordPressPostTitle, WordPressPostContent } from '../../core/models';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="post-list">
      <div class="list-header">
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search posts</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="searchQuery" (ngModelChange)="filterPosts()">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (ngModelChange)="filterPosts()">
              <mat-option value="all">All</mat-option>
              <mat-option value="publish">Published</mat-option>
              <mat-option value="draft">Draft</mat-option>
              <mat-option value="future">Scheduled</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="header-actions">
          <button mat-stroked-button (click)="loadPosts()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>

      <div class="posts-table">
        <div class="table-header">
          <span class="col-title">Title</span>
          <span class="col-status">Status</span>
          <span class="col-date">Date</span>
          <span class="col-actions">Actions</span>
        </div>

        @for (post of filteredPosts(); track post.id) {
          <div class="table-row">
            <div class="col-title">
              <span class="post-title" [innerHTML]="getPostTitle(post.title)"></span>
              <span class="post-id">#{{ post.id }}</span>
            </div>
            <div class="col-status">
              <span class="status-badge" [class]="post.status">{{ post.status }}</span>
            </div>
            <div class="col-date">
              {{ formatDate(post.date) }}
            </div>
            <div class="col-actions">
              <button mat-icon-button [matMenuTriggerFor]="actionsMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #actionsMenu="matMenu">
                <button mat-menu-item (click)="editPost(post)">
                  <mat-icon>edit</mat-icon>
                  <span>Edit</span>
                </button>
                <button mat-menu-item (click)="viewPost(post)">
                  <mat-icon>visibility</mat-icon>
                  <span>View</span>
                </button>
                @if (post.status === 'draft') {
                  <button mat-menu-item (click)="publishNow(post)">
                    <mat-icon>publish</mat-icon>
                    <span>Publish Now</span>
                  </button>
                }
                <button mat-menu-item (click)="deletePost(post)" class="delete-action">
                  <mat-icon>delete</mat-icon>
                  <span>Delete</span>
                </button>
              </mat-menu>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <span>No posts found</span>
            <p>Create your first post to get started</p>
          </div>
        }
      </div>

      @if (hasMore()) {
        <div class="load-more">
          <button mat-stroked-button (click)="loadMore()">
            Load More
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .post-list {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .search-field {
      width: 300px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .posts-table {
      background: linear-gradient(135deg, #1f1f35 0%, #1a1a2e 100%);
      border-radius: 16px;
      border: 1px solid rgba(233, 69, 96, 0.1);
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 1fr 100px 150px 80px;
      gap: 16px;
      padding: 16px 20px;
      background: rgba(0, 0, 0, 0.2);
      font-size: 12px;
      font-weight: 600;
      color: #a0a0b8;
      text-transform: uppercase;
    }

    .table-row {
      display: grid;
      grid-template-columns: 1fr 100px 150px 80px;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      align-items: center;
      transition: background 0.2s ease;

      &:hover {
        background: rgba(233, 69, 96, 0.05);
      }

      &:last-child {
        border-bottom: none;
      }
    }

    .col-title {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .post-title {
      font-size: 14px;
      font-weight: 500;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &:deep(a) {
        color: inherit;
        text-decoration: none;
      }
    }

    .post-id {
      font-size: 11px;
      color: #a0a0b8;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;

      &.publish {
        background: rgba(0, 217, 165, 0.15);
        color: #00d9a5;
      }

      &.draft {
        background: rgba(160, 160, 184, 0.15);
        color: #a0a0b8;
      }

      &.future {
        background: rgba(255, 193, 7, 0.15);
        color: #ffc107;
      }

      &.pending {
        background: rgba(108, 92, 231, 0.15);
        color: #a29bfe;
      }
    }

    .col-date {
      font-size: 13px;
      color: #a0a0b8;
    }

    .col-actions {
      display: flex;
      justify-content: flex-end;
    }

    .empty-state {
      padding: 60px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #a0a0b8;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
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

    .load-more {
      display: flex;
      justify-content: center;
      padding: 20px;
    }

    .delete-action {
      color: #ff6b6b;
    }

    @media (max-width: 768px) {
      .table-header {
        display: none;
      }

      .table-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .col-status, .col-date {
        font-size: 12px;
      }

      .search-field {
        width: 100%;
      }

      .filters {
        width: 100%;
      }
    }
  `]
})
export class PostListComponent implements OnInit {
  posts = signal<WordPressPost[]>([]);
  filteredPosts = signal<WordPressPost[]>([]);
  searchQuery = '';
  statusFilter = 'all';
  currentPage = 1;
  hasMorePosts = true;
  hasMore = signal(false);

  constructor(
    private wordpressService: WordPressService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.wordpressService.getPosts({ per_page: 20, page: 1 }).subscribe(posts => {
      this.posts.set(posts);
      this.filterPosts();
      this.currentPage = 1;
      this.hasMorePosts = posts.length === 20;
      this.hasMore.set(this.hasMorePosts);
    });
  }

  loadMore(): void {
    const nextPage = this.currentPage + 1;
    this.wordpressService.getPosts({ per_page: 20, page: nextPage }).subscribe(posts => {
      this.posts.update(current => [...current, ...posts]);
      this.filterPosts();
      this.currentPage = nextPage;
      this.hasMorePosts = posts.length === 20;
      this.hasMore.set(this.hasMorePosts);
    });
  }

  filterPosts(): void {
    let filtered = this.posts();

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        this.getPostTitle(p.title).toLowerCase().includes(query) ||
        this.getPostContent(p.content).toLowerCase().includes(query)
      );
    }

    this.filteredPosts.set(filtered);
  }

  getPostTitle(title: string | WordPressPostTitle | undefined): string {
    if (!title) return 'Untitled';
    if (typeof title === 'string') return title;
    return title.rendered || 'Untitled';
  }

  getPostContent(content: string | WordPressPostContent | undefined): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    return content.rendered || '';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  editPost(post: WordPressPost): void {
    this.snackBar.open('Edit functionality coming soon', 'Close', { duration: 2000 });
  }

  viewPost(post: WordPressPost): void {
    const settings = this.wordpressService.getSettings();
    if (settings?.wordpress?.apiUrl) {
      const url = `${settings.wordpress.apiUrl.replace('/wp-json', '')}/?p=${post.id}`;
      window.open(url, '_blank');
    }
  }

  publishNow(post: WordPressPost): void {
    this.wordpressService.updatePost(post.id!, { status: 'publish' }).subscribe({
      next: () => {
        this.snackBar.open('Post published!', 'Close', { duration: 3000 });
        this.loadPosts();
      },
      error: () => {
        this.snackBar.open('Failed to publish post', 'Close', { duration: 3000 });
      }
    });
  }

  deletePost(post: WordPressPost): void {
    if (confirm(`Are you sure you want to delete "${this.getPostTitle(post.title)}"?`)) {
      this.wordpressService.deletePost(post.id!).subscribe({
        next: () => {
          this.snackBar.open('Post deleted', 'Close', { duration: 3000 });
          this.loadPosts();
        },
        error: () => {
          this.snackBar.open('Failed to delete post', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
