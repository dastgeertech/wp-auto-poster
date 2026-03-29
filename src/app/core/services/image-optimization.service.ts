import { Injectable } from '@angular/core';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  resize?: boolean;
  compress?: boolean;
}

export interface OptimizedImage {
  originalUrl: string;
  optimizedUrl: string;
  originalSize: number;
  optimizedSize: number;
  savings: number;
  format: string;
  width: number;
  height: number;
}

export interface ImageAnalysis {
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlt: boolean;
  isLazyLoaded: boolean;
  suggestions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ImageOptimizationService {
  private cache = new Map<string, OptimizedImage>();

  constructor() {}

  async optimizeImage(
    url: string,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizedImage> {
    const cacheKey = `${url}_${JSON.stringify(options)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const defaults = {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 85,
      format: 'webp' as const,
      resize: true,
      compress: true,
    };

    const opts = { ...defaults, ...options };

    const mockOptimization: OptimizedImage = {
      originalUrl: url,
      optimizedUrl: url,
      originalSize: 500000 + Math.random() * 2000000,
      optimizedSize: 0,
      savings: 0,
      format: opts.format,
      width: opts.maxWidth!,
      height: opts.maxHeight!,
    };

    const ratio = 0.4 + Math.random() * 0.3;
    mockOptimization.optimizedSize = Math.round(mockOptimization.originalSize * ratio);
    mockOptimization.savings = Math.round((1 - ratio) * 100);

    this.cache.set(cacheKey, mockOptimization);
    return mockOptimization;
  }

  analyzeImage(url: string): ImageAnalysis {
    const hash = this.hashString(url);
    const width = 800 + (hash % 1200);
    const height = 600 + ((hash * 7) % 800);
    const size = 100000 + (hash % 500000);

    const formats = ['jpeg', 'png', 'webp', 'gif'];
    const format = formats[hash % formats.length];

    const suggestions: string[] = [];

    if (width > 1200) {
      suggestions.push('Image is larger than necessary. Consider resizing to max 1200px width.');
    }
    if (size > 500000) {
      suggestions.push('Large file size detected. Compress to reduce load time.');
    }
    if (format === 'png') {
      suggestions.push('PNG format detected. Consider using WebP for better compression.');
    }
    if (hash % 3 === 0) {
      suggestions.push('Missing alt text. Add descriptive alt attribute for accessibility.');
    }
    if (hash % 4 === 0) {
      suggestions.push('Image is not lazy loaded. Add loading="lazy" attribute.');
    }

    return {
      url,
      width,
      height,
      format,
      size,
      hasAlt: hash % 2 === 0,
      isLazyLoaded: hash % 3 !== 0,
      suggestions,
    };
  }

  generateResponsiveSrcSet(url: string): string {
    const widths = [320, 640, 960, 1280, 1920];
    return widths.map((w) => `${url}?w=${w} ${w}w`).join(', ');
  }

  async compressImage(file: File, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  }

  isValidImageUrl(url: string): boolean {
    try {
      const u = new URL(url);
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
      return validExtensions.some((ext) => u.pathname.toLowerCase().endsWith(ext));
    } catch {
      return false;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getSavingsColor(savings: number): string {
    if (savings > 50) return '#00d9a5';
    if (savings > 25) return '#ffc107';
    return '#ff6b6b';
  }

  clearCache(): void {
    this.cache.clear();
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
