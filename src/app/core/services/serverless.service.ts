import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  private googleApiKey: string = '';

  constructor(private http: HttpClient) {
    this.loadApiKeys();
  }

  private loadApiKeys(): void {
    // Load from ai_multi_settings (where MultiAIProviderService saves API keys)
    const stored = localStorage.getItem('ai_multi_settings');
    if (stored) {
      const settings = JSON.parse(stored);
      this.googleApiKey = settings.apiKeys?.google || '';
    }

    // Also check wp_settings for backward compatibility
    if (!this.googleApiKey) {
      const wpStored = localStorage.getItem('wp_settings');
      if (wpStored) {
        const wpSettings = JSON.parse(wpStored);
        this.googleApiKey = wpSettings.ai?.geminiApiKey || '';
      }
    }
  }

  setApiUrl(url: string): void {
    // No longer needed - using direct API calls
  }

  getApiUrl(): string {
    return '';
  }

  private getGoogleApiKey(): string {
    // Reload API key from storage to get latest value
    const stored = localStorage.getItem('ai_multi_settings');
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.apiKeys?.google || '';
    }
    return '';
  }

  private generateWithGoogle(
    contents: any,
    model: string,
    temperature: number,
    maxTokens: number,
  ): Observable<any> {
    const apiKey = this.getGoogleApiKey();
    if (!apiKey) {
      return throwError(
        () =>
          new Error(
            'Google API key not configured. Please add your API key in AI Models settings.',
          ),
      );
    }

    return from(
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          }),
        },
      ).then((res) => res.json()),
    ).pipe(
      map((data: any) => {
        if (data.error) {
          throw new Error(data.error.message || 'Google API error');
        }
        return data;
      }),
      catchError((err) => {
        return throwError(() => new Error(err.message || 'Google API request failed'));
      }),
    );
  }

  generateWithClaude(messages: any[], model?: string, maxTokens?: number): Observable<any> {
    return throwError(
      () =>
        new Error('Claude requires API key configuration. Please use Gemini or another provider.'),
    );
  }

  generateWithGemini(contents: any, model?: string, temperature?: number): Observable<any> {
    return this.generateWithGoogle(contents, model || 'gemini-2.5-flash', temperature || 0.7, 8192);
  }

  generateWithOpenAI(messages: any[], model?: string, maxTokens?: number): Observable<any> {
    return throwError(
      () =>
        new Error('OpenAI requires API key configuration. Please use Gemini or another provider.'),
    );
  }

  generateWithGroq(messages: any[], model?: string, maxTokens?: number): Observable<any> {
    return throwError(
      () =>
        new Error('Groq requires API key configuration. Please use Gemini or another provider.'),
    );
  }

  generateWithMistral(messages: any[], model?: string, maxTokens?: number): Observable<any> {
    return throwError(
      () =>
        new Error('Mistral requires API key configuration. Please use Gemini or another provider.'),
    );
  }

  generateWithGrok(messages: any[], model?: string, maxTokens?: number): Observable<any> {
    return throwError(
      () =>
        new Error('Grok requires API key configuration. Please use Gemini or another provider.'),
    );
  }

  testConnection(): Observable<any> {
    return this.generateWithGemini([{ parts: [{ text: 'Say OK' }] }], 'gemini-2.5-flash', 0.5);
  }
}
