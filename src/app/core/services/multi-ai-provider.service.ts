import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SeoAnalyzerService } from './seo-analyzer.service';
import { SearchService, ResearchData } from './search.service';

export interface AIProvider {
  id: string;
  name: string;
  logo: string;
  color: string;
  models: AIModel[];
  requiresApiKey: boolean;
  apiKeyPrefix?: string;
  isFree?: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
}

export interface GenerationOptions {
  keyword: string;
  tone?: string;
  wordCount?: number;
  template?: string;
  includeImages?: boolean;
  language?: string;
}

export interface AIError {
  code: string;
  message: string;
  provider: string;
  isQuotaError: boolean;
  retryAfter?: number;
  suggestions: string[];
}

export interface GenerationResult {
  content?: any;
  provider: string;
  success: boolean;
  error?: AIError;
}

@Injectable({
  providedIn: 'root',
})
export class MultiAIProviderService {
  private apiKeys: { [key: string]: string } = {};
  private selectedProvider: string = 'auto';
  private selectedModel: string = 'auto';
  private searchService: SearchService;
  private opencodeUrl: string = 'http://localhost:4096';
  private opencodeConnected: boolean = false;

  readonly providers: AIProvider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      logo: '🤖',
      color: '#10a37f',
      requiresApiKey: true,
      apiKeyPrefix: 'sk-',
      models: [
        { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxTokens: 16384 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, maxTokens: 16384 },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, maxTokens: 4096 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, maxTokens: 4096 },
        { id: 'o1-preview', name: 'o1 Preview', contextWindow: 128000, maxTokens: 32768 },
        { id: 'o1-mini', name: 'o1 Mini', contextWindow: 65536, maxTokens: 32768 },
      ],
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      logo: '🧠',
      color: '#cc785c',
      requiresApiKey: true,
      apiKeyPrefix: 'sk-ant-',
      models: [
        {
          id: 'claude-opus-4-5-20251120',
          name: 'Claude Opus 4.6',
          contextWindow: 1000000,
          maxTokens: 128000,
        },
        {
          id: 'claude-sonnet-4-6-20250514',
          name: 'Claude Sonnet 4.6',
          contextWindow: 1000000,
          maxTokens: 64000,
        },
        {
          id: 'claude-haiku-4-5-20251120',
          name: 'Claude Haiku 4.5',
          contextWindow: 200000,
          maxTokens: 64000,
        },
      ],
    },
    {
      id: 'google',
      name: 'Google Gemini',
      logo: '✨',
      color: '#4285f4',
      requiresApiKey: true,
      apiKeyPrefix: 'AIza',
      models: [
        {
          id: 'gemini-3.1-pro-preview',
          name: 'Gemini 3.1 Pro',
          contextWindow: 1000000,
          maxTokens: 8192,
        },
        {
          id: 'gemini-3-flash-preview',
          name: 'Gemini 3 Flash',
          contextWindow: 1000000,
          maxTokens: 8192,
        },
        {
          id: 'gemini-3.1-flash-lite-preview',
          name: 'Gemini 3.1 Flash Lite',
          contextWindow: 1000000,
          maxTokens: 8192,
        },
        {
          id: 'gemini-2.5-pro',
          name: 'Gemini 2.5 Pro',
          contextWindow: 1000000,
          maxTokens: 8192,
        },
        {
          id: 'gemini-2.5-flash',
          name: 'Gemini 2.5 Flash',
          contextWindow: 1000000,
          maxTokens: 8192,
        },
        {
          id: 'gemini-2.5-flash-lite',
          name: 'Gemini 2.5 Flash Lite',
          contextWindow: 1000000,
          maxTokens: 8192,
        },
      ],
    },
    {
      id: 'groq',
      name: 'Groq',
      logo: '⚡',
      color: '#7b68ee',
      requiresApiKey: true,
      apiKeyPrefix: 'gsk_',
      isFree: true,
      models: [
        {
          id: 'llama-3.3-70b-versatile',
          name: 'Llama 3.3 70B',
          contextWindow: 128000,
          maxTokens: 8192,
        },
        {
          id: 'llama-3.1-70b-versatile',
          name: 'Llama 3.1 70B',
          contextWindow: 128000,
          maxTokens: 8192,
        },
        {
          id: 'llama-3.1-8b-instant',
          name: 'Llama 3.1 8B',
          contextWindow: 128000,
          maxTokens: 8192,
        },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', contextWindow: 32768, maxTokens: 32768 },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B', contextWindow: 8192, maxTokens: 8192 },
      ],
    },
    {
      id: 'cohere',
      name: 'Cohere',
      logo: '🌊',
      color: '#00d4aa',
      requiresApiKey: true,
      apiKeyPrefix: '',
      models: [
        { id: 'command-r-plus', name: 'Command R+', contextWindow: 128000, maxTokens: 4096 },
        { id: 'command-r', name: 'Command R', contextWindow: 128000, maxTokens: 4096 },
        { id: 'command', name: 'Command', contextWindow: 4096, maxTokens: 4096 },
      ],
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      logo: '🌋',
      color: '#f45d22',
      requiresApiKey: true,
      apiKeyPrefix: '',
      models: [
        {
          id: 'mistral-large-latest',
          name: 'Mistral Large',
          contextWindow: 128000,
          maxTokens: 32000,
        },
        {
          id: 'mistral-small-latest',
          name: 'Mistral Small',
          contextWindow: 128000,
          maxTokens: 32000,
        },
        { id: 'codestral-latest', name: 'Codestral', contextWindow: 256000, maxTokens: 32000 },
        { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B', contextWindow: 65536, maxTokens: 32000 },
      ],
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      logo: '🔍',
      color: '#e63946',
      requiresApiKey: true,
      apiKeyPrefix: 'pplx-',
      models: [
        {
          id: 'llama-3.1-sonar-large-128k-online',
          name: 'Sonar Large Online',
          contextWindow: 127000,
          maxTokens: 8192,
        },
        {
          id: 'llama-3.1-sonar-huge-128k-online',
          name: 'Sonar Huge Online',
          contextWindow: 127000,
          maxTokens: 8192,
        },
        {
          id: 'llama-3.1-sonar-large-128k-chat',
          name: 'Sonar Large Chat',
          contextWindow: 127000,
          maxTokens: 8192,
        },
      ],
    },
    {
      id: 'xai',
      name: 'xAI Grok',
      logo: '🪐',
      color: '#a84532',
      requiresApiKey: true,
      apiKeyPrefix: 'xai-',
      models: [
        { id: 'grok-2', name: 'Grok 2', contextWindow: 131072, maxTokens: 8192 },
        { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', contextWindow: 32768, maxTokens: 8192 },
        { id: 'grok-beta', name: 'Grok Beta', contextWindow: 131072, maxTokens: 8192 },
      ],
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      logo: '🔮',
      color: '#6b9fff',
      requiresApiKey: true,
      apiKeyPrefix: 'sk-',
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek V3', contextWindow: 640000, maxTokens: 8192 },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', contextWindow: 163840, maxTokens: 8192 },
        { id: 'deepseek-reasoner', name: 'DeepSeek R1', contextWindow: 640000, maxTokens: 8192 },
      ],
    },
    {
      id: 'opencode',
      name: 'OpenCode AI',
      logo: '🔧',
      color: '#22c55e',
      requiresApiKey: false,
      isFree: true,
      models: [
        { id: 'auto', name: 'Auto (Best Available)', contextWindow: 200000, maxTokens: 8192 },
      ],
    },
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      logo: '🏠',
      color: '#8b5cf6',
      requiresApiKey: false,
      models: [
        { id: 'qwen3:8b', name: 'Qwen 3 8B', contextWindow: 32768, maxTokens: 8192 },
        {
          id: 'qwen2.5-coder:latest',
          name: 'Qwen 2.5 Coder',
          contextWindow: 32768,
          maxTokens: 8192,
        },
        {
          id: 'deepseek-coder-v2:16b',
          name: 'DeepSeek Coder 16B',
          contextWindow: 16384,
          maxTokens: 8192,
        },
      ],
    },
    {
      id: 'lmstudio',
      name: 'LM Studio (Local)',
      logo: '💻',
      color: '#f97316',
      requiresApiKey: false,
      models: [{ id: 'local', name: 'Local Server', contextWindow: 128000, maxTokens: 8192 }],
    },
    {
      id: 'localai',
      name: 'LocalAI',
      logo: '🔧',
      color: '#22c55e',
      requiresApiKey: false,
      models: [{ id: 'local', name: 'LocalAI Server', contextWindow: 128000, maxTokens: 8192 }],
    },
  ];

  constructor(private seoAnalyzer: SeoAnalyzerService) {
    this.searchService = new SearchService();
    this.loadSavedSettings();
    this.checkOpenCodeConnection();
  }

  private async checkOpenCodeConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.opencodeUrl}/global/health`);
      if (response.ok) {
        const data = await response.json();
        this.opencodeConnected = true;
        console.log('OpenCode AI connected! Version:', data.version);
      }
    } catch (e) {
      this.opencodeConnected = false;
      console.log('OpenCode not running on localhost:4096');
    }
  }

  isOpenCodeConnected(): boolean {
    return this.opencodeConnected;
  }

  private loadSavedSettings(): void {
    try {
      const saved = localStorage.getItem('ai_multi_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.selectedProvider = settings.provider || 'auto';
        this.selectedModel = settings.model || 'auto';
        this.apiKeys = settings.apiKeys || {};
      }
    } catch (e) {
      console.log('Could not load AI settings');
    }
  }

  saveSettings(): void {
    const settings = {
      provider: this.selectedProvider,
      model: this.selectedModel,
      apiKeys: this.apiKeys,
    };
    localStorage.setItem('ai_multi_settings', JSON.stringify(settings));
  }

  setProvider(providerId: string): void {
    this.selectedProvider = providerId;
    const provider = this.providers.find((p) => p.id === providerId);
    if (provider && provider.models.length > 0) {
      this.selectedModel = provider.models[0].id;
    }
    this.saveSettings();
  }

  setModel(modelId: string): void {
    this.selectedModel = modelId;
    this.saveSettings();
  }

  setApiKey(providerId: string, apiKey: string): void {
    this.apiKeys[providerId] = apiKey;
    this.saveSettings();
  }

  getApiKey(providerId: string): string {
    return this.apiKeys[providerId] || '';
  }

  getSelectedProvider(): string {
    return this.selectedProvider;
  }

  getSelectedModel(): string {
    return this.selectedModel;
  }

  getActiveProvider(): AIProvider | null {
    if (this.selectedProvider === 'auto') {
      for (const provider of this.providers) {
        if (!provider.requiresApiKey || this.apiKeys[provider.id]) {
          return provider;
        }
      }
      return null;
    }
    return this.providers.find((p) => p.id === this.selectedProvider) || null;
  }

  generateContent(options: GenerationOptions): Observable<any> {
    const provider = this.getActiveProvider();

    if (!provider) {
      return throwError(() => this.createNoProviderError());
    }

    return this.generateWithFallback(options, provider);
  }

  private generateWithFallback(
    options: GenerationOptions,
    failedProvider?: AIProvider,
  ): Observable<any> {
    const provider = failedProvider || this.getActiveProvider();

    if (!provider) {
      return throwError(() => this.createNoProviderError());
    }

    const apiKey = this.apiKeys[provider.id];
    const model = this.selectedModel === 'auto' ? provider.models[0]?.id : this.selectedModel;

    console.log(`Generating content with ${provider.name} (${model})`);

    let observable: Observable<any>;

    switch (provider.id) {
      case 'openai':
        observable = this.generateWithOpenAI(options, apiKey, model);
        break;
      case 'anthropic':
        observable = this.generateWithClaude(options, apiKey, model);
        break;
      case 'google':
        observable = this.generateWithGemini(options, apiKey, model);
        break;
      case 'groq':
        observable = this.generateWithGroq(options, apiKey, model);
        break;
      case 'xai':
        observable = this.generateWithGrok(options, apiKey, model);
        break;
      case 'mistral':
        observable = this.generateWithMistral(options, apiKey, model);
        break;
      case 'deepseek':
        observable = this.generateWithDeepSeek(options, apiKey, model);
        break;
      case 'perplexity':
        observable = this.generateWithPerplexity(options, apiKey, model);
        break;
      case 'cohere':
        observable = this.generateWithCohere(options, apiKey, model);
        break;
      case 'ollama':
      case 'lmstudio':
      case 'localai':
        observable = this.generateWithLocal(options, provider.id, model);
        break;
      case 'opencode':
        observable = this.generateWithOpenCode(options);
        break;
      default:
        observable = this.generateWithGroq(options, apiKey, model);
    }

    return observable.pipe(
      catchError((error) => {
        console.error(`Error with ${provider.name}:`, error.message);

        if (this.isQuotaError(error)) {
          const freeProvider = this.getNextFreeProvider(provider.id);
          if (freeProvider) {
            console.log(
              `Quota exceeded for ${provider.name}. Falling back to ${freeProvider.name}...`,
            );
            return this.generateWithFallback(options, freeProvider);
          }
        }

        return throwError(() => this.createAIError(error, provider));
      }),
    );
  }

  private getNextFreeProvider(excludeId: string): AIProvider | null {
    const freeProviders = this.providers.filter((p) => {
      if (p.isFree && p.id !== excludeId) {
        if (p.id === 'opencode') {
          return this.opencodeConnected;
        }
        return !!this.apiKeys[p.id];
      }
      return false;
    });
    return freeProviders[0] || null;
  }

  private isQuotaError(error: any): boolean {
    const errorMsg = (error.message || '').toLowerCase();
    const errorCode = (error.code || '').toLowerCase();
    return (
      errorMsg.includes('quota') ||
      errorMsg.includes('rate limit') ||
      errorMsg.includes('429') ||
      errorMsg.includes('exceeded') ||
      errorCode.includes('quota') ||
      errorMsg.includes('billing')
    );
  }

  private createAIError(originalError: any, provider: AIProvider): AIError {
    const message = originalError.message || 'Unknown error';
    const suggestions: string[] = [];

    if (this.isQuotaError(originalError)) {
      if (this.opencodeConnected) {
        suggestions.push('Try OpenCode AI (FREE - running locally)');
      }
      suggestions.push('Switch to Groq (FREE with llama-3.3-70b-versatile)');
      suggestions.push('Get free API keys from provider dashboards');
      suggestions.push('Wait for quota reset (usually hourly/daily)');
    }

    if (message.includes('401') || message.includes('unauthorized')) {
      suggestions.push('Check your API key is correct');
    }

    if (message.includes('404') || message.includes('not found')) {
      suggestions.push('Model may have changed. Try a different model.');
    }

    return {
      code: originalError.code || 'UNKNOWN',
      message: message,
      provider: provider.name,
      isQuotaError: this.isQuotaError(originalError),
      retryAfter: this.extractRetryTime(message),
      suggestions,
    };
  }

  private createNoProviderError(): AIError {
    return {
      code: 'NO_PROVIDER',
      message: 'No AI provider configured. Please add an API key in AI Models settings.',
      provider: 'none',
      isQuotaError: false,
      suggestions: [
        'Go to AI Models in sidebar',
        'Select Groq (FREE) or any other provider',
        'Enter your API key and save',
      ],
    };
  }

  private extractRetryTime(message: string): number | undefined {
    const match = message.match(/retry.*?(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return undefined;
  }

  getAvailableProviders(): AIProvider[] {
    return this.providers.filter((p) => !p.requiresApiKey || this.apiKeys[p.id]);
  }

  getFreeProviders(): AIProvider[] {
    return this.providers.filter((p) => p.isFree && this.apiKeys[p.id]);
  }

  getProviderById(id: string): AIProvider | undefined {
    return this.providers.find((p) => p.id === id);
  }

  private generateWithOpenAI(
    options: GenerationOptions,
    apiKey: string,
    model: string,
  ): Observable<any> {
    return new Observable((observer) => {
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: this.getSystemPrompt(options) },
            { role: 'user', content: this.getUserPrompt(options) },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.choices?.[0]?.message?.content) {
            observer.next(this.processContent(data.choices[0].message.content, options));
            observer.complete();
          } else {
            observer.error(new Error(data.error?.message || 'OpenAI API error'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private generateWithClaude(
    options: GenerationOptions,
    apiKey: string,
    model: string,
  ): Observable<any> {
    return new Observable((observer) => {
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 8192,
          messages: [
            {
              role: 'user',
              content: `${this.getSystemPrompt(options)}\n\n${this.getUserPrompt(options)}`,
            },
          ],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.content?.[0]?.text) {
            observer.next(this.processContent(data.content[0].text, options));
            observer.complete();
          } else {
            observer.error(new Error(data.error?.message || 'Claude API error'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private generateWithGemini(
    options: GenerationOptions,
    apiKey: string,
    model: string,
  ): Observable<any> {
    return new Observable((observer) => {
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${this.getSystemPrompt(options)}\n\n${this.getUserPrompt(options)}` },
                ],
              },
            ],
            generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
          }),
        },
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            observer.next(this.processContent(data.candidates[0].content.parts[0].text, options));
            observer.complete();
          } else {
            observer.error(new Error('Gemini API error'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private generateWithGroq(
    options: GenerationOptions,
    apiKey: string,
    model: string,
  ): Observable<any> {
    return new Observable((observer) => {
      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: this.getSystemPrompt(options) },
            { role: 'user', content: this.getUserPrompt(options) },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.choices?.[0]?.message?.content) {
            observer.next(this.processContent(data.choices[0].message.content, options));
            observer.complete();
          } else {
            observer.error(new Error(data.error?.message || 'Groq API error'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private generateWithGrok(
    options: GenerationOptions,
    apiKey: string,
    model: string,
  ): Observable<any> {
    return new Observable((observer) => {
      fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: this.getSystemPrompt(options) },
            { role: 'user', content: this.getUserPrompt(options) },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.choices?.[0]?.message?.content) {
            observer.next(this.processContent(data.choices[0].message.content, options));
            observer.complete();
          } else {
            observer.error(new Error(data.error?.message || 'Grok API error'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private generateWithMistral(
    options: GenerationOptions,
    apiKey: string,
    model: string,
  ): Observable<any> {
    return new Observable((observer) => {
      fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: this.getSystemPrompt(options) },
            { role: 'user', content: this.getUserPrompt(options) },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.choices?.[0]?.message?.content) {
            observer.next(this.processContent(data.choices[0].message.content, options));
            observer.complete();
          } else {
            observer.error(new Error(data.error?.message || 'Mistral API error'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private generateWithDeepSeek(
    options: GenerationOptions,
    apiKey: string,
    model: string,
  ): Observable<any> {
    return new Observable((observer) => {
      fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: this.getSystemPrompt(options) },
            { role: 'user', content: this.getUserPrompt(options) },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.choices?.[0]?.message?.content) {
            observer.next(this.processContent(data.choices[0].message.content, options));
            observer.complete();
          } else {
            observer.error(new Error(data.error?.message || 'DeepSeek API error'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private generateWithPerplexity(
    options: GenerationOptions,
    apiKey: string,
    model: string,
  ): Observable<any> {
    return new Observable((observer) => {
      fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: this.getSystemPrompt(options) },
            { role: 'user', content: this.getUserPrompt(options) },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.choices?.[0]?.message?.content) {
            observer.next(this.processContent(data.choices[0].message.content, options));
            observer.complete();
          } else {
            observer.error(new Error(data.error?.message || 'Perplexity API error'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private generateWithCohere(
    options: GenerationOptions,
    apiKey: string,
    model: string,
  ): Observable<any> {
    return new Observable((observer) => {
      fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: `${this.getSystemPrompt(options)}\n\n${this.getUserPrompt(options)}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.text) {
            observer.next(this.processContent(data.text, options));
            observer.complete();
          } else {
            observer.error(new Error(data.error?.message || 'Cohere API error'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private generateWithLocal(
    options: GenerationOptions,
    provider: string,
    model: string,
  ): Observable<any> {
    let baseUrl = 'http://localhost:11434';

    if (provider === 'lmstudio') {
      baseUrl = 'http://localhost:1234';
    } else if (provider === 'localai') {
      baseUrl = 'http://localhost:8080';
    }

    return new Observable((observer) => {
      fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: this.getSystemPrompt(options) },
            { role: 'user', content: this.getUserPrompt(options) },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.choices?.[0]?.message?.content) {
            observer.next(this.processContent(data.choices[0].message.content, options));
            observer.complete();
          } else {
            observer.error(new Error('Local AI server error - make sure it is running'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private generateWithOpenCode(options: GenerationOptions): Observable<any> {
    return new Observable((observer) => {
      if (!this.opencodeConnected) {
        observer.error(new Error('OpenCode server not running. Start it with: opencode serve'));
        return;
      }

      const systemPrompt = this.getSystemPrompt(options);
      const userPrompt = this.getUserPrompt(options);
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      fetch(`${this.opencodeUrl}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
        .then((res) => res.json())
        .then((session) => {
          const sessionId = session.id || session.ID;
          if (!sessionId) {
            throw new Error('Failed to create OpenCode session');
          }

          return fetch(`${this.opencodeUrl}/session/${sessionId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parts: [{ type: 'text', text: fullPrompt }],
            }),
          });
        })
        .then((res) => res.json())
        .then((data) => {
          let content = '';

          if (data.parts && Array.isArray(data.parts)) {
            for (const part of data.parts) {
              if (part.type === 'text' && part.text) {
                content += part.text;
              }
            }
          }

          if (!content && data.content) {
            content =
              typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
          }

          if (!content && data.message?.content) {
            content = data.message.content;
          }

          if (!content && data.response) {
            content = data.response;
          }

          if (content) {
            observer.next(this.processContent(content, options));
            observer.complete();
          } else {
            console.log('OpenCode response:', JSON.stringify(data).substring(0, 500));
            observer.error(new Error('Empty response from OpenCode'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  private getSystemPrompt(options: GenerationOptions): string {
    const tone = options.tone || 'professional';
    const lang = options.language || 'en';

    const langNames: { [key: string]: string } = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      pt: 'Portuguese',
      it: 'Italian',
      ar: 'Arabic',
      hi: 'Hindi',
    };

    return `You are an expert content writer specializing in creating high-quality, SEO-optimized articles. 

Requirements:
- Write in ${langNames[lang] || 'English'}
- Tone: ${tone}
- Word count: ${options.wordCount || 1500}+ words
- ALWAYS include the keyword "${options.keyword}" in the first sentence
- Include "${options.keyword}" in at least 4 different H2 headings
- Keyword density: 1.5-2.5%
- Include 3-5 external links to authoritative sources
- Include FAQ section with 5 questions at the end
- Format with HTML tags: <h2>, <p>, <ul>, <li>, <strong>

CRITICAL RULES:
1. NEVER use fake product names, specs, or dates
2. Use natural, human-like writing
3. Get straight to the point - no fluff
4. Mix sentence lengths for readability
5. NEVER use these phrases: "in today's world", "let's dive deep", "game-changer", "revolutionary"
6. Include real facts and statistics when possible
7. Current date: March 2026`;
  }

  private getUserPrompt(options: GenerationOptions): string {
    return `Write a comprehensive, SEO-optimized article about "${options.keyword}".

Article Structure (8-10 sections):
1. Introduction - Hook the reader, mention keyword
2. Key facts about ${options.keyword}
3. How it works / Main features
4. Benefits and advantages
5. Statistics and data
6. Recent developments (2025-2026)
7. Comparisons or alternatives
8. How to get started
9. Common questions (FAQ)
10. Conclusion

Write ONLY the article content. Start directly with the first heading. No preamble.`;
  }

  private processContent(content: string, options: GenerationOptions): any {
    let title = '';
    const h2Matches = content.match(/<h2[^>]*>([^<]+)<\/h2>/gi);
    if (h2Matches && h2Matches.length > 0) {
      title = h2Matches[0].replace(/<[^>]*>/g, '').trim();
    }
    if (!title || title.length < 10) {
      title = `The Complete Guide to ${options.keyword}`;
    }

    const metaDescription = this.seoAnalyzer.generateMetaDescription(content, options.keyword, 155);

    return {
      title,
      content,
      metaDescription,
      focusKeyword: options.keyword,
      suggestedTags: this.generateTags(options.keyword),
    };
  }

  private generateTags(keyword: string): string[] {
    const words = keyword.toLowerCase().split(/\s+/);
    return [
      keyword,
      words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      ...words.slice(0, 3),
      'technology',
      '2026',
      'guide',
    ].slice(0, 8);
  }

  generateTestContent(keyword: string): Observable<any> {
    const options: GenerationOptions = {
      keyword,
      tone: 'professional',
      wordCount: 500,
    };
    return this.generateContent(options);
  }
}
