import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ProxyRequest {
  provider: 'anthropic' | 'google' | 'openai' | 'groq' | 'mistral' | 'xai';
  model?: string;
  messages?: any[];
  contents?: any;
  max_tokens?: number;
  temperature?: number;
  generationConfig?: any;
}

@Injectable({
  providedIn: 'root',
})
export class ServerlessService {
  private baseUrl: string = 'https://your-wp-auto-poster-api.vercel.app';

  constructor(private http: HttpClient) {
    this.loadApiUrl();
  }

  private loadApiUrl(): void {
    const stored = localStorage.getItem('wp_settings');
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.serverless?.apiUrl) {
        this.baseUrl = settings.serverless.apiUrl;
      }
    }
  }

  setApiUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
    const stored = localStorage.getItem('wp_settings');
    const settings = stored ? JSON.parse(stored) : {};
    settings.serverless = settings.serverless || {};
    settings.serverless.apiUrl = url;
    localStorage.setItem('wp_settings', JSON.stringify(settings));
  }

  getApiUrl(): string {
    return this.baseUrl;
  }

  private proxy(request: ProxyRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/proxy`, request).pipe(
      catchError((err) => {
        const errorMsg = err.error?.error || err.message || 'Serverless proxy request failed';
        return throwError(() => new Error(errorMsg));
      }),
    );
  }

  generateWithClaude(messages: any[], model?: string, maxTokens?: number): Observable<any> {
    return this.proxy({
      provider: 'anthropic',
      model: model || 'claude-sonnet-4-5-20251120',
      messages,
      max_tokens: maxTokens || 8192,
      temperature: 0.7,
    });
  }

  generateWithGemini(contents: any, model?: string, temperature?: number): Observable<any> {
    return this.proxy({
      provider: 'google',
      model: model || 'gemini-2.5-flash',
      contents,
      temperature: temperature || 0.7,
      max_tokens: 8192,
    });
  }

  generateWithOpenAI(messages: any[], model?: string, maxTokens?: number): Observable<any> {
    return this.proxy({
      provider: 'openai',
      model: model || 'gpt-4o',
      messages,
      max_tokens: maxTokens || 8192,
      temperature: 0.7,
    });
  }

  generateWithGroq(messages: any[], model?: string, maxTokens?: number): Observable<any> {
    return this.proxy({
      provider: 'groq',
      model: model || 'llama-3.3-70b-versatile',
      messages,
      max_tokens: maxTokens || 8192,
      temperature: 0.7,
    });
  }

  generateWithMistral(messages: any[], model?: string, maxTokens?: number): Observable<any> {
    return this.proxy({
      provider: 'mistral',
      model: model || 'mistral-large-latest',
      messages,
      max_tokens: maxTokens || 8192,
      temperature: 0.7,
    });
  }

  generateWithGrok(messages: any[], model?: string, maxTokens?: number): Observable<any> {
    return this.proxy({
      provider: 'xai',
      model: model || 'grok-3',
      messages,
      max_tokens: maxTokens || 8192,
      temperature: 0.7,
    });
  }

  testConnection(): Observable<any> {
    return this.proxy({
      provider: 'openai',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    });
  }
}
