import { Injectable } from '@angular/core';

export interface ExportData {
  version: string;
  exportedAt: string;
  settings?: any;
  queue?: any[];
  templates?: any[];
  scheduledContent?: any[];
  analytics?: any;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ExportImportService {
  private readonly VERSION = '1.0.0';

  constructor() {}

  exportAll(): ExportData {
    return {
      version: this.VERSION,
      exportedAt: new Date().toISOString(),
      settings: this.loadFromStorage('wp_settings'),
      queue: this.loadFromStorage('ai_poster_queue'),
      templates: this.loadFromStorage('custom_templates'),
      scheduledContent: this.loadFromStorage('scheduled_content'),
      analytics: this.loadFromStorage('post_analytics'),
    };
  }

  exportSettings(): ExportData {
    return {
      version: this.VERSION,
      exportedAt: new Date().toISOString(),
      settings: this.loadFromStorage('wp_settings'),
    };
  }

  exportQueue(): ExportData {
    return {
      version: this.VERSION,
      exportedAt: new Date().toISOString(),
      queue: this.loadFromStorage('ai_poster_queue'),
    };
  }

  private loadFromStorage(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Failed to load ${key}:`, e);
      return null;
    }
  }

  importData(data: ExportData): ImportResult {
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
    };

    try {
      if (data.version !== this.VERSION) {
        result.warnings = result.warnings || [];
        result.warnings.push(`Version mismatch: expected ${this.VERSION}, got ${data.version}`);
      }

      if (data.settings) {
        this.saveToStorage('wp_settings', data.settings);
        result.imported++;
      }

      if (data.queue) {
        this.saveToStorage('ai_poster_queue', data.queue);
        result.imported++;
      }

      if (data.templates) {
        this.saveToStorage('custom_templates', data.templates);
        result.imported++;
      }

      if (data.scheduledContent) {
        this.saveToStorage('scheduled_content', data.scheduledContent);
        result.imported++;
      }

      if (data.analytics) {
        this.saveToStorage('post_analytics', data.analytics);
        result.imported++;
      }

      result.success = result.errors.length === 0;
    } catch (e: any) {
      result.success = false;
      result.errors.push(e.message || 'Unknown import error');
    }

    return result;
  }

  private saveToStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
      throw new Error(`Failed to import ${key}`);
    }
  }

  downloadExport(data: ExportData, filename?: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `wp-auto-poster-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async readFile(file: File): Promise<ExportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as ExportData;
          if (!data.version || !data.exportedAt) {
            reject(new Error('Invalid export file format'));
            return;
          }
          resolve(data);
        } catch (err) {
          reject(new Error('Failed to parse export file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  clearAllData(): void {
    const keys = [
      'wp_settings',
      'ai_poster_queue',
      'custom_templates',
      'scheduled_content',
      'post_analytics',
      'ai_multi_settings',
      'bulk_jobs',
      'social_accounts',
    ];

    keys.forEach((key) => localStorage.removeItem(key));
  }

  getStorageSize(): { key: string; size: string }[] {
    const keys = [
      'wp_settings',
      'ai_poster_queue',
      'custom_templates',
      'scheduled_content',
      'post_analytics',
      'ai_multi_settings',
      'bulk_jobs',
      'social_accounts',
    ];

    return keys.map((key) => {
      const data = localStorage.getItem(key);
      const size = data ? this.formatBytes(new Blob([data]).size) : '0 B';
      return { key, size };
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
