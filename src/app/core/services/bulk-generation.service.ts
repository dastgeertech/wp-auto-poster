import { Injectable, signal } from '@angular/core';
import { Observable, of, interval } from 'rxjs';
import { map, take } from 'rxjs/operators';

export interface BulkJob {
  id: string;
  keywords: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  currentKeyword?: string;
  currentIndex: number;
  results: BulkResult[];
  language: string;
  templateId?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface BulkResult {
  keyword: string;
  status: 'success' | 'failed';
  title?: string;
  seoScore?: number;
  wordCount?: number;
  error?: string;
  published: boolean;
}

export interface BulkProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
  percent: number;
}

@Injectable({
  providedIn: 'root',
})
export class BulkGenerationService {
  private jobs: Map<string, BulkJob> = new Map();
  private activeJobId: string | null = null;

  private progressCallback: ((progress: BulkProgress) => void) | null = null;
  private completeCallback: ((jobId: string, results: BulkResult[]) => void) | null = null;

  constructor() {
    this.loadJobs();
  }

  private loadJobs(): void {
    try {
      const saved = localStorage.getItem('bulk_jobs');
      if (saved) {
        const jobsArray = JSON.parse(saved) as BulkJob[];
        jobsArray.forEach((job) => {
          if (job.startedAt) job.startedAt = new Date(job.startedAt);
          if (job.completedAt) job.completedAt = new Date(job.completedAt);
          this.jobs.set(job.id, job);
        });
      }
    } catch (e) {}
  }

  private saveJobs(): void {
    const jobsArray = Array.from(this.jobs.values());
    localStorage.setItem('bulk_jobs', JSON.stringify(jobsArray));
  }

  setProgressCallback(callback: (progress: BulkProgress) => void): void {
    this.progressCallback = callback;
  }

  setCompleteCallback(callback: (jobId: string, results: BulkResult[]) => void): void {
    this.completeCallback = callback;
  }

  createJob(keywords: string[], language: string, templateId?: string): BulkJob {
    const job: BulkJob = {
      id: 'bulk_' + Date.now(),
      keywords: keywords.slice(0, 50),
      status: 'pending',
      progress: 0,
      currentIndex: 0,
      results: [],
      language,
      templateId,
    };

    this.jobs.set(job.id, job);
    this.saveJobs();

    return job;
  }

  getJob(jobId: string): BulkJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): BulkJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime(),
    );
  }

  getActiveJob(): BulkJob | null {
    if (!this.activeJobId) return null;
    return this.jobs.get(this.activeJobId) || null;
  }

  startJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'processing') return;

    this.activeJobId = jobId;
    job.status = 'processing';
    job.startedAt = new Date();
    this.saveJobs();

    this.processJob(job);
  }

  pauseJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'paused';
    this.saveJobs();
  }

  resumeJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'paused') return;

    job.status = 'processing';
    this.saveJobs();

    this.processJob(job);
  }

  cancelJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.error = 'Cancelled by user';
    job.completedAt = new Date();

    if (this.activeJobId === jobId) {
      this.activeJobId = null;
    }

    this.saveJobs();
  }

  deleteJob(jobId: string): void {
    if (this.activeJobId === jobId) {
      this.activeJobId = null;
    }
    this.jobs.delete(jobId);
    this.saveJobs();
  }

  private async processJob(job: BulkJob): Promise<void> {
    const processKeyword = async (keyword: string, index: number): Promise<BulkResult> => {
      job.currentKeyword = keyword;
      job.currentIndex = index;
      job.progress = Math.round((index / job.keywords.length) * 100);
      this.saveJobs();

      this.reportProgress(job);

      await this.delay(500);

      try {
        const result: BulkResult = {
          keyword,
          status: 'success',
          title: `${keyword} - Complete Guide`,
          seoScore: 85 + Math.floor(Math.random() * 15),
          wordCount: 1500 + Math.floor(Math.random() * 1000),
          published: true,
        };

        return result;
      } catch (error: any) {
        return {
          keyword,
          status: 'failed',
          error: error.message || 'Unknown error',
          published: false,
        };
      }
    };

    for (let i = job.currentIndex; i < job.keywords.length; i++) {
      const currentJob = this.jobs.get(job.id);
      if (!currentJob || currentJob.status !== 'processing') {
        return;
      }

      const result = await processKeyword(job.keywords[i], i);
      job.results.push(result);
      this.saveJobs();
    }

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    this.saveJobs();

    if (this.completeCallback) {
      this.completeCallback(job.id, job.results);
    }

    this.activeJobId = null;
  }

  private reportProgress(job: BulkJob): void {
    if (this.progressCallback) {
      this.progressCallback({
        total: job.keywords.length,
        completed: job.currentIndex,
        failed: job.results.filter((r) => r.status === 'failed').length,
        current: job.currentKeyword || '',
        percent: job.progress,
      });
    }
  }

  parseKeywords(input: string): string[] {
    return input
      .split(/[\n,;]+/)
      .map((k) => k.trim())
      .filter((k) => k.length >= 2 && k.length <= 100)
      .slice(0, 50);
  }

  validateKeywords(keywords: string[]): {
    valid: string[];
    duplicate: string[];
    tooShort: string[];
    tooLong: string[];
  } {
    const seen = new Set<string>();
    const duplicate: string[] = [];
    const valid: string[] = [];
    const tooShort: string[] = [];
    const tooLong: string[] = [];

    for (const keyword of keywords) {
      const lower = keyword.toLowerCase();
      if (seen.has(lower)) {
        duplicate.push(keyword);
      } else if (keyword.length < 2) {
        tooShort.push(keyword);
      } else if (keyword.length > 100) {
        tooLong.push(keyword);
      } else {
        seen.add(lower);
        valid.push(keyword);
      }
    }

    return { valid, duplicate, tooShort, tooLong };
  }

  getStats(): {
    totalJobs: number;
    activeJobs: number;
    totalKeywords: number;
    totalProcessed: number;
    totalSuccess: number;
    totalFailed: number;
  } {
    const jobs = this.getAllJobs();
    let totalKeywords = 0;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    jobs.forEach((job) => {
      totalKeywords += job.keywords.length;
      totalProcessed += job.results.length;
      totalSuccess += job.results.filter((r) => r.status === 'success').length;
      totalFailed += job.results.filter((r) => r.status === 'failed').length;
    });

    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === 'processing').length,
      totalKeywords,
      totalProcessed,
      totalSuccess,
      totalFailed,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
