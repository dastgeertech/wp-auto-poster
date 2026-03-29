import { Injectable } from '@angular/core';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  oldestEntry: number;
}

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;

  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.loadFromStorage();
  }

  private getStorageKey(key: string): string {
    return `cache_${key}`;
  }

  private loadFromStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('cache_'));
      keys.forEach((storageKey) => {
        const key = storageKey.replace('cache_', '');
        const data = localStorage.getItem(storageKey);
        if (data) {
          const entry: CacheEntry<any> = JSON.parse(data);
          if (entry.expiresAt > Date.now()) {
            this.memoryCache.set(key, entry);
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      });
    } catch (e) {
      console.error('Failed to load cache from storage:', e);
    }
  }

  private saveToStorage(key: string, entry: CacheEntry<any>): void {
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
    } catch (e) {
      console.error('Failed to save cache to storage:', e);
      this.evictOldest();
      try {
        localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
      } catch (e2) {
        console.warn('Cache storage full, clearing all cache');
        this.clear();
      }
    }
  }

  get<T>(key: string, ttl?: number): T | null {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.DEFAULT_TTL),
    };

    this.memoryCache.set(key, entry);
    this.saveToStorage(key, entry);
  }

  delete(key: string): void {
    this.memoryCache.delete(key);
    localStorage.removeItem(this.getStorageKey(key));
  }

  clear(): void {
    this.memoryCache.clear();
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('cache_'));
    keys.forEach((key) => localStorage.removeItem(key));
    this.hits = 0;
    this.misses = 0;
  }

  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    this.memoryCache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = key;
      }
    });

    if (oldest) {
      this.delete(oldest);
    }
  }

  getStats(): CacheStats {
    const entries = Array.from(this.memoryCache.values());
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.memoryCache.size,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map((e) => e.timestamp)) : 0,
    };
  }

  generateKey(...parts: string[]): string {
    return parts.map((p) => p.toLowerCase().trim()).join('_');
  }

  generateContentKey(keyword: string, language: string, template?: string): string {
    return this.generateKey(keyword, language, template || 'default');
  }

  getOrSet<T>(key: string, factory: () => T | Promise<T>, ttl?: number): T | Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = factory();
    if (result instanceof Promise) {
      return result.then((data) => {
        this.set(key, data, ttl);
        return data;
      });
    }

    this.set(key, result, ttl);
    return result;
  }

  async getOrSetAsync<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  invalidateByPrefix(prefix: string): void {
    const keys = Array.from(this.memoryCache.keys()).filter((k) => k.startsWith(prefix));
    keys.forEach((key) => this.delete(key));
  }

  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.memoryCache.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => this.delete(key));
  }
}
