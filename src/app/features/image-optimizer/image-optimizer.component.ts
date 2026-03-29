import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-image-optimizer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule, MatProgressBarModule],
  template: `
    <div class="img-container">
      <header class="page-header">
        <h1><mat-icon>image</mat-icon> Image Optimizer</h1>
        <p>Optimize images for faster page load and better SEO</p>
      </header>
      <mat-card class="upload-card">
        <mat-icon>cloud_upload</mat-icon>
        <h3>Drop images here or click to upload</h3>
        <p>Supports JPG, PNG, WebP, GIF (max 10MB)</p>
        <button mat-raised-button color="primary"><mat-icon>upload</mat-icon> Select Files</button>
      </mat-card>
      <div class="stats-row">
        <mat-card class="stat"
          ><mat-icon>photo_library</mat-icon><span class="val">{{ images.length }}</span
          ><span class="lbl">Images</span></mat-card
        >
        <mat-card class="stat"
          ><mat-icon>compress</mat-icon><span class="val">2.4MB</span
          ><span class="lbl">Total Size</span></mat-card
        >
        <mat-card class="stat"
          ><mat-icon>storage</mat-icon><span class="val">1.8MB</span
          ><span class="lbl">Potential Savings</span></mat-card
        >
      </div>
      <div class="images-grid">
        @for (img of images; track img.name) {
          <mat-card class="img-card">
            <div class="img-preview"><mat-icon>image</mat-icon></div>
            <div class="img-info">
              <span class="name">{{ img.name }}</span
              ><span class="size">{{ img.size }}</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="img.savings"></mat-progress-bar>
            <span class="savings">{{ img.savings }}% smaller with WebP</span>
            <div class="actions"><button mat-stroked-button>Download</button></div>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .img-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 8px;
          font-size: 28px;
          color: #fff;
          mat-icon {
            color: #e94560;
          }
        }
        p {
          margin: 0 0 24px;
          color: #a0a0b8;
        }
      }
      .upload-card {
        background: #1a1a2e;
        border: 2px dashed rgba(233, 69, 96, 0.5);
        text-align: center;
        padding: 48px;
        margin-bottom: 24px;
        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: #e94560;
          opacity: 0.5;
        }
        h3 {
          margin: 16px 0 8px;
          color: #fff;
        }
        p {
          color: #a0a0b8;
          margin-bottom: 16px;
        }
      }
      .stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      .stat {
        background: #1a1a2e;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        mat-icon {
          font-size: 32px;
          color: #e94560;
        }
        .val {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
        }
        .lbl {
          font-size: 12px;
          color: #a0a0b8;
        }
      }
      .images-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
      }
      .img-card {
        background: #1a1a2e;
        padding: 16px;
        .img-preview {
          width: 100%;
          height: 120px;
          background: #16213e;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: #a0a0b8;
          }
        }
        .img-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          .name {
            color: #fff;
            font-size: 14px;
          }
          .size {
            color: #a0a0b8;
            font-size: 12px;
          }
        }
        mat-progress-bar {
          margin-bottom: 8px;
        }
        .savings {
          font-size: 12px;
          color: #4caf50;
          display: block;
          margin-bottom: 12px;
        }
        .actions {
          display: flex;
          gap: 8px;
          button {
            flex: 1;
          }
        }
      }
    `,
  ],
})
export class ImageOptimizerComponent {
  images = [
    { name: 'hero-banner.jpg', size: '450KB', savings: 72 },
    { name: 'product-shot.png', size: '1.2MB', savings: 65 },
    { name: 'team-photo.jpg', size: '890KB', savings: 58 },
    { name: 'blog-featured.jpg', size: '320KB', savings: 82 },
  ];
}
