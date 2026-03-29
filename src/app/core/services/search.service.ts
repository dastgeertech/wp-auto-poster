import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, mergeMap } from 'rxjs/operators';

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  date?: string;
  content?: string;
  images?: string[];
  specs?: {
    processor?: string;
    display?: string;
    camera?: string;
    battery?: string;
    ram?: string;
    storage?: string;
    price?: string;
    releaseDate?: string;
  };
}

export interface ResearchData {
  keyword: string;
  searchResults: SearchResult[];
  stats: {
    totalResults: number;
    sources: string[];
  };
  summary: string;
  webContent?: Map<string, string>;
  images: string[];
  specs: {
    processor?: string;
    display?: string;
    camera?: string;
    battery?: string;
    ram?: string;
    storage?: string;
    price?: string;
    releaseDate?: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private serpApiKey: string = '';
  private bingApiKey: string = '';
  private grokApiKey: string = '';
  private tavilyApiKey: string = '';
  private jinaApiKey: string = '';

  constructor() {
    this.loadApiKeys();
  }

  private loadApiKeys(): void {
    try {
      const settings = localStorage.getItem('wp_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.ai?.serpApiKey) this.serpApiKey = parsed.ai.serpApiKey;
        if (parsed.ai?.bingApiKey) this.bingApiKey = parsed.ai.bingApiKey;
        if (parsed.ai?.grokApiKey) this.grokApiKey = parsed.ai.grokApiKey;
        if (parsed.ai?.tavilyApiKey) this.tavilyApiKey = parsed.ai.tavilyApiKey;
        if (parsed.ai?.jinaApiKey) this.jinaApiKey = parsed.ai.jinaApiKey;
      }
    } catch (e) {
      console.log('Could not load search API keys');
    }
  }

  updateApiKeys(config: {
    grokKey?: string;
    serpKey?: string;
    bingKey?: string;
    tavilyKey?: string;
    jinaKey?: string;
  }): void {
    if (config.grokKey) this.grokApiKey = config.grokKey;
    if (config.serpKey) this.serpApiKey = config.serpKey;
    if (config.bingKey) this.bingApiKey = config.bingKey;
    if (config.tavilyKey) this.tavilyApiKey = config.tavilyKey;
    if (config.jinaKey) this.jinaApiKey = config.jinaKey;
  }

  searchImages(keyword: string): Observable<string[]> {
    console.log('=== IMAGE SEARCH: ' + keyword + ' ===');

    return new Observable((observer) => {
      const images: string[] = [];

      if (this.serpApiKey) {
        this.searchImagesWithSerp(keyword)
          .then((results) => {
            images.push(...results);
            observer.next([...new Set(images)]);
            observer.complete();
          })
          .catch(() => {
            observer.next([...new Set(images)]);
            observer.complete();
          });
      } else {
        observer.next([]);
        observer.complete();
      }
    });
  }

  private async searchImagesWithSerp(keyword: string): Promise<string[]> {
    try {
      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(keyword + ' official')}&tbm=isch&api_key=${this.serpApiKey}`,
      );
      const data = await response.json();
      if (data.images_results) {
        return data.images_results
          .slice(0, 10)
          .map((img: any) => img.original || img.thumbnail || img.source)
          .filter((url: string) => url && url.startsWith('http'));
      }
    } catch (e) {
      console.log('Serp image search failed');
    }
    return [];
  }

  extractSpecsFromText(text: string, keyword: string): SearchResult['specs'] {
    const specs: SearchResult['specs'] = {};

    const patterns = {
      processor: /processor|cpu|chipset|snapdragon|exynos|apple a[0-9]+|dimensity|helio/i,
      display: /display|screen|oled|lcd|amoled|inch|resolution|hz/i,
      camera: /camera|mp|megapixel|lens|photo|video|ois|optical/i,
      battery: /battery|mah|charging|fast charge|watt/i,
      ram: /ram|gb memory|lpddr/i,
      storage: /storage|gb|tb|ssd|ufs/i,
      price: /\$[\d,]+|price|usd|eur|cost/i,
      releaseDate: /released?|launch|announce|202[45]/i,
    };

    Object.entries(patterns).forEach(([key, regex]) => {
      const match = text.match(regex);
      if (match) {
        const sentences = text.split(/[.!?]+/);
        const relevantSentence = sentences.find((s) => regex.test(s));
        if (relevantSentence) {
          (specs as any)[key] = relevantSentence.trim().substring(0, 200);
        }
      }
    });

    return specs;
  }

  researchTopic(keyword: string): Observable<ResearchData> {
    console.log('=== PARALLEL RESEARCH: ' + keyword + ' ===');
    console.log('Available APIs:', this.getAvailableApis());

    const searches = this.getAvailableSearches(keyword);

    return forkJoin(searches).pipe(
      map((results) => {
        const allResults: SearchResult[] = [];
        const sources: string[] = [];
        const webContent = new Map<string, string>();
        const allImages: string[] = [];
        const allSpecs: NonNullable<SearchResult['specs']>[] = [];

        results.forEach((result, index) => {
          if (result && result.length > 0) {
            result.forEach((r) => {
              if (r.images && r.images.length > 0) {
                allImages.push(...r.images);
              }
              if (r.specs) {
                allSpecs.push(r.specs);
              }
            });
            allResults.push(...result);
            const sourceName = this.getSourceName(index);
            if (sourceName) sources.push(sourceName);
          }
        });

        const uniqueResults = this.deduplicateResults(allResults);
        const summary = this.generateResearchSummary(uniqueResults);

        console.log('Research complete. Sources:', sources.join(', '));
        console.log('Total results:', uniqueResults.length);
        console.log('Found images:', allImages.length);
        console.log('Found specs:', allSpecs.length);

        return {
          keyword,
          searchResults: uniqueResults.slice(0, 20),
          stats: {
            totalResults: uniqueResults.length,
            sources,
          },
          summary,
          webContent,
          images: [...new Set(allImages)].slice(0, 10),
          specs: allSpecs.slice(0, 5),
        };
      }),
      catchError((err) => {
        console.log('All search APIs failed:', err.message);
        return of(this.generateFallbackResearch(keyword));
      }),
    );
  }

  private getAvailableApis(): string {
    const apis = [];
    if (this.grokApiKey) apis.push('Grok');
    if (this.tavilyApiKey) apis.push('Tavily');
    if (this.bingApiKey) apis.push('Bing');
    if (this.serpApiKey) apis.push('SerpAPI');
    if (this.jinaApiKey) apis.push('Jina Reader');
    return apis.length > 0 ? apis.join(', ') : 'None (will use Grok)';
  }

  private getSourceName(index: number): string {
    const names = ['Grok', 'Tavily', 'Bing', 'SerpAPI', 'Exa'];
    return names[index] || 'Unknown';
  }

  private getAvailableSearches(keyword: string): Observable<SearchResult[]>[] {
    const searches: Observable<SearchResult[]>[] = [];

    if (this.grokApiKey) {
      searches.push(this.searchWithGrok(keyword));
    }

    if (this.tavilyApiKey) {
      searches.push(this.searchWithTavily(keyword));
    }

    if (this.bingApiKey) {
      searches.push(this.searchWithBing(keyword));
    }

    if (this.serpApiKey) {
      searches.push(this.searchWithSerp(keyword));
    }

    if (searches.length === 0 && this.grokApiKey) {
      searches.push(this.searchWithGrok(keyword));
    }

    if (searches.length === 0) {
      searches.push(of([]));
    }

    return searches;
  }

  private searchWithGrok(keyword: string): Observable<SearchResult[]> {
    if (!this.grokApiKey) {
      return of([]);
    }

    console.log('Searching with Grok AI...');
    return new Observable((observer) => {
      fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.grokApiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-3',
          messages: [
            {
              role: 'system',
              content: `You are a research assistant with web search capabilities. Search for the latest and most accurate information about the given topic. Return ONLY a JSON array of search results in this exact format:
[{"title": "Article Title", "snippet": "Key information or description", "url": "https://example.com", "source": "Source Name", "date": "March 2026"}]

Return 10-15 results with the most recent information. Include specific facts, statistics, dates, and product names when available. Search for news from 2025-2026.`,
            },
            {
              role: 'user',
              content: `Search the web for comprehensive, up-to-date information about "${keyword}". Focus on 2025-2026 news, announcements, statistics, and developments. Return only the JSON array.`,
            },
          ],
          temperature: 0.2,
          max_tokens: 6000,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.choices?.[0]?.message?.content) {
            try {
              const content = data.choices[0].message.content;
              const jsonMatch = content.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                const results = JSON.parse(jsonMatch[0]);
                console.log('Grok found', results.length, 'results');
                observer.next(results);
              } else {
                observer.next([]);
              }
            } catch {
              observer.next([]);
            }
          } else {
            observer.next([]);
          }
          observer.complete();
        })
        .catch((err) => {
          console.log('Grok search failed:', err.message);
          observer.next([]);
          observer.complete();
        });
    });
  }

  private searchWithTavily(keyword: string): Observable<SearchResult[]> {
    if (!this.tavilyApiKey) {
      return of([]);
    }

    console.log('Searching with Tavily AI...');
    return new Observable((observer) => {
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.tavilyApiKey,
          query: `${keyword} 2025 2026 latest news`,
          search_depth: 'advanced',
          max_results: 12,
          include_answer: true,
          include_raw_content: false,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.results) {
            const results: SearchResult[] = data.results.map((item: any) => ({
              title: item.title,
              snippet: item.content || item.snippet,
              url: item.url,
              source: new URL(item.url).hostname.replace('www.', ''),
              date: item.published_date || '',
            }));
            console.log('Tavily found', results.length, 'results');
            observer.next(results);
          } else {
            observer.next([]);
          }
          observer.complete();
        })
        .catch((err) => {
          console.log('Tavily search failed:', err.message);
          observer.next([]);
          observer.complete();
        });
    });
  }

  private searchWithBing(keyword: string): Observable<SearchResult[]> {
    if (!this.bingApiKey) {
      return of([]);
    }

    console.log('Searching with Bing News...');
    return new Observable((observer) => {
      fetch(
        `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(keyword + ' 2025 2026')}&count=15&mkt=en-US&freshness=Month`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.bingApiKey,
          },
        },
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.value) {
            const results: SearchResult[] = data.value.map((item: any) => ({
              title: item.name,
              snippet: item.description,
              url: item.url,
              source: item.provider?.[0]?.name || 'Bing News',
              date: item.datePublished,
            }));
            console.log('Bing found', results.length, 'results');
            observer.next(results);
          } else {
            observer.next([]);
          }
          observer.complete();
        })
        .catch((err) => {
          console.log('Bing search failed:', err.message);
          observer.next([]);
          observer.complete();
        });
    });
  }

  private searchWithSerp(keyword: string): Observable<SearchResult[]> {
    if (!this.serpApiKey) {
      return of([]);
    }

    console.log('Searching with SerpAPI...');
    return new Observable((observer) => {
      fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(keyword + ' 2025 2026 latest news')}&api_key=${this.serpApiKey}&num=15&tbm=nws`,
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.news_results) {
            const results: SearchResult[] = data.news_results.map((item: any) => ({
              title: item.title,
              snippet: item.snippet,
              url: item.link,
              source: item.source,
              date: item.date,
            }));
            console.log('SerpAPI found', results.length, 'results');
            observer.next(results);
          } else {
            observer.next([]);
          }
          observer.complete();
        })
        .catch((err) => {
          console.log('SerpAPI search failed:', err.message);
          observer.next([]);
          observer.complete();
        });
    });
  }

  extractWebContent(url: string): Observable<string> {
    if (this.jinaApiKey) {
      return this.extractWithJina(url);
    }
    return of('');
  }

  private extractWithJina(url: string): Observable<string> {
    return new Observable((observer) => {
      fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
        headers: {
          Authorization: `Bearer ${this.jinaApiKey}`,
        },
      })
        .then((response) => response.text())
        .then((content) => {
          observer.next(content.substring(0, 5000));
          observer.complete();
        })
        .catch(() => {
          observer.next('');
          observer.complete();
        });
    });
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      const key = result.title.toLowerCase().substring(0, 60);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private generateResearchSummary(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No search results available.';
    }

    const snippets = results
      .slice(0, 8)
      .map((r) => r.snippet)
      .join('\n\n');
    return `Latest information from ${results.length} sources:\n\n${snippets}`;
  }

  private generateFallbackResearch(keyword: string): ResearchData {
    return {
      keyword,
      searchResults: [],
      stats: {
        totalResults: 0,
        sources: [],
      },
      summary: `Research on "${keyword}" - Search APIs not configured. Please add API keys in Settings.`,
      images: [],
      specs: [],
    };
  }

  extractFacts(results: SearchResult[]): string {
    return results
      .slice(0, 10)
      .map((r, i) => `${i + 1}. ${r.snippet}`)
      .join('\n');
  }

  extractStats(results: SearchResult[]): string {
    const statRegex = /\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*(?:million|billion|thousand|x)/gi;
    const stats: string[] = [];

    for (const result of results) {
      const matches = result.snippet.match(statRegex);
      if (matches) {
        stats.push(...matches.slice(0, 3));
      }
    }

    return [...new Set(stats)].slice(0, 15).join('\n') || 'Statistics vary by source';
  }

  extractDates(results: SearchResult[]): string[] {
    const dateRegex =
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s*202[56]|\b20[25]\d[-\/]\d{2}[-\/]\d{2}|\b(?:Q[1-4]\s*202[56])\b/gi;
    const dates: string[] = [];

    for (const result of results) {
      const text = (result.snippet || '') + ' ' + (result.date || '');
      const matches = text.match(dateRegex);
      if (matches) {
        dates.push(...matches);
      }
    }

    return [...new Set(dates)].slice(0, 8);
  }
}
